# TestSphere 3D Testing Guide

## Basic verification

Start the server:

```bash
npm start
```

Open `http://localhost:3000/platform/`, choose **SauceDemo**, keep Chromium selected, and run **SauceDemo valid login**. The laboratory should show real `run.started`, step, assertion, screenshot (if enabled), and completion events.

## Demonstrate a real defect

1. Select **My Website** (the local QA Lab) on the dashboard.
2. Enable **Local cart defect injection**.
3. Keep the default undercharge of `$1.00` and click **Apply defect**.
4. Run **Local QA cart total verification**.
5. Inspect the failed assertion in the timeline and console. The expected and actual totals come from the browser DOM and are not hardcoded pass results.
6. Disable the defect and click **Apply defect** again.
7. Rerun the same test. It should pass when the local application is served without the transformed calculation.

## Verify local mock payments

The Local QA Lab never contacts a payment provider. In checkout overview, choose one of the gateway scenarios:

- **Successful simulated payment** places a local order.
- **Failed simulated payment** returns a declined response and keeps the order unplaced.
- **Invalid mock details** exercises validation.
- **Cancel payment** simulates a customer cancellation.

The local registration flow is also available from the login screen and uses an in-memory seeded account store.

## Run the original regression suite

The original SauceDemo suite remains independent:

```bash
npx playwright test tests/login.spec.js tests/products.spec.js tests/cart.spec.js tests/checkout.spec.js tests/logout.spec.js --project=chromium
```

The project also keeps Firefox and WebKit projects in `playwright.config.js`.

## Backend API checks

```bash
curl http://localhost:3000/api/execution/catalog
curl http://localhost:3000/api/execution/history
```

Start a run with a catalog ID:

```bash
curl -X POST http://localhost:3000/api/execution/runs \
  -H "Content-Type: application/json" \
  -d '{"testId":"saucedemo-valid-login","browser":"chromium","screenshots":"always","trace":true}'
```

The response includes a `run.id`. Subscribe to its events using:

```bash
curl -N http://localhost:3000/api/execution/runs/<run-id>/events
```

## Artifact interpretation

- **Screenshot**: a captured Playwright page at an explicit checkpoint or failure.
- **Trace**: a Playwright trace ZIP that can be opened with `npx playwright show-trace <file>`.
- **Console log**: structured runner and assertion diagnostics.

## Test concepts for viva

- **Regression testing**: re-running known scenarios after changes to detect unintended breakage.
- **Page Object Model**: selectors and page interactions are kept in reusable classes under `pages/`.
- **Assertions**: the test compares observed browser values against expected values.
- **Fixtures**: `tests/fixtures.js` creates reusable authenticated pages and page objects.
- **Cross-browser testing**: the same Playwright scenarios are configured for Chromium, Firefox, and WebKit.
- **CI/CD**: `.github/workflows/playwright.yml` installs dependencies, browsers, and runs the suite.
- **Debugging**: screenshots, trace artifacts, ordered step events, and actual assertion values explain failures.
