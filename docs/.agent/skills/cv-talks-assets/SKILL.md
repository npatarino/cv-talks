---
name: cv-talks-assets
description: >
  Manage design system assets and source formatting for cv-talks. Use this skill
  whenever the user wants to sync fonts, format markdown decks, or check code formatting
  — including phrases like "sync fonts", "format decks", or "check format".
---

# Assets & Formatting

The project lives at `/Users/juansp/projects/chimi/cv-talks`.

## Formatting Decks

Decks are written in markdown and need to follow strict formatting conventions.

To automatically format all decks:
```bash
cd /Users/juansp/projects/chimi/cv-talks
bun run decks:format
```

To just check if the formatting is correct (e.g. in CI):
```bash
bun run decks:format-check
```

## Syncing Fonts

Fonts are consumed from the design system dependency. To copy them to the public directory:
```bash
bun run fonts:sync
```
*(Note: the `servers:start` and `slides:build` commands run this automatically).*
