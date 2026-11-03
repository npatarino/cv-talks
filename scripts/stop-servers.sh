#!/usr/bin/env bash
# stop-servers.sh — Kill whatever is listening on the cv-talks dev ports.
#
#   :8080  Eleventy (slides)
#   :3001  Editor API + UI
#
# Finds PIDs with the first available tool: lsof (macOS / most Linux),
# fuser (psmisc) or ss (iproute2). Fails with a clear message if none exist.
#
# Usage:
#   bun run servers:stop (via package.json)
#   ./scripts/stop-servers.sh   (directly)

set -uo pipefail

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

PORTS=(8080 3001)

if command -v lsof >/dev/null 2>&1; then
  PID_TOOL=lsof
elif command -v fuser >/dev/null 2>&1; then
  PID_TOOL=fuser
elif command -v ss >/dev/null 2>&1; then
  PID_TOOL=ss
else
  echo -e "${RED}✗ Cannot find the processes on ports ${PORTS[*]}: none of lsof, fuser or ss is installed.${NC}" >&2
  echo "  Install one of them (e.g. 'apt install lsof' or 'apt install psmisc'), or stop the servers manually (Ctrl-C in their terminal)." >&2
  exit 1
fi

# Prints the PIDs listening on a TCP port, one per line (nothing if free).
pids_on_port() {
  local port=$1
  case "$PID_TOOL" in
    lsof)  lsof -t -i "tcp:$port" -s TCP:LISTEN 2>/dev/null ;;
    fuser) fuser -n tcp "$port" 2>/dev/null | tr -s ' ' '\n' | grep -E '^[0-9]+$' ;;
    ss)    ss -ltnpH "sport = :$port" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 ;;
  esac | sort -u
}

echo -e "${YELLOW}Looking for running cv-talks servers (using ${PID_TOOL})...${NC}"

kill_port() {
  local port=$1
  local pids
  pids=$(pids_on_port "$port")

  if [ -n "$pids" ]; then
    echo -e "➔ Port $port is used by PID(s): $(echo $pids). Killing..."
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
    echo -e "${GREEN}✓ Port $port freed.${NC}"
  else
    echo -e "✓ Nothing listening on port $port."
  fi
}

for port in "${PORTS[@]}"; do
  kill_port "$port"
done

echo -e "${GREEN}All cv-talks servers stopped.${NC}"
