const { test, expect } = require('@playwright/test');
const appUrl = process.env.TESTSPHERE_BASE_URL || 'http://localhost:3000';

test('My Website card runs a real QA Lab login on the dashboard', async ({ page }) => {
  await page.goto(`${appUrl}/platform/`);
  await expect(page.locator('.target-card')).toHaveCount(3);
  await page.locator('.target-card[data-target="my-website"]').click();
  await expect(page.locator('#custom-url')).toHaveCount(0);
  await expect(page.locator('.target-card[data-target="my-website"]')).toContainText(new URL(appUrl).port);
  await page.locator('.individual-run[data-test="local-login"]').click();
  await expect(page.locator('#dashboard-page')).toHaveClass(/active/);
  await expect(page.locator('#laboratory-page')).toHaveClass(/active/);
  await expect(page.locator('#run-state')).toContainText('1 passed', { timeout: 30_000 });
  await expect(page.locator('.browser-panel')).toBeHidden();
});

test('My Website Run All executes the QA Lab suite', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto(`${appUrl}/platform/`);
  await page.locator('.target-card[data-target="my-website"]').click();
  await page.locator('#run-all').click();
  await expect(page.locator('#test-progress .progress-row')).toHaveCount(30);
  await expect(page.locator('#progress-title')).toContainText('30 / 30 completed', { timeout: 230_000 });
  await expect(page.locator('#run-state')).toContainText('30 passed');
  await page.screenshot({ path: 'test-results/live-control-room.png' });
});

test('saved run history is visible after a dashboard reload', async ({ page, request }) => {
  const response = await request.get(`${appUrl}/api/execution/history?limit=1`);
  expect(response.ok()).toBeTruthy();
  const { runs } = await response.json();
  expect(runs.length).toBeGreaterThan(0);
  const savedId = runs[0].id;
  await page.goto(`${appUrl}/platform/`);
  await page.locator('.nav[data-page="history"]').click();
  await expect(page.locator(`#history-list tr[data-run="${savedId}"]`)).toBeVisible();
  await page.reload();
  await page.locator('.nav[data-page="history"]').click();
  await expect(page.locator(`#history-list tr[data-run="${savedId}"]`)).toBeVisible();
});
