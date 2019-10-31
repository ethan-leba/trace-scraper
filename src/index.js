const puppeteer = require("puppeteer");
require("dotenv").config();
const _cliProgress = require("cli-progress");
const async = require("async");
const page_handler = require("./page_handler");
const fs = require("fs");
const selectors = JSON.parse(fs.readFileSync("selectors.json"));

async function run() {
  console.log("Launching chromium...");
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();

  console.log("Launching TRACE website...");
  await page.goto("https://www.applyweb.com/eval/shibboleth/neu/36892");
  await page.waitForSelector(selectors.login.button);
  await page.click(selectors.login.username);
  await page.keyboard.type(process.env.myNEU_username);

  await page.click(selectors.login.password);
  await page.keyboard.type(process.env.myNEU_password);

  await page.click(selectors.login.button);

  await page.waitForNavigation();

  await page.waitForSelector(selectors.login.trace_indicator);
  await page.goto("https://www.applyweb.com/eval/new/reportbrowser");

  console.log("Collecting links on page 1");
  // pull out the table from the page

  // create a new progress bar instance and use shades_classic theme

  let queue = async.queue(async (url, callback) => {
    await page_handler.scrape(browser, url);
    callback();
  }, 5);

  let urls = [];

  const bar1 = new _cliProgress.SingleBar(
    {},
    _cliProgress.Presets.shades_classic
  );

  let url_queue = async.queue(async (page_no, callback) => {
    const result = await getURLS(browser, page.url(), page_no);
    urls = [...urls, ...result];
    bar1.increment();
    callback();
  }, 5);

  [...Array(10).keys()].forEach(page => url_queue.push(page));

  bar1.start(10, 0);
  await url_queue.drain();
  bar1.stop();

  urls.forEach(page => queue.push(page));
  await queue.drain();

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