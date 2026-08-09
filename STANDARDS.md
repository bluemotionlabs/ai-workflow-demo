# Engineering Standards

Portable across every repo. If you're starting a new project, copy this file
in unmodified and reference it from CLAUDE.md with `@./STANDARDS.md`.

## Security

- **Never leak internal error details to a client.** Return a generic
  message; log the detail server-side. Stack traces and internal messages
  tell an attacker what to try next.
- **Never log secrets, tokens, or values that may contain them** — full
  URLs, request bodies, headers. Log identifiers (an ID, a short code), not
  the sensitive payload itself.
- **Never compare secrets with `===`** or any comparison that can
  short-circuit. Use a constant-time comparison — early exit on the first
  differing byte leaks length and prefix through timing.
- **Validate all external input before it is stored or acted upon.** Prefer
  an allowlist over a denylist: enumerate what's permitted, not what's
  forbidden. A denylist is only as good as the list of bad things you
  thought of.

## Quality

- **Every new endpoint or externally-reachable function needs a test**
  covering at least one success case and at least one failure case. Code
  without a test isn't done, it's "to be followed up."
- **Dependencies get upgraded when they carry a known critical or high
  advisory**, not left pinned because the pin currently works. `npm audit`
  clean is a release requirement, not a nice-to-have.
