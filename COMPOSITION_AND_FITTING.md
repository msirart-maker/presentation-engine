# Composition and reading budgets

This update builds on browser-tested commit 56a498892a01b878c7637dffbae5b24e7140d780.

## Select by purpose

Generation request sections accept an optional `intent`: `explain`, `compare`, `evidence`, `process`, `sequence`, `action`, `decision`, or `quote`.
An explicit `composition` remains authoritative. Automatic selection checks capacity, uses whole-word title/summary matches, and varies consecutive patterns only when candidates score equally. A decision tree requires valid IDs and parent relationships; the engine does not invent branches.

## Fit without deleting content

Set `options.contentFit: "split"` in a presentation schema, or pass `{contentFit:"split"}` as the fourth argument to `buildPresentationData`.
The default is `"preserve"`, which retains slide counts. Use it when an exact slide count or authored sequence matters.

Split mode paginates slides containing one supported component: GlassCard, ImageStoryCard, Charts, ReferencePanel, or a data-table UIRecipe. It uses an estimated 160-word reading budget and component-specific item limits. Every item retains its original fields and order; titles gain page numbers and concluding notes remain on the last page.
Linked diagrams, mixed-component slides and custom animation selectors remain intact. Long indivisible items are preserved and flagged for review. No summarisation, clinical interpretation or automatic deletion is performed.

Build results expose `contentFit`, also embedded as JSON under `#v13-content-fit`. This is a content-budget heuristic, not a guarantee that arbitrary content fits every screen. Browser rendering remains the final check.

## Verification

`npm test` includes intent selection, topology, capacity, content conservation, ID collision, input immutability and repeat-application checks.
`StressFitting` exercises generated pagination and semantic layouts in all six browser projects. Its browser checks also compare every card and table-row title against the original ordered content.
