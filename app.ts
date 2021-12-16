import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Email from './emailer.js';

puppeteer.use(StealthPlugin());

const url = 'https://suchen.mobile.de/fahrzeuge/search.html?damageUnrepaired=NO_DAMAGE_UNREPAIRED&isSearchRequest=true&makeModelVariant1.makeId=1900&makeModelVariant1.modelId=15&minFirstRegistrationDate=2016-01-01&scopeId=C&sfmr=false&sortOption.sortBy=searchNetGrossPrice&sortOption.sortOrder=ASCENDING';

async function check() {
    try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
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

        // await page.screenshot({ path: 'example.png' });
        await browser.close();
    } catch(e) {
        console.log(e);
    }
};

console.log('Crawler started.');

check();

setInterval(() => {
    check();
}, 60000 * 30);