const { expect } = require('@playwright/test');

class AEProductsPage {
  constructor(page) {
    this.page = page;
    this.url = 'https://automationexercise.com/products';
    this.allProductsTitle = page.locator('.features_items .title');
    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');
    this.searchedProductsTitle = page.locator('.features_items .title');
    this.productCards = page.locator('.features_items .col-sm-4');
    this.brandsSection = page.locator('.brands_products');
    this.modalAddToCartSuccess = page.locator('#cartModal');
    this.modalContinueBtn = page.locator('#cartModal .btn-success');
    this.modalViewCartLink = page.locator('#cartModal a[href="/view_cart"]');
  }

  async blockAds() {
    await this.page.route(/(googlesyndication|googleadservices|doubleclick|adservice|google_vignette)/, route => route.abort());
  }

  async goto() {
    await this.blockAds();
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
  }

  async searchProduct(query) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async getProductCard(name) {
    return this.productCards.filter({ hasText: name });
  }

  async addProductToCart() {
    await this.page.goto('https://automationexercise.com/product_details/1');
    await this.page.locator('button.cart').click({ force: true });
    await this.page.locator('#cartModal a[href="/view_cart"]').click({ force: true });
  }

  async continueShoppingFromModal() {
    await this.modalContinueBtn.click({ force: true });
  }

  async viewCartFromModal() {
    await expect(this.modalAddToCartSuccess).toBeVisible({ timeout: 5000 });
    await this.modalViewCartLink.click();
    await this.page.waitForURL(/view_cart/);
  }

  async filterByBrand(brandName) {
    await this.brandsSection.locator(`a:has-text("${brandName}")`).click({ force: true });
    // Handle ad vignette URL redirect if present
    if (this.page.url().includes('#google_vignette')) {
      await this.page.goto(`https://automationexercise.com/brand_products/${brandName}`);
    }
  }
}

module.exports = { AEProductsPage };
