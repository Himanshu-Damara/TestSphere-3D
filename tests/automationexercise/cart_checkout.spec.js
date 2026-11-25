const { test, expect } = require('@playwright/test');
const { AEProductsPage } = require('../../pages/automationexercise/AEProductsPage');
const { AECartPage } = require('../../pages/automationexercise/AECartPage');

test.describe('Automation Exercise - Cart & Checkout Suite', () => {

  test('should add product to cart and verify cart contents', async ({ page }) => {
    const productsPage = new AEProductsPage(page);
    const cartPage = new AECartPage(page);

    await productsPage.addProductToCart();
    await expect(cartPage.cartItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('should remove item from cart successfully', async ({ page }) => {
    const productsPage = new AEProductsPage(page);
    const cartPage = new AECartPage(page);

    await productsPage.addProductToCart();
    await expect(cartPage.cartItems.first()).toBeVisible({ timeout: 10000 });

    await cartPage.removeItem(0);
    await expect(cartPage.cartItems).toHaveCount(0, { timeout: 5000 });
  });

});
