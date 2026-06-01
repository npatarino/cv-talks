#!/usr/bin/env bash
# start-servers.sh — Start all local development servers for cv-talks.
#
# Opens two processes in the same terminal session:
#   :8080  Eleventy (slides + live-reload)
#   :3001  Editor API + UI
#
# Usage:
#   bun run servers:start (via package.json)
#   ./scripts/start-servers.sh   (directly)
#
# Press Ctrl-C once to stop both servers.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ---- colours ----
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║         cv-talks · dev mode              ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  Slides  →  http://localhost:8080        ║"
echo "  ║  Editor  →  http://localhost:3001        ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${RESET}"

# ---- cleanup on exit ----
_CLEANUP_DONE=0
cleanup() {
  [[ $_CLEANUP_DONE -eq 1 ]] && return
  _CLEANUP_DONE=1
  echo -e "\n${YELLOW}Stopping servers…${RESET}"
  # Kill the whole process group so both children die
  kill -- -$$ 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ---- pre-flight: sync fonts (fast, idempotent) ----
echo -e "${GREEN}→ Syncing fonts…${RESET}"
node scripts/sync-fonts.mjs

# ---- start both servers ----
echo -e "${GREEN}→ Starting Eleventy on :8080…${RESET}"
bunx eleventy --serve --quiet &
ELEVENTY_PID=$!

echo -e "${GREEN}→ Starting Editor on :3001…${RESET}"
bun editor/server.mjs &
EDITOR_PID=$!

echo -e "${CYAN}Both servers running. Press Ctrl-C to stop.${RESET}\n"

# Wait for either child to exit (e.g. crash), then cleanup triggers
wait $ELEVENTY_PID $EDITOR_PID
