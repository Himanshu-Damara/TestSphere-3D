const { test, expect } = require('./fixtures');

test.describe('Cart regression', () => {
  test('cart contains selected products', async ({ authenticatedPage, productsPage, cartPage }) => {
    await productsPage.addProduct('Sauce Labs Backpack');
    await productsPage.addProduct('Sauce Labs Bike Light');
    await productsPage.openCart();
    await expect(cartPage.cartItems).toHaveCount(2);
    await expect(cartPage.item('Sauce Labs Backpack')).toBeVisible();
    await expect(cartPage.item('Sauce Labs Bike Light')).toBeVisible();
  });

  test('user can remove a product from the cart', async ({ authenticatedPage, productsPage, cartPage }) => {
    await productsPage.addProduct('Sauce Labs Backpack');
    await productsPage.addProduct('Sauce Labs Bike Light');
    await productsPage.openCart();
    await cartPage.removeProduct('Sauce Labs Backpack');
    await expect(cartPage.cartItems).toHaveCount(1);
    await expect(cartPage.item('Sauce Labs Bike Light')).toBeVisible();
  });

  test('user can return to shopping from the cart', async ({ authenticatedPage, productsPage, cartPage, page }) => {
    await productsPage.openCart();
    await cartPage.continueShoppingButton.click();
    await expect(page).toHaveURL(/inventory\.html/);
  });
});
