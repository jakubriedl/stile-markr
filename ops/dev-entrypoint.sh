#!/bin/sh
set -eu

cd /app
# Empty named volumes look like a foreign node_modules tree; avoid TTY purge prompts.
export CI=true
pnpm install --frozen-lockfile
exec "$@"
