# Browser validation

The repository retains its original README.md. ENGINE_README.md contains the imported engine guide. V13.5 source is extracted at the repository root; generated deliverables are rebuilt from source in CI.

## Reproduce

Use Node.js 22 or later for the pinned Playwright development dependency.

```sh
npm ci
npm test
npm run showcase
node QA/browser/fixtures.mjs
node QA/browser/stress-fixtures.mjs
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

To target a single combination, append `-- --project=webkit-mobile` to `npm run test:browser`.

## Scope and evidence

The workflow runs on pushes, pull requests, and manual dispatch. Existing portable regressions must pass before six independent browser jobs run. Each job generates Editorial, Technical, Geometric, and Cinematic presentations from the current commit and checks every slide, forward/back navigation, replay dispatch, rotation, keyboard navigation, layout clipping, broken images, and browser errors. Separate tests exercise the Begin screen, portrait-prompt dismissal, touch activation, and reduced motion at startup.

Desktop viewport: 1440 × 900. Mobile viewport: 390 × 844, followed by rotation to 844 × 390. Mobile projects enable touch; Chromium and WebKit also enable Playwright mobile emulation. Firefox supports the mobile viewport and touch configuration but does not implement Playwright's isMobile option.

Artifacts include generated presentations, regression logs, per-slide PNG screenshots, HTML and JUnit reports, and traces/videos for failures. Browser artifacts are retained for 14 days. A screenshot capture is not a pixel-baseline comparison or aesthetic approval.

A passing run supports only the tested generated presentations, browser versions, viewport configurations, and interactions at that commit. It does not certify all possible presentations, physical iPhones/Android devices, native iOS file preview, fullscreen, or every Safari/Chrome/Firefox release. Consult the Actions results for the commit being used; do not infer compatibility from the portable regression suite alone.

## Visual stress coverage

The matrix includes three deterministic stress decks (13 slides): dense fictional clinical-style workflows and tables, long chart labels and paired charts, and embedded image crop targets with varied aspect ratios. All data is synthetic, not medical guidance or real-world evidence. Each project runs nine tests (54 across the matrix). Stress decks exercise both 1440 × 900 and 900 × 1440 in desktop projects, and both 390 × 844 and 844 × 390 in mobile projects.

Stress assertions check text glyph clipping, minimum body/table font sizes, horizontal overflow, image loading, navigation, and uncaught browser errors. Tall slides are captured in overlapping viewport-sized scroll sections; screenshots do not temporarily enlarge the browser viewport. PNGs and layout measurements are stored with the reports. Chromium jobs also include small JPEG copies in authenticated job logs for visual inspection; no public website is published.

Stress-driven shared fixes include readable table typography with labelled rows in portrait, wrapping long tokens and chart legends, fewer complete axis labels where space is limited, collision-aware chart labels, bounded chart animation progress, portrait media stacking, closing-quote/control contrast, and active-slide selection inside tall content. Images are also checked for collapsed dimensions and hidden ancestors. These targeted checks are not a complete accessibility audit or an automated assessment of design quality.
