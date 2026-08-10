# ai-workflow-demo

A small URL shortener, built to demonstrate a four-gate AI-assisted coding
workflow: the same standards enforced at four different points — when an
agent writes code, when a developer commits, before a PR is opened, and
automatically on every PR — using nothing but files committed in this repo.
No proprietary tooling; every piece here is a plain text file, a shell hook,
or a GitHub Actions workflow, so the pattern ports to any language or stack.

The app itself is intentionally minimal (176 lines across three files) —
it's not the point. `src/auth.ts` and the URL-validation logic in
`src/links.ts` are both correctly implemented on `main` (constant-time
API-key comparison, an https/http allowlist for redirect targets) — the
security substance the four gates exist to protect. Deliberately broken
variants of both were tested on separate demo branches during development
— never merged — specifically to confirm the gates catch real regressions
rather than passing silently.

## How this was built

1. **`STANDARDS.md`** — company-wide coding standards and security rules,
   portable across every repo. Then **`CLAUDE.md`** — project-specific
   direction (architecture, conventions, and where each `STANDARDS.md` rule
   is enforced in this codebase). `CLAUDE.md` was written before any code
   was scaffolded — it's intent, not documentation of what already exists.

   `CLAUDE.md` loads into context automatically at the start of every
   Claude Code session in this repo. Its first line, `@./STANDARDS.md`,
   pulls `STANDARDS.md` in too — both are always present, with no reminding.

2. **`.claude/commands/review.md`** — a slash command (distinct from Claude
   Code's separate "Skills" feature), invocable as `/review`. Its content
   is used two ways: run manually by a developer anytime, before opening a
   PR (Gate 3), or reused as the prompt inside a GitHub Actions workflow
   that runs automatically on every PR (Gate 4b).

3. **Pre-commit checks via [Husky](.husky/pre-commit)** — hooks on
   `git commit` that block the commit if it doesn't pass type checking
   (`tsc --noEmit`).

   Autofixable lint and formatting issues (ESLint `--fix`, Prettier via
   `lint-staged`) are corrected and silently re-staged. Lint errors ESLint
   can't autofix — most `@typescript-eslint` rules, like
   `no-floating-promises` — still block the commit, same as a type error.

4. **[`CODEOWNERS`](.github/CODEOWNERS)** and a repo secret for
   `ANTHROPIC_API_KEY`.

5. **Deterministic CI** — a GitHub Actions workflow
   ([`ci.yml`](.github/workflows/ci.yml)) runs `npm run verify` (lint +
   typecheck + test) on every PR. Branch protection on `main` requires this
   check to pass before merging — a failing check doesn't just show a red
   X, it disables the merge button entirely.

6. **AI-assisted PR review** — a second workflow
   ([`ai-review.yml`](.github/workflows/ai-review.yml)) uses the Anthropic
   API key to run the same `/review` prompt against the PR diff, and posts
   the result as a PR comment: a summary and analysis for a human reviewer
   to optionally consider, not a gate that blocks anything on its own.

## The four gates, at a glance

| Gate | What it enforces | Where |
|---|---|---|
| 1 — Agent context | Conventions and security rules present in every AI session, before code is written | [`CLAUDE.md`](CLAUDE.md), [`STANDARDS.md`](STANDARDS.md) |
| 2 — Pre-commit | Type errors block; autofixable lint/format issues auto-fix; unfixable lint errors block | [`.husky/pre-commit`](.husky/pre-commit) |
| 3 — Pre-PR review | Same review prompt, run locally before pushing | [`.claude/commands/review.md`](.claude/commands/review.md) |
| 4a — CI (deterministic) | Tests, types, lint — required to merge | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |
| 4b — CI (AI-assisted) | Same review prompt, run automatically on every PR, advisory only | [`.github/workflows/ai-review.yml`](.github/workflows/ai-review.yml) |

`npm run verify` is the only stack-specific piece in this whole pipeline.
Everything else — a `CLAUDE.md` file, a pre-commit hook, a slash command, a
workflow that calls out to an LLM — ports to any language. Swap the one
command and the pattern holds for a Python or Go repo just as well.

**AI review is advisory by design.** It never fails the required check and
never blocks the merge button — only `npm run verify` and human approval do
that. The point is a second set of eyes with full context of the diff and
the codebase's written conventions, not a gate that can be wrong and stop
work.

## Mitigating AI coding risk — what this repo actually found

This pipeline caught real things, not staged ones:

- **An actual open redirect.** A branch that commented out URL validation
  and cast an unvalidated `unknown` to `string` to sneak past the type
  checker was flagged, correctly and specifically, by both `/review`
  (Gate 3, run locally) and the CI-based review (Gate 4b) — merge blocked
  by branch protection pending approval either way.
- **A real gap in the AI-review workflow itself.** While hardening
  `ai-review.yml` against a PR rewriting its own review instructions,
  `/review` — pointed at its own infrastructure — found the fix was
  incomplete (the pin covered `review.md` but not
  `CLAUDE.md`/`STANDARDS.md`, both loaded via `@import`) and flagged a
  second issue: a PR could add `.claude/settings.json` and get arbitrary
  code execution inside a job holding the API key. Both were real, both got
  fixed.
- **A known limitation, documented rather than hidden.** For
  `pull_request`-triggered workflows, GitHub runs the workflow YAML exactly
  as committed on the PR branch — not `main`'s version. A same-repo
  contributor (not a fork) can edit `ai-review.yml` directly and bypass
  every file-level protection built into it. This repo has one
  contributor, so the risk is accepted and noted in a comment in
  [`ai-review.yml`](.github/workflows/ai-review.yml). A multi-contributor
  repo would need a GitHub Environment gated by required reviewers, or a
  `workflow_run` split, around the job that holds the secret.

The pattern worth taking away: AI review is one more layer, not a
substitute for the others, and the tooling that reviews your code is
itself code that needs the same scrutiny — including, recursively, from
itself.
