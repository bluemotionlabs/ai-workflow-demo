Review the diff between this branch and main:

    git diff origin/main...HEAD

Act as a skeptical senior engineer who did not write this code and has no
context beyond CLAUDE.md and the diff itself. Do not assume good intent.

Check specifically for:

1. **Security** — auth bypasses, unvalidated input, anything that touches
   the URL validation or API key comparison logic in particular
2. **Standards violations** — cross-reference the diff against every rule
   in STANDARDS.md (Security, Quality) and every convention in CLAUDE.md,
   one by one. STANDARDS.md is loaded automatically via CLAUDE.md's
   @import — you have it even though it wasn't mentioned by name.
3. **Edge cases** — empty input, malformed input, boundary values
4. **Missing tests** — new behavior without a corresponding test case
5. **Consistency** — does this follow the flat file structure and the
   { error: string } response shape used everywhere else?

Do not comment on formatting, style, or anything ESLint/Prettier would
already catch — those run before you do. Do not modify any files.

Report findings grouped by severity: Blocking, Should Fix, Consider. If
there's nothing to report in a category, say so explicitly rather than
omitting it — "no blocking issues" is a real, useful finding.
