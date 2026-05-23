---
name: cv-talks-dev
description: >
  Start the cv-talks local development environment. Use this skill whenever
  the user wants to start, run, or open the cv-talks project locally — including
  phrases like "start the editor", "run cv-talks", "arranca los servidores",
  "start dev", "open the slide editor", "launch the project", or "quiero editar slides".
  Triggers for both the Eleventy preview server (:8080) and the slide editor (:3001).
---

# cv-talks dev environment

The project lives at `/Users/juansp/projects/chimi/cv-talks`.

Two servers need to run simultaneously:

| Server | Port | Purpose |
|--------|------|---------|
| Eleventy | :8080 | Slides preview with live-reload |
| Editor | :3001 | Slide editor UI + REST API |

## Start both servers

```bash
cd /Users/juansp/projects/chimi/cv-talks
bun run dev
```

This runs `scripts/dev.sh`, which:
1. Syncs fonts from the design system
2. Starts Eleventy (`bunx eleventy --serve --quiet`) in the background
3. Starts the editor (`bun editor/server.mjs`) in the background
4. Prints a banner and waits — **Ctrl-C stops both**

## URLs once running

- **Slides preview** → http://localhost:8080
- **Slide editor** → http://localhost:3001
- **Template gallery** → http://localhost:8080/talks/template-gallery/
- **Deck player** → http://localhost:8080/talks/decks/{slug}/deck/

## Run servers separately (if needed)

```bash
# Eleventy only
bun run serve

# Editor only
bun run editor

# Eleventy in meta-mode (shows field names instead of content)
bun run serve:meta
```

## Troubleshooting

**Port already in use** — kill the stale process:
```bash
lsof -ti :8080 | xargs kill -9
lsof -ti :3001 | xargs kill -9
```

**Fonts missing** — run sync manually:
```bash
node scripts/sync-fonts.mjs
```
