@./STANDARDS.md

## What this is

A URL shortener, deliberately minimal. This repo exists to demonstrate an
AI-assisted development pipeline — the CI config, hooks, and review prompts
are the point. The application is scaffolding. Keep it small.

If a change makes the app bigger without demonstrating something about the
pipeline, it doesn't belong here.

## Architecture

Cloudflare Worker running Hono. Storage is an in-memory `Map` — no D1, no KV,
no database. State does not survive a restart, and that is fine.

Request flow:

    POST /links       auth -> validate URL -> generate code -> store -> 201
    GET  /:code       lookup -> increment hits -> 302 redirect
    GET  /links/:code auth -> lookup -> 200 with { code, url, hits }

## File layout

Flat. Three files in `src/`. Do not create `routes/`, `lib/`, `utils/`, or any
other directory — the file tree should make the app look as small as it is.

    src/app.ts     routes + wiring
    src/links.ts   business logic + store
    src/auth.ts    API key check
    tests/         one test file per src module

## Conventions

- **Error responses** are always `{ error: string }`. No other shape.
- **URL validation** lives in a named exported function (`isValidTargetUrl`)
  in `links.ts`, never inline in a route handler. An unvalidated redirect is
  an open redirect — it lets an attacker mint links on our domain that
  point at phishing sites.
- **Short codes** are 7 characters, alphanumeric, randomly generated.
- **Auth** reads the `x-api-key` header and compares against an env var.
- Prefer explicit over clever. This code gets read on a projector.
- **Logging** — log the short code, never the target URL. Target URLs
  routinely carry tokens and session identifiers in query strings.

## Testing

Tests call `app.request()` directly — no server, no Miniflare. Every route
needs at least one success case and one failure case. A new endpoint without
tests is incomplete, not "to be followed up."

## Commands

- `npm run dev` — local dev server via Wrangler
- `npm run verify` — lint + typecheck + test, in that order. Run this before
  every commit and it's the exact command CI runs. If it's not green, don't
  push.
- `npm run test` — vitest run (all tests)
- `npx vitest run tests/auth.test.ts` — run a single test file
- `npm run lint` / `npm run typecheck` — individual checks, useful when
  narrowing down a verify failure
