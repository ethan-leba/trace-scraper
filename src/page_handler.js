const fs = require("fs");
const async = require("async");
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

    data["avg_hrs_per_week"] = (await scrapePieChart(iframe)).toString();
    console.log(data);
    await localPage.close();
  }
};

// collects the data from the pie chart and processes it into an average
async function scrapePieChart(frame) {
  const tooltip_to_num = tooltip => {
    const numbers = tooltip
      .replace(/\D+/g, " ")
      .split(" ")
      .map(x => parseInt(x));
    return (((numbers[0] + numbers[1]) / 2) * numbers[3]) / 100;
  };
  const pie_tooltips = await frame.$$(`${trace_sel.pie_chart} text`);
  // calculating the average
  // the amount of entries
  let sum = 0;
  await async.map(pie_tooltips, async tooltip => {
    const txt = await frame.evaluate(element => element.textContent, tooltip);
    sum += tooltip_to_num(txt);
  });
  return sum;
}
