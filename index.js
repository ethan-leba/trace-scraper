const puppeteer = require("puppeteer");
require("dotenv").config();
const { Cluster } = require("puppeteer-cluster");
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

  console.log("Opening portal to myNEU...");

  await page.goto("http://my.northeastern.edu/c/portal/login");
  await page.waitForSelector(selectors.login.button);

  console.log("Logging into myNEU...");

  await page.click(selectors.login.username);
  await page.keyboard.type(process.env.myNEU_username);

  await page.click(selectors.login.password);
  await page.keyboard.type(process.env.myNEU_password);

  await page.click(selectors.login.button);

  await page.waitForNavigation();

  await page.waitForSelector(selectors.login.mainpage_indicator);

  console.log("Launching TRACE website...");
  await page.goto("https://www.applyweb.com/eval/shibboleth/neu/36892");
  await page.waitForSelector(selectors.login.trace_indicator);
  await page.goto("https://www.applyweb.com/eval/new/reportbrowser");

  console.log("Collecting links on page 1");
  // pull out the table from the page

  let queue = async.queue(async (url, callback) => {
    await page_handler.scrape(browser, url);
    callback();
  }, 5);

  (await getURLS(browser, page.url())).forEach(url => queue.push(url));

  await queue.drain();
  //  await async.parallel(urls.map(url => callback => scrapePage(browser, url)));

  await page.close();
  await browser.close();
}

async function getURLS(browser, url) {
  const localPage = await browser.newPage();
  await localPage.goto(url);
  await localPage.waitForSelector("iframe");
  const iframe = localPage.mainFrame().childFrames()[0];
  // waits for content inside of the row to appear
  await iframe.waitForSelector("td.ng-binding");
  await localPage.waitFor(1000);
  const table = await iframe.$$("tbody tr");

  let urls = [];
  for (i = 0; i < table.length; i++) {
    const link = await table[i].$("a");
    if (link) {
      urls.push(await iframe.evaluate(a => a.href, link));
    }
  }

  await localPage.close();
  return urls;
}

run();
