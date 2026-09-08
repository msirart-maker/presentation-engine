# V13.5 Master Engine

Upload this ZIP into an AI chat with file extraction and Node.js 18+ execution.
Ask: “Use this engine to make an HTML presentation about [topic].”

The AI should first read AI_INTERFACE/ENGINE_BOOTSTRAP.md, ask unresolved choices,
author source-grounded content, and run the generator. It should not read or rewrite
all engine code. No package installation is needed for generation.

Commands:
- npm run diagnose
- npm run intake -- request.json --chat
- npm run generate -- request.json presentation.html
- npm test
- npm run verify -- presentation.html
- npm run showcase
- npm run learn -- list
- npm run benchmark
- npm run package

SHOWCASE contains four runnable HTML examples, their editable schemas, and the
script to regenerate them. These are test/design examples, not browser-certified
reference outputs. See RELEASE_VALIDATION.json for actual completed verification.

Supported compositions and their extension contract are in COMPOSITIONS.
Opening variants: title, poster, editorial, chapter. Closing variants: statement,
quote, signature. Both accept visual: none, geometry, lines, orb. Orb is opt-in.
Set options.transition to none, fade, or slide. Motion respects reduced-motion
preferences. Choose design.narrativeArc="storm-to-calm" only for that narrative.

Browser verification requires Playwright and its installed browsers. The reading
fallback exposes content where JavaScript is disabled; native viewer behavior
still requires separate testing. Quality scores do not certify beauty or accuracy.
Persistent lessons are tested guidance; source changes require repackaging.
