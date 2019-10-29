const fs = require("fs");
const trace_sel = JSON.parse(fs.readFileSync("selectors.json")).trace;

module.exports = {
  scrape: async function(browser, url) {
    const localPage = await browser.newPage();
    await localPage.goto(url);
    await localPage.waitForSelector("iframe");
    const iframe = await localPage.mainFrame().childFrames()[0];
    let data = {};

    for (var attr in trace_sel.text_fields) {
      // unsure if this is necessary
      await iframe.waitForSelector(trace_sel.text_fields[attr]);
      data[attr] = await iframe.evaluate(
        element => element.textContent,
        await iframe.$(trace_sel.text_fields[attr])
      );
    }

    console.log(data);
    await localPage.close();
  }
};
