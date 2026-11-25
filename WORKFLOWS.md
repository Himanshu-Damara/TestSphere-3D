# TestSphere 3D flowcharts and workflows

These Mermaid diagrams render directly on GitHub. The [architecture diagram](assets/architecture-diagram.png) is also available as a PNG for the project report. Its visible-browser label applies to local execution; hosted runs are headless.

## 1. Platform architecture

```mermaid
flowchart LR
    Student[Student] --> UI[Vercel dashboard]
    UI -->|REST and SSE through API rewrite| API[Render Express API]
    API --> Catalog[Approved catalog: 90 cases]
    Catalog --> Manager[Run manager]
    Manager --> PW[Playwright browser]
    PW --> Sauce[SauceDemo]
    PW --> Lab[QA Lab]
    PW --> Amazon[Amazon India]
    Manager --> Bus[Event bus]
    Manager --> Store[Run store and artifacts]
    Bus -->|Live steps and status| UI
    Store -->|History, reports, screenshots| UI
```

The dashboard is hosted at [TestSphere on Vercel](https://testsphere-3d.vercel.app/platform/). The runner health endpoint is the [Render catalog](https://testsphere-3d-runner.onrender.com/api/execution/catalog).

## 2. Test execution and result flow

```mermaid
flowchart TD
    Select[Select target, browser, and cases] --> Start[POST /api/execution/runs]
    Start --> Valid{Cases approved by catalog?}
    Valid -->|No| Reject[Return validation error]
    Valid -->|Yes| Queue[Create run record]
    Queue --> Launch[Launch selected Playwright browser]
    Launch --> Case[Open fresh browser context for case]
    Case --> Steps[Perform scenario steps and assertions]
    Steps --> Result{Case result}
    Result -->|Pass| Pass[Record passed]
    Result -->|Assertion or browser error| Fail[Record failed and capture evidence]
    Result -->|Target unavailable| Skip[Record skipped with reason]
    Pass --> More{More selected cases?}
    Fail --> More
    Skip --> More
    More -->|Yes| Case
    More -->|No| Finish[Finish run and calculate totals]
    Finish --> History[History and HTML or PDF report]
    Steps --> Events[Emit SSE step and assertion events]
    Events --> Dashboard[Update dashboard live]
```

Each case uses a new browser context. The run record, events, and optional screenshots or traces are stored by `execution/store.js`. The dashboard can reconnect to the SSE stream and replay missed events.

## 3. Regression scenarios by target

| Target | Cases | Main modules |
|---|---:|---|
| SauceDemo | 30 | Login validation, inventory, sorting, product details, cart, checkout, logout |
| QA Lab | 30 | Login, registration, demo password reset, search, filters, cart, checkout, mock payment |
| Amazon India | 30 | Public homepage, navigation, search results, product details, mobile view, first sign-in step |

### SauceDemo shopping flow

```mermaid
flowchart LR
    Login[Login form] --> Valid{Credentials valid?}
    Valid -->|No| Error[Verify error message]
    Valid -->|Yes| Inventory[Inventory and sorting]
    Inventory --> Detail[Product details]
    Detail --> Cart[Add or remove cart items]
    Cart --> Checkout[Checkout validation and totals]
    Checkout --> Complete[Demo order complete]
    Complete --> Logout[Logout]
```

### QA Lab account and shopping flow

```mermaid
flowchart LR
    Entry[QA Lab] --> Login[Login checks]
    Entry --> Register[Demo registration]
    Entry --> Reset[Demo password reset]
    Login --> Products[Search, filter, and sort]
    Register --> Products
    Reset --> Products
    Products --> Cart[Cart quantity and totals]
    Cart --> Checkout[Shipping and checkout]
    Checkout --> Payment[Mock payment outcomes]
    Payment --> History[Local order result]
```

### Amazon India public browsing flow

```mermaid
flowchart LR
    Home[Public homepage] --> Access{Usable page?}
    Access -->|No| Skip[Record skip and evidence]
    Access -->|Yes| Search[Search and result checks]
    Search --> Product[Public product details]
    Product --> Mobile[Mobile layout checks]
    Home --> SignIn[First sign-in step only]
```

Amazon cases do not submit credentials, reset a real password, or place an order. Its access checks can be blocked or return incomplete pages, which the run records explicitly.

## 4. Deployment workflow

```mermaid
flowchart TD
    Code[Push to GitHub main] --> Vercel[Vercel deploys public folder]
    Code --> Render[Render builds Dockerfile]
    Browser[Student opens Vercel URL] --> Vercel
    Vercel -->|Rewrite /api requests| Render
    Render --> Runner[Headless Playwright on Render]
    Runner --> Targets[Approved websites]
    Runner --> Files[History and evidence files]
    Files --> Disk{Persistent disk attached?}
    Disk -->|Yes| Durable[History survives restart]
    Disk -->|No| Temporary[History lost on free instance restart]
```

`vercel.json` defines the API rewrite. `render.yaml` and `Dockerfile` define the runner. Local `npm start` uses a visible browser window; `TESTSPHERE_HEADLESS=true` selects headless mode for cloud hosting. See [deployment details](DEPLOYMENT.md).

## 5. CI workflow

```mermaid
flowchart LR
    Change[Push or pull request] --> Actions[GitHub Actions]
    Actions --> Checkout[Checkout repository]
    Checkout --> Node[Set up Node.js]
    Node --> Install[npm ci]
    Install --> Browsers[Install Playwright browsers]
    Browsers --> Tests[npm test]
    Tests --> Projects[Chromium, Firefox, WebKit]
    Projects --> Report[Upload HTML report artifact]
```

The source is [.github/workflows/playwright.yml](.github/workflows/playwright.yml); view its [GitHub Actions runs](https://github.com/Himanshu-Damara/TestSphere-3D/actions/workflows/playwright.yml). This CI flow runs the Playwright spec files. The dashboard's 90-case catalog is executed separately through the live runner.
