# Project 35 – Regression Test Automation

Individual semester project for CS201 by **Himanshu Damara (24BCS11629)**.

This project automates regression testing of the SauceDemo e-commerce website using Playwright and JavaScript. It uses the Page Object Model (POM), data-driven credentials, reusable fixtures, HTML reporting, failure screenshots/video/traces, and Chromium, Firefox, and WebKit projects.

## Setup

```bash
npm install
npx playwright install
```

## Run the suite

```bash
npm test
npm run test:headed
npm run test:chromium
npm run test:firefox
npm run test:webkit
npm run test:report
```

The HTML report is generated in `playwright-report/`.

## Project structure

```text
pages/                 Page Object classes
tests/                 Regression specifications and fixtures
data/users.json        SauceDemo test credentials
playwright.config.js   Browser, reporting, and execution settings
.github/workflows/     GitHub Actions CI pipeline
PROJECT_REPORT.md      Submission-ready project report draft
```

## Covered areas

Login, invalid and locked-out credentials, product inventory, sorting, add/remove cart operations, cart navigation, checkout validation, successful order completion, logout, and cross-browser execution.
