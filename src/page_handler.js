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

    await localPage.waitFor(3000);

    // text fields not requiring processing
    for (var attr in trace_sel.text_fields) {
      data[attr] = await getField(iframe, trace_sel.text_fields[attr]);
    }

    // special cases
    data["is_summer"] = isSummer(await getField(iframe, trace_sel.class_title));
    data["avg_hrs_per_week"] = (await scrapePieChart(iframe)).toString();
    console.log(data);
    await localPage.close();
  }
};

const isSummer = title => {
  return title.toLowerCase().includes("summer");
};
// Extracts the text of a selector
async function getField(frame, sel) {
  await frame.waitForSelector(sel);
  return await frame.evaluate(
    element => element.textContent,
    await frame.$(sel)
  );
}

// Gets the value of two text fields and returns the difference
async function getDifference(frame, sel_A, sel_B) {
  return (
    (await getField(frame, sel_A)).parseInt() -
    (await getField(frame, sel_B)).parseInt()
  );
}

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
