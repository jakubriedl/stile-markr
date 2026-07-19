#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml)
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:3000}"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:4567}"
SAMPLE_XML="${SAMPLE_XML:-$ROOT/task/sample_results.xml}"

cleanup() {
  "${COMPOSE[@]}" down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Building and starting Markr Compose stack..."
"${COMPOSE[@]}" up --build -d --wait

echo "Checking backend readiness..."
backend_health="$(curl -fsS "$BACKEND_URL/health")"
test "$backend_health" = '{"status":"ok"}'

echo "Checking frontend SSR shell..."
# Strip NULs before bash stores the body (avoids "ignored null byte" + pipefail/grep -q races).
frontend_html="$(curl -fsS "$FRONTEND_URL/" | tr -d '\0')"
printf '%s' "$frontend_html" | grep -q "Upload exam results"

echo "Checking same-origin API proxy..."
curl -fsS "$FRONTEND_URL/api/tests" >/dev/null

if [[ -f "$SAMPLE_XML" ]]; then
  echo "Importing sample fixture through the proxy..."
  import_response="$(
    curl -fsS -X POST "$FRONTEND_URL/api/import" \
      -H "Content-Type: text/xml+markr" \
      --data-binary @"$SAMPLE_XML"
  )"
  # IMP-028 / FIX-003: successful sample import includes sorted test_ids.
  test "$import_response" = '{"imported":81,"test_ids":["9863"]}'

  echo "Verifying test list after import..."
  tests_response="$(curl -fsS "$FRONTEND_URL/api/tests")"
  printf '%s' "$tests_response" | grep -q '"test_id":"9863"'
  printf '%s' "$tests_response" | grep -q '"student_count":81'
fi

echo "Compose/API smoke checks passed."
