#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

VENV_PATH="${VENV_PATH:-../.venv}"
if [ ! -f "$VENV_PATH/bin/activate" ]; then
  echo "Virtual environment not found at $VENV_PATH" >&2
  exit 1
fi

source "$VENV_PATH/bin/activate"

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

mkdir -p logs

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-4000}"
WORKERS="${WORKERS:-1}"

exec uvicorn app.main:app --host "$HOST" --port "$PORT" --workers "$WORKERS" >> logs/uvicorn.log 2>&1
