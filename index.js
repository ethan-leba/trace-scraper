const puppeteer = require('puppeteer');
const CREDS = require('./creds');

async function run() {
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();

    await page.goto('http://my.northeastern.edu/c/portal/login');
    await page.waitFor(1000);

    // logins
    // login selectors
    const USERNAME_SELECTOR = '#username';
    const PASSWORD_SELECTOR = '#password';
    const BUTTON_SELECTOR = 'body > section > div > div:nth-child(1) > div > form > div:nth-child(3) > button';
    // login logic
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(CREDS.username);

    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(CREDS.password);

    await page.click(BUTTON_SELECTOR);

    await page.waitForNavigation();
    await page.waitForSelector('#portlet_com_neu_events_display_portlet_EventsDisplayPortlet_INSTANCE_BL8mcIrWtJXq > div > div > div > div > div.container-header.mobile-collapse > a');

    await page.goto('https://www.applyweb.com/eval/shibboleth/neu/36892');
    await page.waitForSelector('#navbar > ul > li:nth-child(3) > a');
    await page.goto('https://www.applyweb.com/eval/new/reportbrowser');
    await page.waitFor(30000);
    //await page.waitForSelector('#sort-pages', { visible: true, timeout: 0 });   
    await page.screenshot({ path: 'screenshots/github.png' });

    browser.close();
}

run();
