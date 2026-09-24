# CS201 Software Testing Project Report

## Project Details

| Field | Details |
|---|---|
| Student | Himanshu Damara |
| Roll number | 24BCS11629 |
| Project | #35 – Regression Test Automation |
| Course | CS201 – Software Testing |
| Tool | Playwright with JavaScript |
| Application under test | SauceDemo – https://www.saucedemo.com |
| Project type | Individual project |

## 1. Introduction

Regression testing verifies that previously implemented functionality continues to work after application changes. Manual regression testing is repetitive and can be slow, so this project automates a representative regression suite for SauceDemo, a demo e-commerce application. Playwright was selected because it supports modern browser automation, reliable locators, fixtures, parallel execution, tracing, and multiple browser engines.

## 2. Objectives

The objectives are to automate important SauceDemo user journeys, organize the tests using the Page Object Model, validate both positive and negative scenarios, execute the same suite on Chromium, Firefox, and WebKit, and make the suite suitable for continuous integration.

## 3. Scope

### In scope

- Login with valid, invalid, empty, and locked-out credentials
- Inventory page and product count
- Product sorting by price
- Adding and removing products
- Cart contents and navigation
- Checkout field validation
- Successful checkout and order confirmation
- Logout
- Cross-browser execution on Chromium, Firefox, and WebKit

### Out of scope

- Real payment processing
- Database testing
- Performance, load, and security testing
- Testing SauceDemo server-side implementation

## 4. Test Environment

| Component | Value |
|---|---|
| Operating system | Windows 10/11 or GitHub Actions runner |
| Runtime | Node.js LTS |
| Automation framework | Playwright Test |
| Language | JavaScript |
| Browsers | Chromium, Firefox, WebKit |
| Test URL | https://www.saucedemo.com |

## 5. Automation Design

The framework follows the Page Object Model. `LoginPage`, `ProductsPage`, `CartPage`, and `CheckoutPage` contain page-specific locators and actions. Test specifications contain business-level scenarios, while `tests/fixtures.js` provides reusable page objects and an authenticated session setup. Stable `data-test` attributes and role-based locators are preferred to reduce test maintenance.

## 6. Test Cases

| ID | Test scenario | Expected result |
|---|---|---|
| TC-01 | Login with standard user | User is taken to Products page |
| TC-02 | Login with locked-out user | Locked-out error is displayed |
| TC-03 | Login with invalid credentials | Login error is displayed |
| TC-04 | Submit empty login form | Username-required validation is displayed |
| TC-05 | Load inventory | Six inventory products are displayed |
| TC-06 | Sort products low to high | Products are ordered by ascending price |
| TC-07 | Add and remove product | Cart badge changes correctly |
| TC-08 | Add two products and open cart | Both selected products are displayed |
| TC-09 | Remove product from cart | Removed product is no longer displayed |
| TC-10 | Continue shopping from cart | User returns to inventory |
| TC-11 | Complete checkout | Order confirmation is displayed |
| TC-12 | Submit checkout without details | Required-field error is displayed |
| TC-13 | Logout | User returns to login page |

## 7. Execution and Results

Run the suite with:

```bash
npm install
npx playwright install
npm test
```

The configuration executes all test cases against Chromium, Firefox, and WebKit. Playwright generates an HTML report in `playwright-report/`. Screenshots, video, and traces are retained for failed tests according to the configuration.

| Browser | Result | Evidence |
|---|---|---|
| Chromium | 13/13 passed | Playwright HTML report |
| Firefox | Browser process could not launch in the local Windows environment (`spawn UNKNOWN`); configured for CI execution | Playwright HTML report / CI artifact |
| WebKit | 13/13 passed | Playwright HTML report |

The combined local run completed 26 passing tests across Chromium and WebKit. The Firefox failure is an environment-level launch issue rather than a test assertion failure; the same Firefox project remains enabled in `playwright.config.js` and the CI workflow installs and executes it.

## 8. CI/CD Integration

The GitHub Actions workflow installs Node.js dependencies and Playwright browsers, runs the regression suite, and uploads the HTML report as an artifact. This allows the suite to run automatically for pushes and pull requests.

## 9. Limitations

SauceDemo is a demonstration application, so its data and workflows do not represent a production payment system. The suite focuses on functional regression and does not measure performance or test backend services directly.

## 10. Conclusion

The completed project provides a maintainable Playwright regression suite for SauceDemo. It covers the main shopping workflow and important negative cases, uses reusable page objects and fixtures, and supports three browser engines. The CI workflow and HTML reporting make failures easier to detect and investigate.

## 11. References

- Playwright documentation: https://playwright.dev/docs/intro
- SauceDemo application: https://www.saucedemo.com
- SauceDemo test credentials: https://www.saucedemo.com
