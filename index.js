const puppeteer = require('puppeteer');
const { Cluster } = require('puppeteer-cluster');

const CREDS = require('./creds');

async function run() {
    console.log("Launching chromium...");
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
    console.log("Logging into myNEU...");
	// login logic
	await page.click(USERNAME_SELECTOR);
	await page.keyboard.type(CREDS.username);

	await page.click(PASSWORD_SELECTOR);
	await page.keyboard.type(CREDS.password);

	await page.click(BUTTON_SELECTOR);

	await page.waitForNavigation();

	// get on to the trace website
	await page.waitForSelector('#portlet_com_neu_events_display_portlet_EventsDisplayPortlet_INSTANCE_BL8mcIrWtJXq > div > div > div > div > div.container-header.mobile-collapse > a');

    console.log("Launching TRACE website...");
	await page.goto('https://www.applyweb.com/eval/shibboleth/neu/36892');
	await page.waitForSelector('#navbar > ul > li:nth-child(3) > a');
	await page.goto('https://www.applyweb.com/eval/new/reportbrowser');

	// we can now scrape

    console.log("Collecting links on page 1");
	// pull out the table from the page
	await page.waitForSelector('iframe');
	const iframe = await page.mainFrame().childFrames()[0];
	// waits for content inside of the row to appear
	await iframe.waitForSelector('td.ng-binding');
	await page.waitFor(1000);
	const table = await iframe.$$('tbody tr');

	let urls = []
	for(i = 0; i < table.length; i++) {
		const link = await table[i].$('a');
		if(link) {
			urls.push(await iframe.evaluate(a => a.href, link));
		}
	}
	console.log(urls);
    for(i = 0; i < urls.length; i++) {
        const localPage = await browser.newPage();
		await localPage.goto(urls[i]);
        await localPage.waitForSelector('iframe');
        const iframe = await localPage.mainFrame().childFrames()[0];
        // waits for content inside of the row to appear
        const sel = '#tapestryContainer > div.container-fluid > div.row > div > div > div.col-xs-6.text-left > ul > li:nth-child(1)';
        await iframe.waitForSelector(sel);
//        await page.waitFor(500);
        const element = await iframe.$(sel);
        const text = await iframe.evaluate(element => element.textContent, element);
        console.log(text);
    }
    /*
	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_CONTEXT,
		maxConcurrency: 5,
	});

	await cluster.task(async ({ page, data: url }) => {
		await page.goto(url);
        await page.waitForSelector('iframe');
        const iframe = await page.mainFrame().childFrames()[0];
        // waits for content inside of the row to appear
        await iframe.waitForSelector('#tapestryContainer > div.container-fluid > div.row > div > div > div.col-xs-6.text-left > ul');
		await page.screenshot({'path': url});
		// Store screenshot, do something else
	});

	for(i = 0; i < urls.length; i++) {
	    cluster.queue(urls[i]);
	}*/
	// many more pages

	await cluster.idle();
	await cluster.close();
	//await page.screenshot({ path: 'screenshots/github.png' });

	browser.close();
}

run();
