# CS201 Project Guide: Regression Test Automation

**Student:** Himanshu Damara (24BCS11629)  
**Course:** CS201 Software Testing  
**Assigned project:** #35 — Regression Test Automation  
**Work type:** Individual  
**Automation tool:** Playwright with JavaScript  
**Main assigned target:** [SauceDemo](https://www.saucedemo.com)  
**Project name in the dashboard:** TestSphere 3D  
**Guide updated:** 5 November 2026

## 1. What the project is

This project automates repeatable checks of e-commerce workflows. The original course suite tests SauceDemo with Playwright and the Page Object Model (POM). A local dashboard was added so tests can be selected, launched, watched in a **separate visible browser window**, and reviewed later. The dashboard also tests the project's own QA Lab storefront and public, read-only parts of Amazon India.

The three dashboard targets are separate suites. **My Website** means the QA Lab storefront served by this project's `server.js`, normally at `http://localhost:3000/`. It follows the selected `PORT` value. It does not mean an arbitrary user-entered URL.

| Target | Dashboard cases | Main coverage |
|---|---:|---|
| SauceDemo | 30 | Login, inventory, sorting, product details, cart, checkout validation, order completion, logout |
| My Website / QA Lab | 30 | Login, demo password reset, registration, search/filter/sort, cart, checkout, mock payment, dynamic UI |
| Amazon India | 30 | Public homepage, navigation, search results, product details, mobile view, first sign-in step |

The original SauceDemo `.spec.js` files remain available alongside these instrumented dashboard cases. The separate Automation Exercise files are experimental external-site tests and are **not** dashboard targets.

## 2. How to start it

From the project folder in PowerShell:

```powershell
npm install
npx playwright install
npm start
```

Open `http://localhost:3000/platform/` for the testing dashboard or `http://localhost:3000/` for QA Lab. On Windows, `launch-dashboard.cmd` is another way to start the server and open the dashboard.

If port 3000 belongs to another application:

```powershell
$env:PORT='3002'
node server.js
```

Then open `http://localhost:3002/platform/`. Keep the server terminal running while using the dashboard. The currently used port in this workspace is **3002**.

## 3. How to run a visible test

1. Open the dashboard and choose SauceDemo, My Website, or Amazon India.
2. Click **Run** beside one case, select several cases and click **RUN SELECTED**, or click **RUN ALL TESTS**.
3. Choose Chromium, Firefox, or WebKit. Dashboard runs launch a **headed browser window**. The test page is brought to the front.
4. Watch case status, steps, assertions, and logs in the dashboard. The browser itself is not embedded in the page. Evidence screenshots can still be saved and reviewed in the gallery or report.
5. Use **History** to reopen an earlier run. Use **STOP** to end a running suite.

The dashboard removed its Live Testing navigation label, Advanced settings block, trace selector, and embedded live-browser panel. The execution monitor still appears after a run starts. The screenshot selector controls evidence capture; the visible browser opens regardless of that setting.

## 4. What each target tests

### SauceDemo

The original POM classes in `pages/` model login, products, cart, and checkout. The dashboard's 30 SauceDemo cases cover valid and invalid login, empty fields, locked/unknown users, password input masking, the inventory page, sorting in both directions, product details, cart additions/removals and reload persistence, checkout required fields and totals, checkout cancellation, demo order completion, and logout.

SauceDemo's demo login page does **not** offer a forgot-password control. Its availability case records that fact; it does not claim to reset a SauceDemo password.

### My Website / QA Lab

The QA Lab is a local demo storefront under `public/`, backed by routes in `server.js`. Its cases cover positive and negative login, registration, demo password reset, product search/filter/sort and no-match feedback, cart totals and quantity, required shipping details, checkout overview, a successful mock order, declined mock payment, and a delayed UI element.

The password reset is **local demo behavior**. The server displays a one-time code because there is no email service. Cases verify code request, invalid-code rejection, short-password rejection, old-password rejection after reset, and new-password sign-in. It is not a production account recovery design.

Payments are simulated locally. No real card transaction occurs. The server recalculates the local order total instead of trusting only the browser value. The optional local cart-total fault can demonstrate a detected defect and is off by default.

### Amazon India

The 30 Amazon cases inspect public browsing pages. They do not submit credentials, reset a real account, place orders, or purchase products. The sign-in case stops at the first email/phone step. A complete Amazon password reset cannot be tested anonymously.

Amazon sometimes shows a **Continue shopping** page before its storefront. The runner uses that visible button and logs the action. If Amazon returns an empty page or blocks access, a case is marked **skipped**, not passed. A blank page no longer automatically prevents every later case from trying its own fresh browser context. A genuine verification challenge is not solved by the suite.

Amazon is an external site and may change its layout, timing, or access behavior. A successful historical run does not guarantee the next run will pass.

## 5. Architecture and files

| Path | Purpose |
|---|---|
| `pages/` | SauceDemo Page Object Model classes; also separate Automation Exercise objects |
| `tests/login.spec.js`, `products.spec.js`, `cart.spec.js`, `checkout.spec.js`, `logout.spec.js` | Original SauceDemo Playwright suite |
| `tests/local_qa_lab.spec.js` | Direct QA Lab Playwright suite |
| `tests/platform.spec.js` | Dashboard UI and run/history checks |
| `tests/backend/execution.test.js` | Catalog, fault, saved-history, and restart-recovery checks |
| `data/users.json` | Standard SauceDemo test accounts for the original suite |
| `playwright.config.js` | Chromium, Firefox, WebKit projects and Playwright reporting |
| `execution/catalog.js` | Approved target list, case descriptions, and request validation |
| `execution/runner.js` | Headed browser launch and instrumented case execution |
| `execution/events.js`, `store.js`, `routes.js` | Live events, persistent runs/artifacts, execution API and reports |
| `execution/faults.js` | Optional local cart-total defect demonstration |
| `public/platform/` | Dashboard HTML, CSS, JavaScript |
| `public/`, `server.js` | QA Lab storefront and Express API |
| `.github/workflows/playwright.yml` | Playwright CI workflow |
| `PROJECT_REPORT.md` | Existing course report draft; check against the instructor's prescribed format before submission |

Each dashboard case gets a fresh browser context. The runner publishes ordered events over server-sent events (SSE): test start/end, steps, assertions, logs, and screenshot artifacts. The dashboard subscribes to these events and can reopen stored runs.

## 6. Saved history and evidence

Run metadata, case results, assertions, and events are saved in `.testsphere/runs.json`. Screenshots and optional evidence files are under `.testsphere/artifacts/`. These folders are ignored by Git, so a GitHub clone will not contain your local test history. The store currently retains the **100 most recent runs**. An interrupted run is marked failed after a server restart instead of remaining forever in the running state.

The dashboard History page shows recent saved runs. For a specific run ID, the execution API also offers:

- `/api/execution/runs/<run-id>` — JSON result
- `/api/execution/runs/<run-id>/report` — HTML report
- `/api/execution/runs/<run-id>/report.pdf` — compact PDF report
- `/api/execution/runs/<run-id>/evidence.zip` — screenshots, when captured

If screenshot capture is off, a successful run may have no screenshot ZIP. A failure/skip may still save a diagnostic screenshot. Reports and test status should be read together; a screenshot alone does not prove a case passed.

## 7. Other ways to run checks

```powershell
# Backend catalog and persistence checks
npm run test:backend

# Original SauceDemo POM suite, Chromium only
npx playwright test tests/login.spec.js tests/products.spec.js tests/cart.spec.js tests/checkout.spec.js tests/logout.spec.js --project=chromium

# QA Lab direct suite; start the local server first
npx playwright test tests/local_qa_lab.spec.js --project=chromium

# Dashboard UI checks, when using port 3002
$env:TESTSPHERE_BASE_URL='http://localhost:3002'
npx playwright test tests/platform.spec.js --project=chromium

# Show a Playwright HTML report
npm run test:report
```

`npm test` runs every spec in `tests/`, including the experimental Automation Exercise suite. Use the focused commands above for the course project or dashboard. The dashboard always opens a visible browser; CI is normally headless.

## 8. Verified results and limits

These are recorded results, **not promises for future runs**:

| Evidence | Recorded outcome |
|---|---|
| SauceDemo earlier full dashboard run `run_mw1qwd9i_fe6ded9c` | 24 passed; the two newer cases passed separately in `run_mw2vmyqq_20799ced` |
| QA Lab full 21-case dashboard run `run_mw2vw6pe_a8a4ea49` | 21 passed, 0 failed |
| Amazon earlier 14-case full dashboard run `run_mw1re9ly_cc4041f3` | 14 passed, 0 skipped; the two newer cases have not both been verified in one clean run |
| Amazon latest two-case smoke `run_mw2w4yam_1180efdb` | 2 passed after changing blank-page handling |
| Newly added dashboard cases | SauceDemo 4/4 (`run_mw2x0nvo_3d801ad0`); QA Lab 9/9 (`run_mw2x0sm0_ba48670a`); Amazon 13/14 with the footer absent on the served page (`run_mw2x1xcd_7db59148`) |
| Latest full 30-case Chromium runs | SauceDemo 30/30 (`run_mw2x8nb0_d3030851`); QA Lab 30/30 (`run_mw2x8nev_7ab35ba9`) |
| Amazon full 30-case Chromium run | 30 passed, 0 failed, 0 skipped (`run_mw2xcedk_c1a01370`) |
| Backend checks | 4 passed with `npm run test:backend` |
| Browser coverage | Chromium used for the full runs above; selected SauceDemo and QA Lab smoke cases also passed in Firefox and WebKit |

All three 30-case catalogs passed in the recorded Chromium runs above. Amazon can still return blank pages intermittently, so future runs may differ. Full Firefox/WebKit dashboard catalogs are not yet verified. The instructor's report format must be checked before submission.

## 9. Submission checklist

- Include the working code, `package.json`, `package-lock.json`, Playwright config, Page Objects, tests, and CI workflow.
- Include `PROJECT_REPORT.md` after adapting it to the instructor's exact prescribed format.
- Use actual run results and evidence. Explain skips and external Amazon access limitations honestly.
- Do not treat the dashboard's local `.testsphere/` history as included in Git; export reports or evidence separately if required.
- Demonstrate the assigned SauceDemo POM suite first, then show QA Lab/dashboard extensions if time permits.

For a shorter progress summary, see `PROJECT_STATUS.md`. For implementation details, see `ARCHITECTURE.md`; for a demonstration script, see `DEMO_GUIDE.md`.
