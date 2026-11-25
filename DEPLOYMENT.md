# Deployment

The dashboard is served by Vercel. The Express API, QA Lab, Playwright browser runner, and run history are served by Render. Local runs stay visible; cloud runs use headless browsers.

## Render runner

The `Dockerfile` uses the Playwright image matching `package-lock.json` (1.63.0). `render.yaml` defines a free Docker web service and health check at `/api/execution/catalog`. The server listens on Render's `PORT` and the QA Lab target uses the same internal port.

Render's free filesystem is temporary. For history and screenshots to survive restarts or redeploys, attach a persistent disk on a paid Render service at `/app/storage` and set `TESTSPHERE_DATA_DIR=/app/storage/testsphere`. Without that disk, history is only retained while the instance exists.

## Vercel dashboard

The Vercel project serves the `public/` folder. `vercel.json` rewrites `/api/*` to `https://testsphere-3d-runner.onrender.com`. The dashboard uses server-sent events and artifact URLs through this API route.

The deployed runner has no screen on the student's computer. To watch a browser window directly, run the project locally with `npm start` and open `/platform/`.

## Current deployment

- Vercel dashboard: `https://testsphere-3d.vercel.app/platform/`
- Render runner and QA Lab: `https://testsphere-3d-runner.onrender.com/`
- GitHub source: `https://github.com/Himanshu-Damara/TestSphere-3D`

The Vercel project is connected to the GitHub `main` branch and currently uses Vercel Authentication. Visitors need access to the Vercel account unless that deployment protection setting is deliberately changed.

## Smoke checks

1. Open `<render-url>/api/execution/catalog` and verify the three targets.
2. Open `<vercel-url>/platform/` and verify the catalog and history load.
3. Run one QA Lab case, verify its status and report, then run an external case.
