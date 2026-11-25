const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  try {
    const page = await browser.newPage();
    await page.goto('https://www.amazon.in/', { waitUntil: 'domcontentloaded' });
    await page.locator('#twotabsearchtextbox').fill('wireless mouse');
    await page.locator('#nav-search-submit-button').click();
    await page.waitForURL(url => url.pathname.startsWith('/s') && (url.searchParams.has('k') || url.searchParams.has('field-keywords')), { timeout: 15000 });
    const result = page.locator('[data-component-type="s-search-result"]').first();
    console.log(JSON.stringify({
      url: page.url(),
      resultCount: await page.locator('[data-component-type="s-search-result"]').count(),
      firstResultText: (await result.innerText()).slice(0, 300),
      links: await result.locator('a').evaluateAll(links => links.slice(0, 12).map(link => ({ text: link.innerText.slice(0, 90), href: link.getAttribute('href')?.slice(0, 160) }))),
      h2Count: await result.locator('h2').count(),
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
