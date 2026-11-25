const { test, expect } = require('@playwright/test');
const { AEHomePage } = require('../../pages/automationexercise/AEHomePage');
const { AEProductsPage } = require('../../pages/automationexercise/AEProductsPage');

test.describe('Automation Exercise - Home & Products Regression Suite', () => {

  test('should load home page successfully with key components', async ({ page }) => {
    const homePage = new AEHomePage(page);
    await homePage.goto();

    await expect(homePage.logo).toBeVisible();
    await expect(homePage.productsNav.first()).toBeVisible();
    await expect(homePage.cartNav.first()).toBeVisible();
  });

  test('should navigate to products page and search for items', async ({ page }) => {
    const productsPage = new AEProductsPage(page);
    await productsPage.goto();

    await expect(productsPage.allProductsTitle).toBeVisible();

    await productsPage.searchProduct('dress');
    await expect(productsPage.searchedProductsTitle).toHaveText(/searched products/i);
    await expect(productsPage.productCards.first()).toBeVisible();
  });

  test('should filter products by brand category', async ({ page }) => {
    const productsPage = new AEProductsPage(page);
    await productsPage.goto();

    await expect(productsPage.brandsSection).toBeVisible();
    await productsPage.filterByBrand('Polo');

    await expect(page).toHaveURL(/brand_products\/Polo/);
  });

});
