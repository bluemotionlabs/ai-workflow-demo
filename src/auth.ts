/**
 * API key check. Reads `x-api-key` and compares it against the API_KEY env var.
 */

/**
 * Constant-time string comparison. `===` on a secret leaks its length and
 * prefix through timing, so the loop below always runs over the longer of the
 * two inputs and folds every byte into the result.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)

  let mismatch = aBytes.length === bBytes.length ? 0 : 1
  const length = Math.max(aBytes.length, bBytes.length)
  for (let i = 0; i < length; i++) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }

  return mismatch === 0
}

/**
 * True when the request presented the configured API key.
 */
export function isAuthorized(presentedKey: string | undefined, expectedKey: string | undefined) {
  if (!presentedKey || !expectedKey) return false
  return timingSafeEqual(presentedKey, expectedKey)
}
