#!/usr/bin/env bash
# Pull the live wocoo-triage-v3 Magic site into this repo and commit the diff.
#
# The site is Okta-gated, so curl can't fetch it (302 -> /auth/login) and the
# only read path is the MCPLocker `magic_file_read` tool. This script therefore
# drives `claude -p` in stream-json mode and lifts the raw tool_result payloads
# out of the stream (see sync-parse.py), so the bytes land on disk exactly as
# the tool returned them -- the model never retypes file contents.
#
# Usage:
#   ./sync.sh              pull, syntax-check, commit if changed
#   ./sync.sh --no-commit  pull and syntax-check only, leave changes unstaged
#   ./sync.sh --dry-run    pull into a temp dir and diff, touch nothing

set -euo pipefail

OWNER="albert.cai"
SITE="wocoo-triage-v3"
FILES=(index.html app-data.js app-core.js app-workflows.js app-dashboard.js)
ATTEMPTS=3

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="commit"
case "${1:-}" in
  --no-commit) MODE="nocommit" ;;
  --dry-run)   MODE="dryrun" ;;
  "")          ;;
  *) echo "unknown flag: $1" >&2; exit 2 ;;
esac

command -v claude >/dev/null || { echo "claude CLI not found on PATH" >&2; exit 1; }

DEST="$REPO"
if [ "$MODE" = "dryrun" ]; then
  DEST="$(mktemp -d)"
  trap 'rm -rf "$DEST"' EXIT
fi

STREAM="$REPO/.sync-stream.jsonl"   # kept for debugging; gitignored

echo "==> pulling ${#FILES[@]} files from $OWNER/$SITE"
REMAINING=("${FILES[@]}")
for attempt in $(seq "$ATTEMPTS"); do
  [ ${#REMAINING[@]} -eq 0 ] && break
  [ "$attempt" -gt 1 ] && echo "==> retry $attempt for ${#REMAINING[@]} file(s): ${REMAINING[*]}"

  PROMPT="Call mcp__mcplocker__magic_file_read once for each of these files on the Magic site owner=$OWNER siteName=$SITE: ${REMAINING[*]}. Make one call per file and make all of them, even if a result comes back too large to display -- an oversized result still counts as done, just move on to the next file. Make the calls and nothing else: do not read, summarise, quote, or rewrite any file content. Reply with the single word done."

  claude -p "$PROMPT" \
    --output-format stream-json --verbose \
    --allowedTools "mcp__mcplocker__magic_file_read" \
    --permission-mode dontAsk \
    > "$STREAM"

  # writes what it found, prints the still-missing names on stdout
  MISSING="$(python3 "$REPO/sync-parse.py" "$STREAM" "$DEST" "${REMAINING[@]}")"
  REMAINING=()
  [ -n "$MISSING" ] && read -r -a REMAINING <<< "$MISSING"
done

if [ ${#REMAINING[@]} -ne 0 ]; then
  echo "pull incomplete after $ATTEMPTS attempts, missing: ${REMAINING[*]}" >&2
  echo "raw stream kept at $STREAM" >&2
  exit 1
fi
rm -f "$STREAM"

ESB="$(command -v esbuild || true)"
if [ -z "$ESB" ]; then
  ESB="$(ls -d "$HOME"/.npm/_npx/*/node_modules/@esbuild/*/bin/esbuild 2>/dev/null | head -1 || true)"
fi
if [ -n "$ESB" ]; then
  echo "==> syntax check"
  for f in "${FILES[@]}"; do
    case "$f" in
      *.js) "$ESB" --loader=jsx < "$DEST/$f" > /dev/null && echo "    ok $f" ;;
    esac
  done
else
  echo "==> syntax check skipped (esbuild not found)"
fi

if [ "$MODE" = "dryrun" ]; then
  echo "==> dry run diff (repo -> live)"
  for f in "${FILES[@]}"; do diff -u "$REPO/$f" "$DEST/$f" || true; done
  exit 0
fi

cd "$REPO"
if git diff --quiet -- "${FILES[@]}"; then
  echo "==> already in sync, nothing to commit"
  exit 0
fi

git --no-pager diff --stat -- "${FILES[@]}"
if [ "$MODE" = "nocommit" ]; then
  echo "==> --no-commit: changes left in working tree"
  exit 0
fi

git add -- "${FILES[@]}"
git commit -q -m "Sync from Magic site $(date +%Y-%m-%d)

Pulled $OWNER/$SITE via magic_file_read.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
echo "==> committed $(git rev-parse --short HEAD)"
