#!/usr/bin/env bash
# Clears Vite optimized-deps cache and reinstalls dependencies.
# Use after installing/updating packages if the dev server returns 504s
# for /node_modules/.vite/deps/* requests.
set -euo pipefail

echo "→ Removing Vite optimized-deps cache (node_modules/.vite)"
rm -rf node_modules/.vite

echo "→ Removing build artifacts (.nitro, .output, dist)"
rm -rf .nitro .output dist

echo "→ Reinstalling dependencies"
if command -v bun >/dev/null 2>&1; then
  bun install
else
  npm install
fi

echo "✓ Done. Restart the dev server."
