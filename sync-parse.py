#!/usr/bin/env python3
"""Extract magic_file_read payloads from a claude -p stream-json transcript.

Usage: sync-parse.py <stream.jsonl> <dest-dir> <wanted-file> [...]

Writes every wanted file it found into dest-dir, byte-for-byte as the tool
returned it, and prints the names still missing (space separated) on stdout so
the caller can retry just those. Diagnostics go to stderr.
"""
import json
import os
import re
import sys

stream, dest, *wanted = sys.argv[1:]
found = {}
seen = []  # top-level tool_result payloads, for diagnostics on a short pull


def absorb(text, top=True):
    """A tool_result is either the file JSON, or an overflow notice naming a dump file."""
    text = text.strip()
    if top:
        seen.append(text)
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
    m = re.search(r"saved to (\S+?)[\s.,)]*$", text.split("\n")[0]) or re.search(
        r"saved to (\S+)", text
    )
    if m:
        path = m.group(1).rstrip(".,)")
        if os.path.exists(path):
            absorb(open(path).read(), top=False)


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


with open(stream) as fh:
    for line in fh:
        line = line.strip()
        if not line:
            continue
        try:
            walk(json.loads(line))
        except json.JSONDecodeError:
            continue

for name in wanted:
    if name in found:
        with open(os.path.join(dest, name), "w") as fh:
            fh.write(found[name])
        print(f"    {name}: {len(found[name])} chars", file=sys.stderr)

missing = [f for f in wanted if f not in found]
if missing:
    print(f"    got {len(wanted) - len(missing)}/{len(wanted)} from {len(seen)} tool results", file=sys.stderr)
    for i, text in enumerate(seen, 1):
        print(f"    [{i}] {text[:240].replace(chr(10), ' ')}", file=sys.stderr)

print(" ".join(missing))
