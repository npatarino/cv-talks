#!/usr/bin/env bash

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Buscando instancias de servidores activos...${NC}"

# Función para matar procesos por puerto
kill_port() {
  local PORT=$1
  local PIDS=$(lsof -t -i:$PORT)
  
  if [ -n "$PIDS" ]; then
    echo -e "➔ Encontrado proceso(s) usando el puerto $PORT: $PIDS. Matando..."
    echo "$PIDS" | xargs kill -9
    echo -e "${GREEN}✓ Puerto $PORT liberado.${NC}"
  else
    echo -e "✓ Ningún proceso usando el puerto $PORT."
  fi
}

# 8080: Eleventy (Slides)
# 3001: Editor API
kill_port 8080
kill_port 3001

echo -e "${GREEN}Todos los servidores de cv-talks han sido detenidos.${NC}"
