const fs = require("fs");
const selectors = JSON.parse(fs.readFileSync("selectors.json"));

module.exports = {
  scrape: async function(browser, url) {
    const localPage = await browser.newPage();
    await localPage.goto(url);
    await localPage.waitForSelector("iframe");
    const iframe = await localPage.mainFrame().childFrames()[0];
    let data = {};

    for (var attr in selectors.trace) {
      // unsure if this is necessary
      await iframe.waitForSelector(selectors.trace[attr]);
      data[attr] = await iframe.evaluate(
        element => element.textContent,
        await iframe.$(selectors.trace[attr])
      );
    }
    await localPage.close();
  }
};
