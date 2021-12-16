import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Email from './emailer.js';
import randomUseragent from 'random-useragent';

puppeteer.use(StealthPlugin());

const url = 'https://suchen.mobile.de/fahrzeuge/search.html?damageUnrepaired=NO_DAMAGE_UNREPAIRED&isSearchRequest=true&makeModelVariant1.makeId=1900&makeModelVariant1.modelId=15&minFirstRegistrationDate=2016-01-01&scopeId=C&sfmr=false&sortOption.sortBy=searchNetGrossPrice&sortOption.sortOrder=ASCENDING';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';

async function check() {
    try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        // const page = await browser.newPage();
        const page = await createPage(browser, url);
        // await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
        await page.goto(url);
        const hrefElement = await page.$('.mde-consent-accept-btn');
        await hrefElement?.click();
        const adds = await page.$$('.cBox-body.cBox-body--resultitem');
        let prices = [];
        
        for (const ad of adds) {
            const price = await ad?.$eval('.price-block span:first-child', (e: any) => e.textContent);
            prices.push(parseFloat(price || '0'));
        }

        const sorted = prices.sort((a, b) => a - b);

        const date = new Date().toLocaleString('ro-RO', {timeZone: 'Europe/Bucharest'});
        console.log(`Last checked: ${date}`)

        if (sorted[0] < 30) {
            console.log('Offer bellow 22.000 found!');

            new Email().send({
                from: '"Mobile crawler" <vedtam@gmail.com>',
                to: 'vedtam@gmail.com',
                subject: `New offers bellow 22.000!`,
                html: `
                    Lowest prices are: 
                    <ul>
                        ${sorted.slice(0, 10).map((p) => `<li>${p} €</li>`).join('')}
                    </ul>
                    <a href="${url}" style="margin-top: 20px;" target="_blank">
                        See offers
                    </a>
                `
              });
        }

        await page.screenshot({ path: 'example.png' });
        await browser.close();
    } catch(e) {
        console.log(e);
    }
};

async function createPage (browser: any, url: any) {

    //Randomize User agent or Set a valid one
    const userAgent = randomUseragent.getRandom();
    const UA = USER_AGENT;
    const page = await browser.newPage();

    //Randomize viewport size
    await page.setViewport({
        width: 1920 + Math.floor(Math.random() * 100),
        height: 3000 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: false,
        isMobile: false,
    });

    await page.setUserAgent(UA);
    await page.setJavaScriptEnabled(true);
    await page.setDefaultNavigationTimeout(0);

    //Skip images/styles/fonts loading for performance
    await page.setRequestInterception(true);
    page.on('request', (req: any) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
            req.abort();
        } else {
            req.continue();
        }
    });

    await page.evaluateOnNewDocument(() => {
        // Pass webdriver check
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });

    await page.evaluateOnNewDocument(() => {
        // Pass chrome check
        //@ts-ignore
        window.chrome = {
            runtime: {},
            // etc.
        };
    });

    await page.evaluateOnNewDocument(() => {
        //Pass notifications check
        const originalQuery = window.navigator.permissions.query;
        //@ts-ignore
        return window.navigator.permissions.query = (parameters) => (parameters.name === 'notifications' ? Promise.resolve({ state: Notification.permission }) : originalQuery(parameters));
    });

    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
            // This just needs to have `length > 0` for the current test,
            // but we could mock the plugins too if necessary.
            get: () => [1, 2, 3, 4, 5],
        });
    });

    await page.evaluateOnNewDocument(() => {
        // Overwrite the `languages` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
        });
    });

    await page.goto(url, { waitUntil: 'networkidle2',timeout: 0 } );
    return page;
}

console.log('Crawler started.');

check();

setInterval(() => {
    check();
}, 60000 * 30);