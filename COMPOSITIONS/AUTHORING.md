# Extending the visual library

To add a composition using an existing primitive, add one entry to catalog.json:
`id`, `label`, `primitive`, `intents`, and `maxItems`. The validator, automatic
selector and renderer use this registry. No core file changes are needed for a
new arrangement using an existing primitive. Primitive implementations live in
render.mjs and compositions.css.

Request it with `sections[].composition`. The entire section stays together and
capacity overflow is rejected rather than silently truncated. Decision trees need
unique item `id` values, optional `parent` IDs and optional `edge` labels. Cycles
and missing parents are rejected. Source order controls sibling ordering.

For a completely new visual primitive, implement its DOM in render.mjs, add its
styles and responsive behavior in compositions.css, and register the primitive.
Use escaped text, semantic HTML, the theme's tokens, and data-v10-role="uiItem"
for reusable entrance/exit behavior. Add a regression under QA and regenerate the
showcase. Review the rendered output before claiming visual acceptance.

Keep domain facts out of reusable templates. Test short content, long labels,
maximum capacity, portrait, landscape, reduced motion and keyboard interaction.
Store tested lessons with the learn command. Repackage to carry changes to the
next chat. This is a source extension workflow; it never installs remote code.
