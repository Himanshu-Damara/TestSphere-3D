# CS201 Regression Test Automation — Project Status

Student: Himanshu Damara (24BCS11629)  
Project #35 · Playwright (JavaScript) · Page Object Model

Updated: November 5, 2026

## What this project does

The original SauceDemo Page Object Model suite covers login, products, cart, checkout, and logout across Chromium, Firefox, and WebKit. TestSphere adds a local dashboard at `/platform/` for launching visible browser runs, viewing live steps/screenshots, and downloading run reports. The dashboard has three targets: SauceDemo, the local QA Lab storefront (“My Website”), and public Amazon India browsing checks.

## Current progress

- SauceDemo dashboard: **30 cases; full Chromium run passed 30/30** (`run_mw2x8nb0_d3030851`).
- My Website dashboard: **30 cases; full Chromium run passed 30/30** (`run_mw2x8nev_7ab35ba9`).
- Amazon India: **30 read-only cases; full Chromium run passed 30/30 with no skips** (`run_mw2xcedk_c1a01370`). Amazon access and page completeness can vary on later runs.
- Run history, events, results, and artifact references persist in `.testsphere/runs.json`; screenshots and other evidence persist under `.testsphere/artifacts/`. The dashboard History view reads these saved runs. A backend test reopens the store and verifies persistence. Interrupted runs are marked failed on restart.
- The browser window is visible while dashboard tests run; the embedded browser preview is hidden. Saved screenshots remain available as evidence.
- The top Live Testing navigation label and Advanced settings/trace controls were removed from the dashboard. The live run panel still opens after launching tests.
- Firefox and WebKit SauceDemo smoke checks (valid login and checkout overview) each passed **2/2** (`run_mw1qgzqk_efeff378`, `run_mw1qgzsk_615c9371`). The new QA Lab password-reset success case and SauceDemo recovery-availability case also passed in both browsers.

## How to run

Run `npm install`, then `npx playwright install`, then `npm start`. Open `http://localhost:3000/platform/`. If port 3000 is in use, run `$env:PORT='3002'; node server.js` in PowerShell and open `http://localhost:3002/platform/`. The My Website target follows that port.

Run `npm run test:backend` for store/catalog checks. Run `npx playwright test tests/login.spec.js tests/products.spec.js tests/cart.spec.js tests/checkout.spec.js tests/logout.spec.js --project=chromium` for the original SauceDemo Page Object Model suite.

## Remaining work

- Run the complete dashboard catalog in Firefox and WebKit if full cross-browser coverage is needed; only two smoke cases per browser have been verified so far.
- Finish the instructor-prescribed project report using actual recorded results and screenshots.
