const { chromium } = require('@playwright/test');

(async () => {
  for (const channel of [undefined, 'chrome']) {
    const label = channel || 'playwright-chromium';
    let browser;
    try {
      browser = await chromium.launch({ headless: false, ...(channel ? { channel } : {}) });
      const page = await browser.newPage();
      const failedRequests = [];
      const pageErrors = [];
      page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
      page.on('pageerror', error => pageErrors.push(error.message));
      const response = await page.goto('https://www.amazon.in/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('#twotabsearchtextbox').waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
      console.log(JSON.stringify({
        browser: label,
        status: response?.status(),
        url: page.url(),
        title: await page.title(),
        bodyLength: (await page.locator('body').innerText().catch(() => '')).length,
        htmlLength: (await page.content()).length,
        searchVisible: await page.locator('#twotabsearchtextbox').isVisible(),
        failedRequests: failedRequests.slice(0, 8),
        pageErrors: pageErrors.slice(0, 8),
      }, null, 2));
    } catch (error) {
      console.log(JSON.stringify({ browser: label, error: error.message }));
    } finally {
      await browser?.close().catch(() => {});
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
