# TestSphere 3D Demonstration Guide

## 1. SauceDemo pass

1. Run `npm start`.
2. Open `http://localhost:3000/platform/`.
3. Select **SauceDemo** and **SauceDemo valid login**.
4. Choose Chromium, **Failure screenshots** or **Every key checkpoint**, and enable trace.
5. Click **Run selected test**.
6. Switch to the Live Testing Laboratory.
7. Point out the ordered browser launch, navigation, credential action, inventory assertion, and final report events.
8. Open the screenshot or trace artifact after completion.

## 2. Local defect detection

1. Return to the dashboard and select **My Website** (the local QA Lab).
2. Enable the local cart-total defect and apply the default `$1.00` undercharge.
3. Run the local cart-total verification.
4. Show the red assertion node, failed timeline step, expected/actual totals, console error, and failure screenshot.
5. Turn the defect off, apply the change, and rerun.
6. Show that the same real browser flow passes without the injected defect.

## 3. Amazon India homepage check

1. Select **Amazon India**.
2. Run the approved homepage smoke test.
3. Explain that the adapter only navigates to the public homepage and checks the approved host and non-empty title.
4. No login, CAPTCHA bypass, checkout, purchase, payment, or rate-limit evasion is attempted.

## 4. Local payment boundary

From the Local QA Lab checkout overview, choose **Failed simulated payment** and finish the order. The UI should show a declined mock-gateway message and no order confirmation. Switch back to **Successful simulated payment** to demonstrate the green path. Explain that the endpoint is local and does not handle real card data.

## Viva talking points

- The dashboard is not a report mockup: its run status, metrics, timeline, and artifacts come from the execution API.
- The local defect is isolated and explicit, allowing a reproducible red-to-green regression demonstration.
- The 3D view is a visual state representation synchronized to real events; the 2D view is the accessible fallback.
- The screenshot panel is evidence streaming, not a claim of full remote desktop interactivity.
- The browser process is owned by the run manager and is closed during normal completion or stop.
