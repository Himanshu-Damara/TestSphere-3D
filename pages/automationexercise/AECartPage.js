class AECartPage {
  constructor(page) {
    this.page = page;
    this.url = 'https://automationexercise.com/view_cart';
    this.cartTable = page.locator('#cart_info_table');
    this.cartItems = page.locator('#cart_info_table tbody tr');
    this.proceedToCheckoutBtn = page.locator('.check_out');
    this.emptyCartMsg = page.locator('#empty_cart');
  }

  async blockAds() {
    await this.page.route(/(googlesyndication|googleadservices|doubleclick|adservice|google_vignette)/, route => route.abort());
  }

  async goto() {
    await this.blockAds();
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
  }

  async getCartItemByName(name) {
    return this.cartItems.filter({ hasText: name });
  }

  async removeItem(index = 0) {
    const row = this.cartItems.nth(index);
    await row.locator('.cart_quantity_delete').click({ force: true });
  }

  async proceedToCheckout() {
    await this.proceedToCheckoutBtn.click({ force: true });
  }
}

module.exports = { AECartPage };
