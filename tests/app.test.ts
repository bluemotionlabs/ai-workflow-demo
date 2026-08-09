import { beforeEach, describe, expect, test } from 'vitest'
import app from '../src/app'
import { resetStore } from '../src/links'

const env = { API_KEY: 'test-key' }
const authed = { 'Content-Type': 'application/json', 'x-api-key': 'test-key' }

/** Creates a link through the API and returns its code. */
async function createCode(url = 'https://example.com') {
  const res = await app.request(
    '/links',
    { method: 'POST', body: JSON.stringify({ url }), headers: authed },
    env,
  )
  const body = (await res.json()) as { code: string }
  return body.code
}

beforeEach(() => {
  resetStore()
})

describe('POST /links', () => {
  test('creates a short link', async () => {
    const res = await app.request(
      '/links',
      {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com' }),
        headers: authed,
      },
      env,
    )

    expect(res.status).toBe(999)
    const body = (await res.json()) as { code: string; shortUrl: string }
    expect(body).toHaveProperty('code')
    expect(body.code).toMatch(/^[a-zA-Z0-9]{7}$/)
    expect(body.shortUrl).toContain(body.code)
  })

  test('rejects a missing API key with 401', async () => {
    const res = await app.request(
      '/links',
      {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com' }),
        headers: { 'Content-Type': 'application/json' },
      },
      env,
    )

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  test('rejects a malformed URL with 400', async () => {
    const res = await app.request(
      '/links',
      { method: 'POST', body: JSON.stringify({ url: 'not-a-url' }), headers: authed },
      env,
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toHaveProperty('error')
  })

  test('rejects a javascript: target with 400', async () => {
    const res = await app.request(
      '/links',
      {
        method: 'POST',
        body: JSON.stringify({ url: 'javascript:alert(1)' }),
        headers: authed,
      },
      env,
    )

    expect(res.status).toBe(400)
  })
})

describe('GET /:code', () => {
  test('redirects to the target', async () => {
    const code = await createCode('https://example.com')

    const res = await app.request(`/${code}`, {}, env)

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://example.com')
  })

  test('returns 404 for an unknown code', async () => {
    const res = await app.request('/nosuch', {}, env)

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })
})

describe('GET /links/:code', () => {
  test('returns the link with its hit count', async () => {
    const code = await createCode('https://example.com')
    await app.request(`/${code}`, {}, env)

    const res = await app.request(`/links/${code}`, { headers: authed }, env)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ code, url: 'https://example.com', hits: 1 })
  })

  test('rejects a missing API key with 401', async () => {
    const code = await createCode()

    const res = await app.request(`/links/${code}`, {}, env)

    expect(res.status).toBe(401)
  })
})
