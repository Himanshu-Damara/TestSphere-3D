const BROWSERS = ['chromium', 'firefox', 'webkit'];
const LOCAL_PORT = Number(process.env.PORT) || 3000;
const LOCAL_URL = `http://localhost:${LOCAL_PORT}/`;

const TARGETS = [
  {
    id: 'saucedemo',
    name: 'SauceDemo',
    kind: 'external',
    baseUrl: 'https://www.saucedemo.com',
    safe: true,
    description: 'Public SauceDemo regression target.',
    allowedHosts: ['www.saucedemo.com', 'saucedemo.com'],
  },
  {
    id: 'my-website',
    name: 'My Website',
    kind: 'local',
    baseUrl: LOCAL_URL,
    safe: true,
    description: `Your local QA Lab storefront at localhost:${LOCAL_PORT}.`,
    allowedHosts: ['localhost'],
  },
  {
    id: 'local-qa-lab', name: 'Local QA Lab', kind: 'local', baseUrl: LOCAL_URL,
    safe: true, description: 'Internal local QA Lab.', allowedHosts: ['localhost'],
  },
  {
    id: 'amazon',
    name: 'Amazon India',
    kind: 'external',
    baseUrl: 'https://www.amazon.in',
    safe: true,
    description: 'Public browsing and search checks. No sign-in, checkout, or purchase actions.',
    allowedHosts: ['www.amazon.in', 'amazon.in'],
  },
];

const TESTS = [
  {
    id: 'saucedemo-valid-login',
    targetId: 'saucedemo',
    name: 'SauceDemo valid login',
    description: 'Signs in with the approved standard SauceDemo account and verifies the inventory page.',
    safety: 'read-only demo account; no purchase or checkout actions',
    steps: ['open login page', 'submit approved standard credentials', 'assert inventory page is visible'],
  },
  {
    id: 'local-cart-total',
    targetId: 'my-website',
    name: 'Local QA cart total verification',
    description: 'Adds one product and verifies subtotal, tax, shipping, and total arithmetic in the local app.',
    safety: 'local-only data; no external side effects',
    steps: ['log in with standard local user', 'add first in-stock product', 'open cart', 'assert total arithmetic'],
  },
  {
    id: 'amazon-home-smoke',
    targetId: 'amazon',
    name: 'Amazon India homepage smoke',
    description: 'Opens the Amazon India homepage and verifies that it responds with a non-empty title.',
    safety: 'read-only homepage navigation; no credentials or commerce actions',
    steps: ['open approved homepage', 'assert approved host and non-empty title'],
  },
];

