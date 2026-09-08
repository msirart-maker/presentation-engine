# V13.5 — start here

Use this executable engine to assemble HTML presentations. Read only this file,
GENERATION_CONTRACT.json, INTAKE_PROTOCOL.json, and PRE_GENERATION_QUESTIONS.md
initially. Do not load implementation files or old generated decks into context.

1. Check that the chat environment can extract files and execute Node.js 18+.
   Run `npm run diagnose`. If unavailable, explain that executable generation is
   unavailable; do not silently replace it with coding the whole runtime by hand.
2. When asked for a presentation, collect missing intake choices. A temporary
   request for `npm run intake -- request.json --chat` is permitted before answers;
   do not generate a presentation until answers or an explicit bypass are recorded.
3. Accept “Your call.” Resolve free-text choices into supported fields. The resolver
   applies supported ledger answers; incompatible explicit fields produce a conflict.
   Correct the request using the user's latest choice without another approval round.
4. Author source-grounded sections, charts, images, opening, and closing content.
   Depth, sources, visual emphasis, and opening story are AI content responsibilities;
   the answer ledger alone does not implement them. Read `npm run learn -- list` for
   validated reusable guidance. Do not include identifiable presentation content in lessons.
5. Run `npm run generate -- request.json presentation.html`. Review the effective
   `.brief.json` and `.receipt.json`; inspect the full schema only for a specific repair.
6. Run `npm run verify -- presentation.html` on this actual file. It creates a separate
   hash-bound `.browser.json` report. Missing browsers mean blocked, not passed.
   Set `generation.renderQA: true` to include browser checks in the generation receipt.
7. Inspect rendered slides when a browser is available. Never interpret a structural
   score as aesthetic, factual, or physical-device certification. Repair and regenerate.
8. Deliver the HTML and disclose material unverified areas concisely. For offline output,
   require `assetPolicy.offlineRequired: true` and check the asset receipt.

Run `npm test` for packaged deterministic regressions. `npm run qa` is the same
explicitly static suite; `npm run verify -- file.html` is the separate browser gate.
The full development matrix is not bundled in the upload runtime.

# Improvement workflow

Fix and test reusable implementation changes in the engine. Record a lesson with
`npm run learn -- record lesson.json`, then promote it with
`npm run learn -- promote ID QA/regression.mjs CORE/changed-module.mjs`.
Promotion requires a passing test and binds the lesson to hashes of the test and
implementation. Changed files deactivate stale lessons. Guidance is advisory and
is included in later production plans; it never rewrites code automatically.
Repackage with `npm run package` and deliver the updated ZIP for the next chat.
A previous ZIP never updates itself across chats.

# V13.5 creative direction

After intake, choose a coherent type, spacing, imagery and motion direction before
writing content. Use the registry COMPOSITIONS/catalog.json to select a composition
by communicative purpose; record explicit choices in sections[].composition.
Do not repeat a decorative orb or force a storm-to-calm story on unrelated content.
Prefer varied information structure over random colors or arbitrary animation.

Opening and closing accept variant and visual choices listed in START_HERE.md.
Use options.transition (none/fade/slide). Additional explicit animation types are
wipe, emphasisPulse and fadeOut; slideExit is a supported trigger. Step timing,
reduced-motion behavior and cancellation belong to the engine.

Build and inspect SHOWCASE only when extending or auditing the visual library.
Do not load its generated HTML into model context during ordinary generation.
The benchmark command computes comparisons only after an operator supplies actual
paired usage with the same brief and accepted output quality. It does not measure
provider tokens automatically. The empty default remains explicitly unmeasured.
