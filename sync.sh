#!/usr/bin/env bash
# Pull the live wocoo-triage-v3 Magic site into this repo and commit the diff.
#
# The site is Okta-gated, so curl can't fetch it (302 -> /auth/login) and the
# only read path is the MCPLocker `magic_file_read` tool. This script therefore
# drives `claude -p` in stream-json mode and lifts the raw tool_result payloads
# out of the stream, so the bytes land on disk exactly as the tool returned them
# -- the model never retypes file contents.
#
# Usage:
#   ./sync.sh              pull, syntax-check, commit if changed
#   ./sync.sh --no-commit  pull and syntax-check only, leave changes unstaged
#   ./sync.sh --dry-run    pull into a temp dir and diff, touch nothing

set -euo pipefail

OWNER="albert.cai"
SITE="wocoo-triage-v3"
FILES=(index.html app-data.js app-core.js app-workflows.js app-dashboard.js)

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

STREAM="$(mktemp)"
trap 'rm -f "$STREAM"' EXIT

PROMPT="Call mcp__mcplocker__magic_file_read once for each of these files on the Magic site owner=$OWNER siteName=$SITE: ${FILES[*]}. Make the calls and nothing else -- do not summarise, quote, or rewrite any file content. Reply with the single word done."

echo "==> pulling ${#FILES[@]} files from $OWNER/$SITE"
claude -p "$PROMPT" \
  --output-format stream-json --verbose \
  --allowedTools "mcp__mcplocker__magic_file_read" \
  --permission-mode dontAsk \
  > "$STREAM"

python3 - "$STREAM" "$DEST" "${FILES[@]}" <<'PY'
import json, os, re, sys

stream, dest, *wanted = sys.argv[1:]
found = {}

def absorb(text):
    """A tool_result is either the file JSON, or an overflow notice pointing at a dump file."""
    text = text.strip()
    if not text:
        return
    if text.startswith("{"):
        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            return
        if "path" in payload and "content" in payload:
            found[payload["path"]] = payload["content"]
        return
    m = re.search(r"Output has been saved to (\S+)", text)
    if m and os.path.exists(m.group(1)):
        absorb(open(m.group(1)).read())

def walk(node):
    """Event shapes vary (message can be a bare string), so hunt for tool_result blocks anywhere."""
    if isinstance(node, dict):
        if node.get("type") == "tool_result":
            content = node.get("content")
            if isinstance(content, str):
                absorb(content)
            elif isinstance(content, list):
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        absorb(part.get("text", ""))
        for value in node.values():
            walk(value)
    elif isinstance(node, list):
        for value in node:
            walk(value)

for line in open(stream):
    line = line.strip()
    if not line:
        continue
    try:
        walk(json.loads(line))
    except json.JSONDecodeError:
        continue

missing = [f for f in wanted if f not in found]
if missing:
    sys.exit("pull incomplete, missing: " + ", ".join(missing))

for name in wanted:
    with open(os.path.join(dest, name), "w") as fh:
        fh.write(found[name])
    print(f"    {name}: {len(found[name])} chars")
PY

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