const ADDITIONAL_TESTS = [
  { id: 'saucedemo-invalid-login', targetId: 'saucedemo', name: 'SauceDemo invalid login', description: 'Attempts an invalid login and verifies the real error message.', safety: 'read-only negative authentication check', steps: ['open login page', 'submit invalid credentials', 'assert error message'] },
  { id: 'saucedemo-product-verification', targetId: 'saucedemo', name: 'SauceDemo product verification', description: 'Signs in and verifies that products are displayed.', safety: 'read-only demo account', steps: ['log in', 'assert inventory page', 'assert products are visible'] },
  { id: 'saucedemo-locked-user', targetId: 'saucedemo', name: 'Locked-out user', category: 'Login', description: 'Verifies the locked-out account error.' },
  { id: 'saucedemo-empty-login', targetId: 'saucedemo', name: 'Empty login', category: 'Login', description: 'Verifies required username validation.' },
  { id: 'saucedemo-sort-price', targetId: 'saucedemo', name: 'Sort price low to high', category: 'Products', description: 'Verifies ascending product prices.' },
  { id: 'saucedemo-add-remove', targetId: 'saucedemo', name: 'Add and remove product', category: 'Products', description: 'Verifies cart badge updates.' },
  { id: 'saucedemo-cart-contents', targetId: 'saucedemo', name: 'Cart contains selected products', category: 'Cart', description: 'Adds two products and verifies both in cart.' },
  { id: 'saucedemo-cart-remove', targetId: 'saucedemo', name: 'Remove product from cart', category: 'Cart', description: 'Verifies cart item removal.' },
  { id: 'saucedemo-continue-shopping', targetId: 'saucedemo', name: 'Continue shopping', category: 'Cart', description: 'Returns from cart to inventory.' },
  { id: 'saucedemo-checkout-required', targetId: 'saucedemo', name: 'Checkout required details', category: 'Checkout', description: 'Verifies first name validation.' },
  { id: 'saucedemo-complete-order', targetId: 'saucedemo', name: 'Complete demo order', category: 'Checkout', description: 'Completes a SauceDemo demo order.' },
  { id: 'saucedemo-logout', targetId: 'saucedemo', name: 'Logout', category: 'Navigation', description: 'Verifies return to login page.' },
  { id: 'saucedemo-password-required', targetId: 'saucedemo', name: 'Password required', category: 'Login', description: 'Checks empty password validation.' },
  { id: 'saucedemo-home-title', targetId: 'saucedemo', name: 'Inventory home title', category: 'Home', description: 'Checks inventory heading and product count.' },
  { id: 'saucedemo-product-detail', targetId: 'saucedemo', name: 'Product detail page', category: 'Home', description: 'Opens a product and checks its name and price.' },
  { id: 'saucedemo-checkout-last-name', targetId: 'saucedemo', name: 'Last name required', category: 'Checkout', description: 'Checks missing last name validation.' },
  { id: 'saucedemo-checkout-postal', targetId: 'saucedemo', name: 'Postal code required', category: 'Checkout', description: 'Checks missing postal code validation.' },
  { id: 'saucedemo-checkout-overview', targetId: 'saucedemo', name: 'Order overview total', category: 'Checkout', description: 'Checks product subtotal, tax, and final total before order completion.' },
  { id: 'saucedemo-forgot-password-availability', targetId: 'saucedemo', name: 'Password recovery availability', category: 'Login', description: 'Records that SauceDemo does not offer a password recovery link on its demo login page.' },
  { id: 'saucedemo-unknown-user', targetId: 'saucedemo', name: 'Unknown user rejected', category: 'Login', description: 'Checks invalid username rejection.' },
  { id: 'saucedemo-password-masked', targetId: 'saucedemo', name: 'Password input masked', category: 'Login', description: 'Checks password field uses a password input.' },
  { id: 'saucedemo-sort-name', targetId: 'saucedemo', name: 'Sort names Z to A', category: 'Home', description: 'Checks descending product names.' },
  { id: 'saucedemo-checkout-cancel', targetId: 'saucedemo', name: 'Cancel checkout', category: 'Checkout', description: 'Returns from customer details to cart without placing an order.' },
  { id: 'saucedemo-sort-price-high', targetId: 'saucedemo', name: 'Sort price high to low', category: 'Products', description: 'Checks descending product prices.' },
  { id: 'saucedemo-cart-reload', targetId: 'saucedemo', name: 'Cart survives reload', category: 'Cart', description: 'Checks a selected item remains in the cart after a page reload.' },
  { id: 'saucedemo-sort-name-az', targetId: 'saucedemo', name: 'Sort names A to Z', category: 'Products', description: 'Checks ascending product names.' },
  { id: 'saucedemo-empty-cart', targetId: 'saucedemo', name: 'Empty cart message', category: 'Cart', description: 'Checks an empty cart has no items.' },
  { id: 'saucedemo-detail-back', targetId: 'saucedemo', name: 'Back from product detail', category: 'Products', description: 'Opens a product and returns to inventory.' },
  { id: 'saucedemo-checkout-back', targetId: 'saucedemo', name: 'Back from order overview', category: 'Checkout', description: 'Returns from order overview to the cart.' },
  { id: 'amazon-search-visible', targetId: 'amazon', name: 'Search box visible', category: 'Homepage', description: 'Checks that the main search input is visible.' },
  { id: 'amazon-navigation-visible', targetId: 'amazon', name: 'Main navigation visible', category: 'Homepage', description: 'Checks the main navigation and at least one link.' },
  { id: 'amazon-search-keyword', targetId: 'amazon', name: 'Search for a product', category: 'Search', description: 'Searches for a common product and checks the results page.' },
  { id: 'amazon-search-results', targetId: 'amazon', name: 'Search results contain products', category: 'Search', description: 'Checks that a public product result is visible.' },
  { id: 'amazon-search-no-match', targetId: 'amazon', name: 'Unlikely search query', category: 'Search', description: 'Checks that a rare search query shows a results or no-results message.' },
  { id: 'amazon-product-title', targetId: 'amazon', name: 'Product title visible', category: 'Product', description: 'Opens a public result and checks its title.' },
  { id: 'amazon-product-image', targetId: 'amazon', name: 'Product image visible', category: 'Product', description: 'Opens a public result and checks its main image.' },
  { id: 'amazon-mobile-layout', targetId: 'amazon', name: 'Mobile page visible', category: 'Responsive', description: 'Checks the homepage at a mobile viewport.' },
  { id: 'amazon-forgot-password-entry', targetId: 'amazon', name: 'Password help requires identity', category: 'Login', description: 'Checks that public sign-in asks for email or phone before password assistance; no account details are submitted.' },
  { id: 'amazon-search-category', targetId: 'amazon', name: 'Search category selector', category: 'Home', description: 'Checks the category selector is available.' },
  { id: 'amazon-cart-link', targetId: 'amazon', name: 'Cart link visible', category: 'Home', description: 'Checks the public cart navigation link without opening the cart.' },
  { id: 'amazon-search-titles', targetId: 'amazon', name: 'Search result titles', category: 'Search', description: 'Checks visible public results have product titles.' },
  { id: 'amazon-product-price', targetId: 'amazon', name: 'Product price visible', category: 'Product', description: 'Opens a public product and checks for a visible price.' },
  { id: 'amazon-result-link', targetId: 'amazon', name: 'Search result product link', category: 'Search', description: 'Checks a search result has a public product link.' },
  { id: 'amazon-product-url', targetId: 'amazon', name: 'Product detail URL', category: 'Product', description: 'Checks an opened public product has an Amazon detail URL.' },
  { id: 'amazon-home-logo', targetId: 'amazon', name: 'Homepage logo', category: 'Homepage', description: 'Checks the public Amazon logo link.' },
  { id: 'amazon-home-search-submit', targetId: 'amazon', name: 'Search submit button', category: 'Homepage', description: 'Checks the search submit control.' },
  { id: 'amazon-home-account-link', targetId: 'amazon', name: 'Account link visible', category: 'Homepage', description: 'Checks the account entry link without signing in.' },
  { id: 'amazon-home-footer', targetId: 'amazon', name: 'Homepage footer', category: 'Homepage', description: 'Checks the public page footer.' },
  { id: 'amazon-category-options', targetId: 'amazon', name: 'Search categories available', category: 'Homepage', description: 'Checks the category selector has multiple options.' },
  { id: 'amazon-results-heading', targetId: 'amazon', name: 'Results heading', category: 'Search', description: 'Checks the results page announces a search.' },
  { id: 'amazon-results-multiple', targetId: 'amazon', name: 'Multiple search results', category: 'Search', description: 'Checks more than one public result is returned.' },
  { id: 'amazon-result-asin', targetId: 'amazon', name: 'Result product identifier', category: 'Search', description: 'Checks a result exposes a product identifier.' },
  { id: 'amazon-result-image', targetId: 'amazon', name: 'Result image', category: 'Search', description: 'Checks a visible search result image.' },
  { id: 'amazon-result-price', targetId: 'amazon', name: 'Result price', category: 'Search', description: 'Checks a public result shows a price.' },
  { id: 'amazon-result-rating', targetId: 'amazon', name: 'Result rating', category: 'Search', description: 'Checks a public result shows a rating.' },
  { id: 'amazon-product-title-text', targetId: 'amazon', name: 'Product title text', category: 'Product', description: 'Checks opened product title is nonempty.' },
  { id: 'amazon-product-image-source', targetId: 'amazon', name: 'Product image source', category: 'Product', description: 'Checks opened product image has a source.' },
  { id: 'amazon-product-add-button', targetId: 'amazon', name: 'Product add button', category: 'Product', description: 'Checks the public add-to-cart control without clicking it.' },
  { id: 'local-login', targetId: 'my-website', name: 'QA Lab login', category: 'Login', description: 'Signs in and verifies the store.' },
  { id: 'local-locked-user', targetId: 'my-website', name: 'Locked-out user', category: 'Login', description: 'Verifies the locked-out error.' },
  { id: 'local-checkout', targetId: 'my-website', name: 'QA Lab checkout', category: 'Checkout', description: 'Completes a local mock order.' },
  { id: 'local-dynamic', targetId: 'my-website', name: 'Dynamic element', category: 'UI', description: 'Waits for the delayed sandbox element.' },
  { id: 'local-register', targetId: 'my-website', name: 'Local registration', category: 'Registration', description: 'Creates a local demo account and enters the store.' },
  { id: 'local-payment-declined', targetId: 'my-website', name: 'Declined mock payment', category: 'Checkout', description: 'Verifies a failed simulated payment does not complete an order.' },
  { id: 'local-invalid-login', targetId: 'my-website', name: 'Invalid password', category: 'Login', description: 'Checks rejection of incorrect credentials.' },
  { id: 'local-home-products', targetId: 'my-website', name: 'Store home products', category: 'Home', description: 'Checks product cards and prices on the store home page.' },
  { id: 'local-home-search', targetId: 'my-website', name: 'Store product search', category: 'Home', description: 'Searches the local catalog and checks matching products.' },
  { id: 'local-checkout-required', targetId: 'my-website', name: 'Shipping fields required', category: 'Checkout', description: 'Checks that empty shipping fields block checkout.' },
  { id: 'local-checkout-overview', targetId: 'my-website', name: 'Checkout overview', category: 'Checkout', description: 'Checks selected item and total before payment.' },
  { id: 'local-forgot-request', targetId: 'my-website', name: 'Request demo reset code', category: 'Login', description: 'Requests a one-time code for a newly created local demo account.' },
  { id: 'local-forgot-invalid-code', targetId: 'my-website', name: 'Invalid reset code rejected', category: 'Login', description: 'Checks that an incorrect code cannot change a local password.' },
  { id: 'local-forgot-weak-password', targetId: 'my-website', name: 'Weak reset password rejected', category: 'Login', description: 'Checks minimum password length on reset.' },
  { id: 'local-forgot-success', targetId: 'my-website', name: 'Reset password and sign in', category: 'Login', description: 'Resets a new demo account password, rejects its old password, and signs in with the new one.' },
  { id: 'local-home-filter', targetId: 'my-website', name: 'Filter store category', category: 'Home', description: 'Checks category-filtered product cards.' },
  { id: 'local-home-sort', targetId: 'my-website', name: 'Sort store prices', category: 'Home', description: 'Checks low-to-high prices.' },
  { id: 'local-cart-clear', targetId: 'my-website', name: 'Clear cart', category: 'Cart', description: 'Checks that clearing the cart removes items and disables checkout.' },
  { id: 'local-home-no-results', targetId: 'my-website', name: 'Search with no matches', category: 'Home', description: 'Checks an unlikely query displays the no-products message.' },
  { id: 'local-cart-quantity', targetId: 'my-website', name: 'Increase cart quantity', category: 'Cart', description: 'Checks quantity and total increase together.' },
  { id: 'local-empty-cart', targetId: 'my-website', name: 'Empty cart state', category: 'Cart', description: 'Checks the empty cart message and disabled checkout.' },
  { id: 'local-cart-remove-one', targetId: 'my-website', name: 'Remove one cart item', category: 'Cart', description: 'Checks a selected item can be removed.' },
  { id: 'local-cart-continue', targetId: 'my-website', name: 'Continue shopping', category: 'Cart', description: 'Returns from cart to the store.' },
  { id: 'local-sort-high', targetId: 'my-website', name: 'Sort prices high to low', category: 'Home', description: 'Checks descending prices.' },
  { id: 'local-sort-name', targetId: 'my-website', name: 'Sort product names A to Z', category: 'Home', description: 'Checks ascending product names.' },
  { id: 'local-filter-gear', targetId: 'my-website', name: 'Filter Gear products', category: 'Home', description: 'Checks Gear filter returns Gear products.' },
  { id: 'local-search-case', targetId: 'my-website', name: 'Case-insensitive search', category: 'Home', description: 'Checks lowercase search matches product descriptions.' },
  { id: 'local-logout', targetId: 'my-website', name: 'QA Lab logout', category: 'Login', description: 'Checks sign-out returns to login.' },
  { id: 'local-checkout-cancel', targetId: 'my-website', name: 'Cancel local checkout', category: 'Checkout', description: 'Checks cancel returns to cart without creating an order.' },
];
const ALL_TESTS = [...TESTS, ...ADDITIONAL_TESTS];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getCatalog() {
  return {
    browsers: [...BROWSERS],
    targets: clone(TARGETS.filter(target => target.id !== 'local-qa-lab')),
    tests: clone(TESTS.filter(test => test.targetId !== 'local-qa-lab')),
    additionalTests: clone(ADDITIONAL_TESTS.filter(test => test.targetId !== 'local-qa-lab')),
  };
}

