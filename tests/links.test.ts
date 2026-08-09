import { beforeEach, describe, expect, test } from 'vitest'
import { createLink, getLink, isValidTargetUrl, recordHit, resetStore } from '../src/links'

beforeEach(() => {
  resetStore()
})

describe('isValidTargetUrl', () => {
  test('accepts http and https', () => {
    expect(isValidTargetUrl('https://example.com')).toBe(true)
    expect(isValidTargetUrl('http://example.com/path?q=1')).toBe(true)
  })

  test('rejects other schemes and junk', () => {
    expect(isValidTargetUrl('javascript:alert(1)')).toBe(false)
    expect(isValidTargetUrl('data:text/html,<script>')).toBe(false)
    expect(isValidTargetUrl('file:///etc/passwd')).toBe(false)
    expect(isValidTargetUrl('/relative/path')).toBe(false)
    expect(isValidTargetUrl('not-a-url')).toBe(false)
    expect(isValidTargetUrl(undefined)).toBe(false)
    expect(isValidTargetUrl(42)).toBe(false)
  })
})

describe('store', () => {
  test('createLink issues a unique 7-character code starting at zero hits', () => {
    const first = createLink('https://example.com')
    const second = createLink('https://example.com')

    expect(first.code).toMatch(/^[a-zA-Z0-9]{7}$/)
    expect(first.hits).toBe(0)
    expect(second.code).not.toBe(first.code)
    expect(getLink(first.code)).toEqual(first)
  })

  test('recordHit increments the count, and returns undefined for unknown codes', () => {
    const link = createLink('https://example.com')

    expect(recordHit(link.code)?.hits).toBe(1)
    expect(recordHit(link.code)?.hits).toBe(2)
    expect(recordHit('nosuch')).toBeUndefined()
  })
})
