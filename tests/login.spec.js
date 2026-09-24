const { test, expect, users } = require('./fixtures');

test.describe('Login regression', () => {
  test('standard user can log in', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.getByTestId('title')).toHaveText('Products');
  });

  test('locked-out user receives an error', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    await expect(loginPage.errorMessage).toContainText('locked out');
  });

  test('invalid credentials receive an error', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(users.invalid.username, users.invalid.password);
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('required credentials are validated', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login('', '');
    await expect(loginPage.errorMessage).toContainText('Username is required');
  });
});
