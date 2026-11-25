const { test, expect } = require('@playwright/test');

test.describe('QA Lab Local Web Application Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should log in standard user successfully', async ({ page }) => {
    await page.getByTestId('username-input').fill('standard_user');
    await page.getByTestId('password-input').fill('secret_sauce');
    await page.getByTestId('login-submit-button').click();

    await expect(page.getByTestId('brand-logo')).toBeVisible();
    await expect(page.getByTestId('inventory-container')).toBeVisible();
  });

  test('should display error for locked out user', async ({ page }) => {
    await page.getByTestId('username-input').fill('locked_out_user');
    await page.getByTestId('password-input').fill('secret_sauce');
    await page.getByTestId('login-submit-button').click();

    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('locked out');
  });

  test('should add item to cart and complete checkout flow', async ({ page }) => {
    // Login
    await page.getByTestId('username-input').fill('standard_user');
    await page.getByTestId('password-input').fill('secret_sauce');
    await page.getByTestId('login-submit-button').click();

    // Add product
    await page.getByTestId('add-to-cart-btn').first().click();
    await expect(page.getByTestId('cart-quantity-badge')).toHaveText('1');

    // Go to Cart
    await page.getByTestId('nav-cart').click();
    await expect(page.getByTestId('cart-list')).toBeVisible();
    await page.getByTestId('checkout-button').click();

    // Fill Customer details
    await page.getByTestId('first-name').fill('John');
    await page.getByTestId('last-name').fill('Doe');
    await page.getByTestId('postal-code').fill('90210');
    await page.getByTestId('continue-checkout').click();

    // Finish order
    await expect(page.getByTestId('checkout-step2-title')).toBeVisible();
    await page.getByTestId('finish-checkout-btn').click();

    // Confirmation
    await expect(page.getByTestId('complete-header')).toContainText('Thank You For Your Order!');
    await expect(page.getByTestId('order-id-badge')).toBeVisible();
  });

  test('should handle dynamic element in QA sandbox', async ({ page }) => {
    await page.getByTestId('username-input').fill('standard_user');
    await page.getByTestId('password-input').fill('secret_sauce');
    await page.getByTestId('login-submit-button').click();

    await page.getByTestId('nav-sandbox').click();
    await page.getByTestId('trigger-delay-btn').click();

    // Wait for dynamic element to load
    await expect(page.getByTestId('loaded-dynamic-element')).toBeVisible({ timeout: 5000 });
  });

  test('should register a local account and enter the store', async ({ page }) => {
    const username = `qa_student_${Date.now()}`;
    await page.getByTestId('show-register-button').click();
    await page.getByTestId('register-username').fill(username);
    await page.getByTestId('register-password').fill('testing123');
    await page.getByTestId('register-submit-button').click();

    await expect(page.getByTestId('inventory-container')).toBeVisible();
    await expect(page.getByText(username)).toBeVisible();
  });

  test('should report a declined simulated payment without placing an order', async ({ page }) => {
    await page.getByTestId('username-input').fill('standard_user');
    await page.getByTestId('password-input').fill('secret_sauce');
    await page.getByTestId('login-submit-button').click();
    await page.getByTestId('add-to-cart-btn').first().click();
    await page.getByTestId('nav-cart').click();
    await page.getByTestId('checkout-button').click();
    await page.getByTestId('first-name').fill('Test');
    await page.getByTestId('last-name').fill('Payment');
    await page.getByTestId('postal-code').fill('110001');
    await page.getByTestId('continue-checkout').click();
    await page.getByTestId('payment-scenario').selectOption('failure');
    await page.getByTestId('finish-checkout-btn').click();

    await expect(page.getByTestId('complete-header')).not.toBeVisible();
    await expect(page.getByTestId('toast-container')).toContainText('declined');
  });

});
