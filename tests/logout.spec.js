const { test, expect } = require('./fixtures');

test('authenticated user can log out', async ({ authenticatedPage, productsPage, page }) => {
  await productsPage.logout();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('login-button')).toBeVisible();
});
