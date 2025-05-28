import puppeteer from 'puppeteer';

async function scrapeTechCrunch(url = 'https://techcrunch.com/tag/api/') {
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
        // Removed executablePath - let Puppeteer handle it automatically
    });

    console.log(await browser.version()); // Should print Chromium version


    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    console.log("✅ Launched browser:", await browser.version());

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    const articles = await page.evaluate(() => {
        const selectors = [
            'article.post-block',
            '.post-block',
            'article',
            '[class*="post"]',
            'li[class*="post"]',
            '.wp-block-post-template li'
        ];

        let allArticles = [];
        const seenUrls = new Set(); // Track URLs to avoid duplicates

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`Trying ${selector}: found ${elements.length} elements`);

            if (elements.length > 0) {
                const newArticles = Array.from(elements).map(item => {
                    // Find title and URL
                    let titleEl = item.querySelector('h1 a, h2 a, h3 a, .post-block__title a, header a');
                    if (!titleEl) {
                        // Try to find any link that looks like an article
                        const links = item.querySelectorAll('a');
                        titleEl = Array.from(links).find(link =>
                            link.href.includes('/2024/') ||
                            link.href.includes('/2025/')
                        );
                    }

                    if (!titleEl) return null;

                    let title = titleEl.innerText?.trim() || titleEl.textContent?.trim() || '';
                    let url = titleEl.href || '';

                    // Skip if already seen this URL
                    if (seenUrls.has(url)) return null;

                    // Skip if it's a category/tag URL (contains /category/ or /tag/)
                    if (url.includes('/category/') || url.includes('/tag/') || url.includes('/author/')) {
                        return null;
                    }

                    // Skip if URL doesn't look like an article
                    if (!url.match(/\/\d{4}\/\d{2}\/\d{2}\//)) {
                        return null;
                    }

                    // Add URL to seen set
                    seenUrls.add(url);

                    // Get excerpt
                    let excerptEl = item.querySelector('.post-block__content, .excerpt, p');
                    let excerpt = excerptEl?.innerText?.trim().substring(0, 150) || '';

                    // Get date
                    let dateEl = item.querySelector('time, .date, [datetime]');
                    let publishDate = dateEl?.getAttribute('datetime') || dateEl?.innerText?.trim() || '';

                    return { title, url, excerpt, publishDate };
                })
                    .filter(article =>
                        article &&
                        article.title &&
                        article.url &&
                        article.title.length > 10
                    );

                allArticles.push(...newArticles);
                console.log(`Found ${newArticles.length} new articles with ${selector} (total: ${allArticles.length})`);

                if (allArticles.length >= 15) break;
            }
        }

        if (allArticles.length < 10) {
            console.log('Using fallback method...');
            const links = document.querySelectorAll('a[href*="/2024/"], a[href*="/2025/"]');
            const fallbackArticles = Array.from(links)
                .filter(link =>
                    link.href.match(/\/\d{4}\/\d{2}\/\d{2}\//) &&
                    !link.href.includes('/category/') &&
                    !link.href.includes('/tag/') &&
                    !link.href.includes('/author/') &&
                    !seenUrls.has(link.href)
                )
                .map(link => {
                    seenUrls.add(link.href);
                    return {
                        title: link.innerText?.trim() || link.textContent?.trim() || 'No title',
                        url: link.href,
                        excerpt: '',
                        publishDate: ''
                    };
                })
                .filter(article => article.title.length > 10)
                .slice(0, 15 - allArticles.length); // Only take what we need

            allArticles.push(...fallbackArticles);
        }

        return allArticles.slice(0, 15); // Final limit to 15 articles
    });

    await browser.close();
    return articles;
}

export async function getTechCrunchArticles() {
    try {
        let articles = await scrapeTechCrunch('https://techcrunch.com/tag/api/');

        if (articles.length === 0) {
            const sections = ['startups', 'apps', 'ai', ''];
            for (const section of sections) {
                const url = section ? `https://techcrunch.com/tag/${section}/` : 'https://techcrunch.com/';
                articles = await scrapeTechCrunch(url);
                if (articles.length > 0) break;
            }
        }

        console.log(`Found ${articles.length} TechCrunch articles`);
        return articles;

    } catch (error) {
        console.error('Scraping failed:', error.message);
        return [];
    }
}
