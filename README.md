# Case Study: TypeScript AI CI Pipeline

Operationalizing AI code review.

This repo is a small URL shortener wrapped in a four-gate review pipeline. The
same coding standards are enforced when an agent writes code, when a developer
commits, before a PR is opened, and on the PR itself, where two checks run side
by side. Every gate is a plain file committed to the repo. There is no
proprietary tooling and nothing to install beyond npm packages.

The app is 176 lines across three files in `src/`. It is scaffolding for the
pipeline, not the subject. `src/auth.ts` uses a constant-time API key
comparison and `src/links.ts` validates redirect targets against an http/https
allowlist. Those two pieces are the security substance the gates protect.
Broken versions of both were pushed on throwaway branches during development,
never merged, to confirm the gates actually catch regressions.

## The four gates

| Gate | Who runs it | What it does | Outcome |
|---|---|---|---|
| 1. Agent Context | Agent, automatic | Loads the standards into every AI session before code is written | Sets standard |
| 2. Pre-Commit | Developer, automatic | lint-staged (ESLint + Prettier), then typecheck | Blocks commit |
| 3. Pre-PR Review | Developer, manual | `/review` run locally before opening a PR | Advisory only |
| 4a. CI Deterministic | CI bot | `npm run verify` (lint + typecheck + test) on every PR | Blocks merge |
| 4b. CI AI Review | CI bot | Same `/review` prompt, posted as a PR comment | Advisory only |

Gates 1 through 3 run on the developer's machine, at the commit level. Gates 4a
and 4b run on GitHub, at the PR level, and both fire from the same pull request
trigger. Merging requires 4a passing plus reviewer approval.

Gate 3 is the only manual step. Nothing enforces it, which is why 4b exists:
the same review runs automatically whether or not anyone remembered to run it
locally.

## The files

**[`STANDARDS.md`](STANDARDS.md)** holds security and quality rules that apply
to any repo, in any language. Copy it into a new project unchanged.

**[`CLAUDE.md`](CLAUDE.md)** holds project-specific direction: architecture,
file layout, conventions, and where each `STANDARDS.md` rule applies in this
codebase. It was written before any code was scaffolded, so it describes intent
rather than documenting what already exists. Claude Code loads it at the start
of every session in this repo, and its first line, `@./STANDARDS.md`, pulls the
standards in with it. Together these two files are Gate 1.

**[`.claude/commands/review.md`](.claude/commands/review.md)** is a slash
command, invocable as `/review`. It tells the reviewer to diff against `main`
and check the result against `STANDARDS.md` and `CLAUDE.md` rule by rule. One
file, used in two places: a developer runs it locally (Gate 3), and CI feeds
the same text to `claude -p` as a prompt (Gate 4b). Slash commands are a
different mechanism from Claude Code Skills. This uses a command because CI
needs the raw prompt text.

**[`.husky/pre-commit`](.husky/pre-commit)** is Gate 2, two lines. `npx
lint-staged` runs ESLint `--fix` and Prettier against staged files, fixing what
it can and re-staging the result. `npm run typecheck` runs `tsc --noEmit`. Lint
errors that cannot be autofixed, such as `no-floating-promises`, stop the
commit before typecheck runs. A type error stops it too. No AI is involved
here; all three tools are deterministic.

**[`.github/workflows/ci.yml`](.github/workflows/ci.yml)** is Gate 4a. It runs
`npm run verify` on every PR into `main`. Branch protection lists it as a
required check, so a failure disables the merge button rather than just showing
a red X.

**[`.github/workflows/ai-review.yml`](.github/workflows/ai-review.yml)** is
Gate 4b. It installs Claude Code, runs `review.md` against the PR diff, and
posts the result as a PR comment for a human to read. It is not a required
check, so findings never block a merge.

Supporting pieces: [`CODEOWNERS`](.github/CODEOWNERS) for review assignment and
an `ANTHROPIC_API_KEY` repo secret for Gate 4b.

## Why AI review is advisory

An LLM reviewer can be confidently wrong. Wiring it to the merge button means a
bad call stops work, and teams route around checks that stop work for bad
reasons. Gate 4b posts findings and gets out of the way. The required `verify`
check, plus whatever approval count the team sets, is what gates the merge.

The workflow does fail on infrastructure errors, when the review step crashes
or returns nothing, because a normal-looking comment backed by no actual review
is worse than a visible failure. That failure still does not block the merge,
since 4b is not a required check.

Gate 4b has two limitations that are documented rather than fixed. They are
described in a comment at the top of
[`ai-review.yml`](.github/workflows/ai-review.yml), and both are worth reading
before copying this workflow into a repo with more than one contributor.

## What a review can surface

`/review` reports findings grouped as Blocking, Should Fix, and Consider. The
kinds of things it picks up:

- Security regressions in code that compiles and lints clean. Validation
  commented out of a route, an `unknown` cast to `string` to satisfy the type
  checker, a secret compared with `===`.
- Conventions no linter encodes, because they live in `CLAUDE.md` and
  `STANDARDS.md` as prose. The `{ error: string }` response shape, the flat
  `src/` layout, logging the short code instead of the target URL.
- Missing tests on a new endpoint, and existing tests a change quietly broke.
- Edge cases in new logic: empty input, malformed bodies, boundary values.
- Problems in the pipeline itself, since workflow files are code too. Pointing
  `/review` at `ai-review.yml` found a config pin that missed two files and a
  path where a missing prompt would exit clean and post an empty review.
- Documentation that has drifted from configuration, such as a README claiming
  a check blocks the merge when branch protection does not require it.

## Porting this

`npm run verify` is the only stack-specific piece. Swap it for `pytest` plus
`mypy`, or `go test` plus `go vet`, and the rest carries over: a standards
file, a project file that imports it, a review prompt, a pre-commit hook, and
two workflows.

## Commands

- `npm run dev` — local dev server via Wrangler
- `npm run verify` — lint + typecheck + test, the exact command CI runs
- `npm run test` — vitest
- `npm run lint` / `npm run typecheck` — individual checks
