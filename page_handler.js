module.exports = {
  scrape: async function(browser, url) {
    const localPage = await browser.newPage();
    await localPage.goto(url);
    await localPage.waitForSelector("iframe");
    const iframe = await localPage.mainFrame().childFrames()[0];
    // waits for content inside of the row to appear
    const sel =
      "#tapestryContainer > div.container-fluid > div.row > div > div > div.col-xs-6.text-left > ul > li:nth-child(1)";
    await iframe.waitForSelector(sel);
    let data = {};
    data["instructor"] = await iframe.evaluate(
      element => element.textContent,
      await iframe.$(
        "#tapestryContainer > div.container-fluid > div.row > div > div > div.col-xs-6.text-left > ul > li:nth-child(1) > strong"
      )
    );
    data["course_name"] = await iframe.evaluate(
      element => element.textContent,
      await iframe.$(
        "#tapestryContainer > div.container-fluid > div.row > div > div > div.col-xs-6.text-left > ul > li:nth-child(3) > strong"
      )
    );
    data["subject"] = await iframe.evaluate(
      element => element.textContent,
      await iframe.$(
        "#tapestryContainer > div.container-fluid > div.row > div > div > div.col-xs-6.text-left > ul > li:nth-child(5) > strong"
      )
    );
    data["course_number"] = await iframe.evaluate(
      element => element.textContent,
      await iframe.$(
        "#tapestryContainer > div.container-fluid > div.row > div > div > div.col-xs-6.text-right > ul > li:nth-child(5) > strong"
      )
    );

    console.log(data);
    await localPage.close();
  }
};
