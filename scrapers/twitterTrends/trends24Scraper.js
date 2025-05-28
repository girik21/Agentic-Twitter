import puppeteer from 'puppeteer';

export async function scrapeTrends24() {

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });

    console.log(await browser.version()); // Should print Chromium version

    const page = await browser.newPage();

    await page.goto('https://trends24.in/united-states/', {
        waitUntil: 'domcontentloaded', // more forgiving than 'networkidle2'
        timeout: 60000, // ⏱️ increase timeout to 60 seconds
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const hashtags = await page.evaluate(() => {
        const trendEls = document.querySelectorAll('.trend-card__list li a');
        return Array.from(trendEls).map(el => el.textContent.trim());
    });

    await browser.close();

    return hashtags.slice(0, 60)
}
