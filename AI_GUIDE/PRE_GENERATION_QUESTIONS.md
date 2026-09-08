# Pre-generation intake — mandatory by default

When this engine is uploaded to an AI chat and the user asks for a presentation, the AI must pause before creating presentation files and ask one concise adaptive questionnaire. The user does **not** need to add “ask me questions first.”

At minimum resolve audience, length, design direction, palette/accent, whether the HTML should show the Begin cover screen, opening style, content depth, visual emphasis, motion level, and primary viewing devices. The design question may offer a preferred UI system (for example Material, Carbon, Fluent, Bootstrap, or shadcn/ui) or “Your call”; do not add a separate mandatory library question. Add domain questions only when relevant—for example guideline basis and protocol/calculation depth for medicine.

Ask all questions together unless the user explicitly requests one-at-a-time questioning. Offer concrete choices plus free text. “Your call” authorizes the AI to choose professionally. After the answer, summarize the locked brief and proceed without requesting another approval, unless a safety-critical factual ambiguity remains.

Explicit phrases such as “proceed without questions,” “skip questions,” or “use your judgment and proceed” bypass intake. Record the choice in the compact request:

```json
"intake": {
  "status": "complete",
  "answers": {
    "design": "premium medical",
    "cover": true,
    "opening": "critical patient scenario",
    "motion": "restrained professional"
  }
}
```

Before asking, create a minimal draft request and run:

```bash
npm run intake -- draft-request.json --chat
```

Ask only the returned unresolved questions.

Supported ledger choices are normalized by IntakeResolver. Translate free-text palette/design/length answers into canonical fields before generation. Content/story answers require AI-authored content; they are not executable directives. Conflicting ledger and canonical fields must be reconciled using the latest user choice.
