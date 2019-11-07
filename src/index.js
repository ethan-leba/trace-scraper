const puppeteer = require("puppeteer");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const _cliProgress = require("cli-progress");
const async = require("async");
const page_handler = require("./page_handler");
const fs = require("fs");

const selectors = JSON.parse(fs.readFileSync("selectors.json"));
const config = JSON.parse(fs.readFileSync("config.json"));
require("dotenv").config();

const csvWriter = createCsvWriter({
  path: "out.csv",
  header: [
    { id: "instructor", title: "instructor" },
    { id: "course_name", title: "course_name" },
    { id: "subject", title: "subject" },
    { id: "course_number", title: "course_number" },
    { id: "instructor_effectiveness", title: "i_effectiveness" },
    { id: "avg_hrs_per_week", title: "avg_hrs_per_week" }
  ]
});

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

  // create a new progress bar instance and use shades_classic theme
  let rows = [];
  let class_queue = async.queue(async (url, callback) => {
    rows.push(await page_handler.scrape(browser, url));
    bar.increment();
    callback();
  }, config.no_class_workers);

  // The URLs for each individual class page
  let urls = [];

  let page_queue = async.queue(async (page_no, callback) => {
    const result = await getURLS(browser, page.url(), page_no);
    urls = [...urls, ...result];
    bar.increment();
    callback();
  }, config.no_page_workers);

  [...Array(config.no_pages).keys()].forEach(page => page_queue.push(page));

  bar.start(config.no_pages, 0);
  // Collect all the class page URLS
  await page_queue.drain();
  bar.stop();

  urls.forEach(page => class_queue.push(page));

  bar.start(urls.length, 0);
  // Collect all the data from each class page
  await class_queue.drain();
  bar.stop();

  await csvWriter.writeRecords(rows);

  await page.close();
  await browser.close();
}

async function getURLS(browser, url, page_number) {
  // checks if the class is a law or mls course
  const unwanted_term = t => {
    return (s => s.includes("mls") || s.includes("law"))(t.toLowerCase());
  };
  const localPage = await browser.newPage();
  await localPage.goto(url);
  await localPage.waitForSelector("iframe");
  const iframe = localPage.mainFrame().childFrames()[0];
  await iframe.waitForSelector("td.ng-binding");
  for (var i = 1; i < page_number; i++) {
    await iframe.click(selectors.trace.next_button);
  }
  // waits for content inside of the row to appear
  await iframe.waitForSelector("td.ng-binding");
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

  await localPage.close();
  return urls;
}

run();
