# wocoo-triage-v3

Git mirror of the WOCOO triage dashboard Magic site.

- Live site: https://magic.w10e.com/albert.cai/wocoo-triage-v3 (Okta-gated)
- **The Magic site is the source of truth.** This repo is a snapshot for history and diffing.

## Files

| File | Role |
|---|---|
| `index.html` | Page shell, dark-mode/SLA/toast CSS, loads the four scripts as `text/babel` |
| `app-data.js` | Seed ticket data per assignee, MCP config, classification helpers, shared constants |
| `app-core.js` | Shared UI/runtime helpers |
| `app-workflows.js` | Overpayment triage workflow (REIMB + FRAUD paths), Move modal, bridge calls |
| `app-dashboard.js` | Main dashboard, tabs, table |

Scripts are plain `var`-scoped globals compiled in the browser by Babel standalone, in the order listed in `index.html`. There is no build step and no bundler.

## Dependencies (CDN, loaded by `index.html`)

- React 18 + ReactDOM 18 (UMD, production)
- `@babel/standalone@7` — **pinned to 7 on purpose**; v8 emits `import` statements that break `type="text/babel"` scripts

## Syncing with the Magic site

`./sync.sh` pulls all five files from the live site and commits the diff:

```
./sync.sh              # pull, syntax-check, commit if changed
./sync.sh --no-commit  # pull and check only, leave changes in the working tree
./sync.sh --dry-run    # pull into a temp dir and print the diff, touch nothing
```

It shells out to `claude -p --output-format stream-json` and lifts the raw
`magic_file_read` tool_result payloads out of the stream, so file bytes land on
disk exactly as the tool returned them — the model never retypes content. If a
result overflows and the harness spills it to a dump file, the parser follows the
`Output has been saved to …` pointer. A pull that misses any of the five files
aborts before writing.

### Manual equivalents

Pull (read one file):

```
magic_file_read  owner=albert.cai siteName=wocoo-triage-v3 filePath=app-workflows.js
```

Push (edit one file, exact-match search/replace):

```
magic_file_edit  owner=albert.cai siteName=wocoo-triage-v3 filePath=app-workflows.js \
                 old_string=... new_string=...
```

Notes:
- `magic_file_edit` rejects `.jsx` paths — keep the `.js` extension (Babel does not care).
- `magic_file_write` on a large file gets paraphrased by subagents; chunk large writes.
- The site is Okta-gated, so plain `curl` of the published URL returns a 302 to `/auth/login`.

## Syntax check

No test suite. To catch parse errors before pushing:

```
esbuild --loader=jsx < app-workflows.js > /dev/null
```

## Related

- Apps Script bridge (`callBridgeViaIframe`) handles JIRA writes that MCPLocker blocks — FRAUD create/link, transitions, comments.
- FRAUD is an MCP "limited" project: all FRAUD writes must go through the bridge.
