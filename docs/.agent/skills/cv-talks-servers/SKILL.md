---
name: cv-talks-servers
description: >
  Manage the local development servers for cv-talks. Use this skill whenever
  the user wants to start, run, stop, or manage the development infrastructure — including
  phrases like "start the editor", "run cv-talks", "arranca los servidores",
  "start dev", "apaga los servidores", "stop servers", or "levanta el editor".
---

# Local Servers Management

The project lives at `/Users/juansp/projects/chimi/cv-talks`.

Two servers form the local development infrastructure:
| Server | Port | Purpose |
|--------|------|---------|
| Eleventy | :8080 | Slides preview with live-reload |
| Editor | :3001 | Slide editor UI + REST API |

## Starting Servers

To start both servers simultaneously:
```bash
cd /Users/juansp/projects/chimi/cv-talks
bun run servers:start
```
*(This command syncs fonts and starts both processes in the background. Press Ctrl-C to stop both)*

**URLs once running:**
- **Slides preview** → http://localhost:8080
- **Slide editor** → http://localhost:3001

## Stopping Servers

To force kill any running instance of the servers:
```bash
cd /Users/juansp/projects/chimi/cv-talks
bun run servers:stop
```

## Troubleshooting

If a port is already in use, `bun run servers:stop` should fix it. Alternatively, manually:
```bash
lsof -ti :8080 | xargs kill -9
lsof -ti :3001 | xargs kill -9
```
