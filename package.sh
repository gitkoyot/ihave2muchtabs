#!/usr/bin/env bash
# Build installable ZIP packages for the I Have 2 Much Tabs extension.
#
# Usage:
#   ./package.sh                  # build chrome, firefox and edge packages
#   ./package.sh chrome firefox   # build only the listed targets
#
# Output ZIPs are written to the repository root:
#   ihave2muchtabs-<target>-<version>.zip
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="$ROOT_DIR/extension"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not on PATH." >&2
  exit 1
fi

cd "$EXT_DIR"

if [ ! -d node_modules ]; then
  echo "[package] Installing dependencies..."
  npm install
fi

TARGETS=("$@")
if [ ${#TARGETS[@]} -eq 0 ]; then
  TARGETS=(chrome firefox edge)
fi

VERSION="$(node -p "require('./package.json').version")"

for target in "${TARGETS[@]}"; do
  case "$target" in
    chrome|firefox|edge) ;;
    *)
      echo "Error: invalid target '$target'. Valid: chrome, firefox, edge." >&2
      exit 1
      ;;
  esac
  echo "[package] Building $target package (v$VERSION)..."
  node ./scripts/build.mjs --target "$target" --package
done

echo ""
echo "[package] Done. Packages in $ROOT_DIR:"
for target in "${TARGETS[@]}"; do
  echo "  ihave2muchtabs-$target-$VERSION.zip"
done
