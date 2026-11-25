const { test, expect } = require('@playwright/test');
const { AELoginPage } = require('../../pages/automationexercise/AELoginPage');

test.describe('Automation Exercise - User Authentication Suite', () => {

  test('should display login and signup form elements', async ({ page }) => {
    const loginPage = new AELoginPage(page);
    await loginPage.goto();

    await expect(loginPage.loginTitle).toBeVisible();
    await expect(loginPage.loginEmailInput).toBeVisible();
    await expect(loginPage.loginPasswordInput).toBeVisible();
    await expect(loginPage.loginSubmitBtn).toBeVisible();

    await expect(loginPage.signupTitle).toBeVisible();
    await expect(loginPage.signupNameInput).toBeVisible();
    await expect(loginPage.signupEmailInput).toBeVisible();
    await expect(loginPage.signupSubmitBtn).toBeVisible();
  });

  test('should display error message on invalid login credentials', async ({ page }) => {
    const loginPage = new AELoginPage(page);
    await loginPage.goto();

    await loginPage.login('invalid_user_test_email@example.com', 'wrongpassword123');
    await expect(loginPage.loginErrorMsg).toBeVisible();
    await expect(loginPage.loginErrorMsg).toContainText(/incorrect|invalid/i);
  });

});
