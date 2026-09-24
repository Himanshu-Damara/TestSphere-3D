class ProductsPage {
  constructor(page) {
    this.page = page;
    this.title = page.getByTestId('title');
    this.inventoryItems = page.locator('.inventory_item');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByTestId('logout-sidebar-link');
  }

  product(name) {
    return this.page.locator('.inventory_item').filter({ hasText: name });
  }

  async addProduct(name) {
    const item = this.product(name);
    await item.getByRole('button', { name: /Add to cart/i }).click();
  }

  async removeProduct(name) {
    const item = this.product(name);
    await item.getByRole('button', { name: /Remove/i }).click();
  }

  async openCart() {
    await this.cartLink.click();
  }

  async sortBy(value) {
    await this.sortDropdown.selectOption(value);
  }

  async logout() {
    await this.menuButton.click();
    await this.logoutLink.click();
  }
}

module.exports = { ProductsPage };
