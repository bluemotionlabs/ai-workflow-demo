/**
 * Business logic + store. The store is an in-memory Map — state does not
 * survive a restart, and that is fine for this demo.
 */

export interface Link {
  code: string
  url: string
  hits: number
}

const links = new Map<string, Link>()

const CODE_LENGTH = 7
const CODE_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Only http and https targets are allowed. Anything else — javascript:,
 * data:, file:, a relative path, a malformed string — is rejected. This is
 * the allowlist that keeps us from minting open redirects.
 */
export function isValidTargetUrl(candidate: unknown): candidate is string {
  if (typeof candidate !== 'string') return false

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return false
  }

  return parsed.protocol === 'https:' || parsed.protocol === 'http:'
}

/** A 7-character alphanumeric code, unique within the store. */
function generateCode(): string {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH))
    let code = ''
    for (const byte of bytes) {
      code += CODE_ALPHABET[byte % CODE_ALPHABET.length]
    }
    if (!links.has(code)) return code
  }
}

/**
 * Stores a validated target URL and returns its link. Callers must run the
 * URL through `isValidTargetUrl` first.
 */
export function createLink(url: string): Link {
  const link: Link = { code: generateCode(), url, hits: 0 }
  links.set(link.code, link)
  return link
}

export function getLink(code: string): Link | undefined {
  return links.get(code)
}

/**
 * Looks up a link and counts the visit. Returns undefined for unknown codes.
 */
export function recordHit(code: string): Link | undefined {
  const link = links.get(code)
  if (!link) return undefined
  link.hits += 1
  return link
}

/** Test helper — drops every stored link. */
export function resetStore(): void {
  links.clear()
}