function getTarget(targetId) {
  return TARGETS.find(target => target.id === targetId);
}

function getTest(testId) {
  return ALL_TESTS.find(test => test.id === testId);
}

function validateRunRequest(input = {}) {
  const errors = [];
  const requestedIds = Array.isArray(input.testIds) ? input.testIds : (input.testId ? [input.testId] : []);
  const tests = requestedIds.map(getTest);
  const test = tests[0];
  const browser = input.browser || 'chromium';

  if (!requestedIds.length) {
    errors.push('Select at least one approved test');
  } else if (tests.some(item => !item) || new Set(requestedIds).size !== requestedIds.length) {
    errors.push(`testIds must be approved unique IDs: ${ALL_TESTS.map(item => item.id).join(', ')}`);
  } else if (new Set(tests.map(item => item.targetId)).size !== 1) {
    errors.push('All selected tests must belong to the same testing website');
  }
  if (!BROWSERS.includes(browser)) {
    errors.push(`browser must be one of: ${BROWSERS.join(', ')}`);
  }
  if (Object.prototype.hasOwnProperty.call(input, 'url')) errors.push('Website URLs cannot be changed for these configured test suites');
  if (Object.prototype.hasOwnProperty.call(input, 'command')) {
    errors.push('arbitrary commands are not accepted');
  }
  if (input.headed !== undefined && typeof input.headed !== 'boolean') {
    errors.push('headed must be a boolean');
  }
  if (input.trace !== undefined && typeof input.trace !== 'boolean') {
    errors.push('trace must be a boolean');
  }
  if (
    input.screenshots !== undefined &&
    input.screenshots !== true &&
    input.screenshots !== false &&
    !['always', 'on-failure', 'never'].includes(input.screenshots)
  ) {
    errors.push('screenshots must be a boolean or one of: always, on-failure, never');
  }

  return {
    valid: errors.length === 0,
    errors,
    test,
    tests,
    target: test ? getTarget(test.targetId) : undefined,
    browser,
  };
}

module.exports = {
  BROWSERS,
  TARGETS,
  TESTS,
  getCatalog,
  getTarget,
  getTest,
  validateRunRequest,
};
