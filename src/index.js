const puppeteer = require("puppeteer");
// const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const _cliProgress = require("cli-progress");
const async = require("async");
const page_handler = require("./page_handler");
const fs = require("fs");

const selectors = JSON.parse(fs.readFileSync("selectors.json"));
const config = JSON.parse(fs.readFileSync("config.json"));
require("dotenv").config();

const debug = require("debug")("scraper:main");
const debug_url = require("debug")("scraper:url");
//const debug_class = require("debug")("scraper:page");

async function run() {
  console.log("Launching chromium...");
  const browser = await puppeteer.launch({
    headless: true
  });

  // Loading bar setup
  const bar = new _cliProgress.SingleBar(
    {},
    _cliProgress.Presets.shades_classic
  );
  const page = await browser.newPage();

  console.log("Launching TRACE website...");
  await page.goto("https://www.applyweb.com/eval/shibboleth/neu/36892");
  await page.waitForSelector(selectors.login.button);
  await page.click(selectors.login.username);
  // eslint-disable-next-line no-undef
  await page.keyboard.type(process.env.myNEU_username);

  await page.click(selectors.login.password);
  // eslint-disable-next-line no-undef
  await page.keyboard.type(process.env.myNEU_password);

  await page.click(selectors.login.button);

  await page.waitForNavigation();

  await page.waitForSelector(selectors.login.trace_indicator);
  await page.goto("https://www.applyweb.com/eval/new/reportbrowser");

  console.log("Collecting links for individual classes...");
  // pull out the table from the page

  // The URLs for each individual class page
  let urls = [];

  // The stream that the program will write to
  let stream = fs.createWriteStream("out.csv");

  let page_queue = async.queue(async page_no => {
    bar.increment();
    let result;
    await async.retry(3, async () => {
      debug_url(`Trying to get page ${page_no}`);
      result = await getURLS(browser, page.url(), page_no);
    });
    urls.push(...result);
  }, config.no_page_workers);

  page_queue.error((err, task) => {
    debug_url(`Page ${task} experienced an error!`);
    debug_url(err);
  });

  let class_queue = async.queue(async url => {
    bar.increment();
    // stream.write("this is a stream.");
    let result;
    await async.retry(3, async () => {
      result = await page_handler.scrape(browser, url);
    });
    result = formatForCSV(result);
    stream.write(Object.values(result).join());
    stream.write("\n");
  }, config.no_class_workers);

  [...Array(config.no_pages).keys()].forEach(page => page_queue.push(page));

  // bar.start(config.no_pages, 0);
  // Collect all the class page URLS
  await page_queue.drain();
  //bar.stop();

  //console.log(urls);
  debug(`Pushing ${urls.length} class pages into the queue`);
  urls.forEach(page => class_queue.push(page));

  // bar.start(urls.length, 0);
  // Collect all the data from each class page

  // Write the CSV column headers
  stream.write(
    [
      ...Object.keys(selectors.trace.text_fields),
      ...config.extra_csv_columns
    ].join() + "\n"
  );

  await class_queue.drain();
  // bar.stop();

  //  await csvWriter.writeRecords(rows);
  stream.end();

  await page.close();
  await browser.close();
}

function formatForCSV(data) {
  // Converts from "Last, First" to "First Last"
  let format_name = name => {
    const name_array = name.split(", ");
    return name_array[1] + " " + name_array[0];
  };

  // Escapes a string for CSV usage.
  let escape_string = str => `"${str}"`;

  // Applying the formatting
  data["name"] = format_name(data["name"]);
  data["course_name"] = escape_string(data["course_name"]);

  return data;
}

async function getURLS(browser, url, page_number) {
  const timeout_length = 5 * 60 * 1000;
  // checks if the class is a law or mls course
  const unwanted_term = t => {
    return (s => s.includes("mls") || s.includes("law"))(t.toLowerCase());
  };
  const localPage = await browser.newPage();
  await localPage.goto(url);
  await localPage.waitForSelector("iframe");
  const iframe = localPage.mainFrame().childFrames()[0];
  await iframe.waitForSelector("td.ng-binding", { timeout: timeout_length });
  for (var i = 1; i < page_number; i++) {
    await iframe.click(selectors.trace.next_button);
  }
  // waits for content inside of the row to appear
  await iframe.waitForSelector("td.ng-binding", { timeout: timeout_length });
  await iframe.waitFor(selectors.trace.table_indicator);
  const table = await iframe.$$("tbody tr");

  let urls = [];
  for (i = 0; i < table.length; i++) {
    const term = await iframe.evaluate(
      element => element.textContent,
      (await table[i].$$("td"))[0]
    );
    const link = await table[i].$("a");
    if (link && !unwanted_term(term)) {
      urls.push(await iframe.evaluate(a => a.href, link));
    }
  }
  debug_url(`${urls.length} URLS found from page: ${page_number}`);

  await localPage.close();
  return urls;
}

run();
