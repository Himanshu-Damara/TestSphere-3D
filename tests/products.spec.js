const { test, expect } = require('./fixtures');

test.describe('Products regression', () => {
  test('products page displays inventory and cart starts empty', async ({ authenticatedPage, productsPage }) => {
    await expect(productsPage.title).toHaveText('Products');
    await expect(productsPage.inventoryItems).toHaveCount(6);
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).toHaveCount(0);
  });

  test('user can sort products by price', async ({ authenticatedPage, productsPage }) => {
    await productsPage.sortBy('lohi');
    const prices = await productsPage.page.locator('.inventory_item_price').allTextContents();
    const values = prices.map((price) => Number(price.replace('$', '')));
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  test('user can add and remove a product', async ({ authenticatedPage, productsPage }) => {
    await productsPage.addProduct('Sauce Labs Backpack');
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).toHaveText('1');
    await productsPage.removeProduct('Sauce Labs Backpack');
    await expect(authenticatedPage.getByTestId('shopping-cart-badge')).toHaveCount(0);
  });
});
