import { describe, expect, test } from 'vitest'
import { isAuthorized, timingSafeEqual } from '../src/auth'

describe('timingSafeEqual', () => {
  test('matches identical strings only', () => {
    expect(timingSafeEqual('test-key', 'test-key')).toBe(true)
    expect(timingSafeEqual('test-key', 'test-keY')).toBe(false)
    expect(timingSafeEqual('test-key', 'test-key-longer')).toBe(false)
    expect(timingSafeEqual('', '')).toBe(true)
  })
})

describe('isAuthorized', () => {
  test('accepts the configured key', () => {
    expect(isAuthorized('test-key', 'test-key')).toBe(true)
  })

  test('rejects a wrong, missing, or unconfigured key', () => {
    expect(isAuthorized('wrong-key', 'test-key')).toBe(false)
    expect(isAuthorized(undefined, 'test-key')).toBe(false)
    expect(isAuthorized('test-key', undefined)).toBe(false)
    expect(isAuthorized('', '')).toBe(false)
  })
})
