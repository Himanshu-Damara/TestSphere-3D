class AELoginPage {
  constructor(page) {
    this.page = page;
    this.url = 'https://automationexercise.com/login';
    
    // Login section
    this.loginTitle = page.locator('.login-form h2');
    this.loginEmailInput = page.locator('.login-form input[data-qa="login-email"]');
    this.loginPasswordInput = page.locator('.login-form input[data-qa="login-password"]');
    this.loginSubmitBtn = page.locator('.login-form button[data-qa="login-button"]');
    this.loginErrorMsg = page.locator('.login-form p');

    // Signup section
    this.signupTitle = page.locator('.signup-form h2');
    this.signupNameInput = page.locator('.signup-form input[data-qa="signup-name"]');
    this.signupEmailInput = page.locator('.signup-form input[data-qa="signup-email"]');
    this.signupSubmitBtn = page.locator('.signup-form button[data-qa="signup-button"]');
    this.signupErrorMsg = page.locator('.signup-form p');
  }

  async blockAds() {
    await this.page.route(/(googlesyndication|googleadservices|doubleclick|adservice|google_vignette)/, route => route.abort());
  }

  async goto() {
    await this.blockAds();
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
  }

  async login(email, password) {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginSubmitBtn.click({ force: true });
  }

  async signup(name, email) {
    await this.signupNameInput.fill(name);
    await this.signupEmailInput.fill(email);
    await this.signupSubmitBtn.click({ force: true });
  }
}

module.exports = { AELoginPage };
