# Browser validation

The repository retains its original README.md. ENGINE_README.md contains the imported engine guide. V13.5 source is extracted at the repository root; generated deliverables are rebuilt from source in CI.

## Reproduce

Use Node.js 22 or later for the pinned Playwright development dependency.

```sh
npm ci
npm test
npm run showcase
node QA/browser/fixtures.mjs
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

To target a single combination, append `-- --project=webkit-mobile` to `npm run test:browser`.

## Scope and evidence

The workflow runs on pushes, pull requests, and manual dispatch. Existing portable regressions must pass before six independent browser jobs run. Each job generates Editorial, Technical, Geometric, and Cinematic presentations from the current commit and checks every slide, forward/back navigation, replay dispatch, rotation, keyboard navigation, layout clipping, broken images, and browser errors. Separate tests exercise the Begin screen, portrait-prompt dismissal, touch activation, and reduced motion at startup.

Desktop viewport: 1440 × 900. Mobile viewport: 390 × 844, followed by rotation to 844 × 390. Mobile projects enable touch; Chromium and WebKit also enable Playwright mobile emulation. Firefox supports the mobile viewport and touch configuration but does not implement Playwright's isMobile option.

Artifacts include generated presentations, regression logs, per-slide PNG screenshots, HTML and JUnit reports, and traces/videos for failures. Browser artifacts are retained for 14 days. A screenshot capture is not a pixel-baseline comparison or aesthetic approval.

A passing run supports only the tested generated presentations, browser versions, viewport configurations, and interactions at that commit. It does not certify all possible presentations, physical iPhones/Android devices, native iOS file preview, fullscreen, or every Safari/Chrome/Firefox release. Consult the Actions results for the commit being used; do not infer compatibility from the portable regression suite alone.
