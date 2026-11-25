class AEHomePage {
  constructor(page) {
    this.page = page;
    this.url = 'https://automationexercise.com';
    this.logo = page.locator('.logo img');
    this.homeNav = page.locator('a[href="/"]');
    this.productsNav = page.locator('a[href="/products"]');
    this.cartNav = page.locator('a[href="/view_cart"]');
    this.loginNav = page.locator('a[href="/login"]');
    this.contactNav = page.locator('a[href="/contact_us"]');
    this.featuredProductsTitle = page.locator('.features_items .title');
    this.categorySection = page.locator('#accordian');
    this.subscribeEmailInput = page.locator('#susbscribe_email');
    this.subscribeButton = page.locator('#subscribe');
    this.successSubscribeAlert = page.locator('.alert-success');
  }

  async blockAds() {
    await this.page.route(/(googlesyndication|googleadservices|doubleclick|adservice|google_vignette)/, route => route.abort());
  }

  async goto() {
    await this.blockAds();
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
  }

  async openProducts() {
    await this.productsNav.first().click();
  }

  async openCart() {
    await this.cartNav.first().click();
  }

  async openLogin() {
    await this.loginNav.first().click();
  }

  async subscribe(email) {
    await this.subscribeEmailInput.fill(email);
    await this.subscribeButton.click();
  }
}

module.exports = { AEHomePage };
