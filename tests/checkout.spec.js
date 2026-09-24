const { test, expect } = require('./fixtures');

test.describe('Checkout regression', () => {
  test('user can complete an order', async ({ authenticatedPage, productsPage, cartPage, checkoutPage }) => {
    await productsPage.addProduct('Sauce Labs Backpack');
    await productsPage.openCart();
    await cartPage.checkout();
    await checkoutPage.fillCustomerDetails('Himanshu', 'Damara', '110001');
    await checkoutPage.continueToOverview();
    await expect(checkoutPage.page.getByTestId('title')).toHaveText('Checkout: Overview');
    await checkoutPage.finishOrder();
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
  });

  test('checkout validates missing customer details', async ({ authenticatedPage, productsPage, cartPage, checkoutPage }) => {
    await productsPage.addProduct('Sauce Labs Backpack');
    await productsPage.openCart();
    await cartPage.checkout();
    await checkoutPage.continueToOverview();
    await expect(checkoutPage.errorMessage).toContainText('First Name is required');
  });
});
