# 0002. NDJSON keepalive heartbeats in query stream

- **Status:** accepted
- **Date:** 2026-08-28
- **Deciders:** capstone team
- **Mirrors:** backend `docs/adr/0009-stream-keepalive-and-timeout.md`

## Context

LLM-backed pipelines can block for 10–60 s per stage. Reverse proxies
(nginx, ALB, Cloud Run) kill idle HTTP connections after 60–120 s with no
bytes on the wire. The backend now emits SSE-style comment lines
(`:keepalive\n`) between NDJSON progress events to keep the TCP pipe alive.

Without the frontend skipping `:` lines, `JSON.parse(":keepalive ...")`
throws a `SyntaxError`, which propagates to `submitQuery`'s catch block,
sets the error state, and aborts the stream — the real result line is
never read. Any query slow enough to emit a heartbeat (>15 s default)
fails in the UI.

## Decision

`readNdjsonStream` in `src/api.js` skips lines starting with `:` before
parsing:

```js
if (!text || text.startsWith(':')) return
```

This is applied in `handleLine`, the single point where raw text is parsed
to JSON. All other NDJSON consumers in the app go through
`readNdjsonStream`.

Alternatives considered:
- **Filter on the backend before sending**: adds complexity to the
  generator; the `:` prefix is already a well-known SSE convention for
  comments that proxies relay and consumers skip.
- **Separate keepalive channel (WebSocket/SSE)**: over-engineered for a
  demo-scale deployment; the NDJSON comment pattern is sufficient.

## Consequences

- The frontend must not add any other NDJSON parser that doesn't skip `:`
  lines.
- The backend ADR-0009 documents the contract: lines starting with `:` are
  heartbeats, not JSON, and must be ignored by consumers.
- `HEARTBEAT_INTERVAL` (default 15 s) is well under typical proxy idle
  timeouts (60 s). If a future reverse proxy has a shorter idle timeout,
  the interval can be lowered via env var without frontend changes.
