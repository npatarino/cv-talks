---
name: cv-talks-servers
description: >
  Manage the local development servers for cv-talks. Use this skill whenever
  the user wants to start, run, stop, or manage the development infrastructure — including
  phrases like "start the editor", "run cv-talks", "arranca los servidores",
  "start dev", "apaga los servidores", "stop servers", or "levanta el editor".
---

# Local Servers Management

Run every command from the repository root (the `cv-talks` checkout that contains `package.json`).

Two servers form the local development infrastructure:
| Server | Port | Purpose |
|--------|------|---------|
| Eleventy | :8080 | Slides preview with live-reload |
| Editor | :3001 | Slide editor UI + REST API |

## Starting Servers

To start both servers simultaneously:
```bash
bun run servers:start
```
*(This command syncs fonts and starts both processes from the same terminal. Press Ctrl-C to stop both.)*

**URLs once running:**
- **Slides preview** → http://localhost:8080
- **Slide editor** → http://localhost:3001

## Stopping Servers

To force kill any running instance of the servers:
```bash
bun run servers:stop
```

## Troubleshooting

If a port is already in use, `bun run servers:stop` should fix it (it finds the
listening processes with `lsof`, falling back to `fuser` or `ss`). Alternatively, manually:
```bash
lsof -t -i tcp:8080 -s TCP:LISTEN | xargs kill -9
lsof -t -i tcp:3001 -s TCP:LISTEN | xargs kill -9
```
