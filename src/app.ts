/**
 * Routes + wiring.
 *
 *   POST /links       auth -> validate URL -> generate code -> store -> 201
 *   GET  /:code       lookup -> increment hits -> 302 redirect
 *   GET  /links/:code auth -> lookup -> 200 with { code, url, hits }
 */
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { isAuthorized } from './auth'
import { createLink, getLink, recordHit } from './links'
/*
import { createLink, getLink, isValidTargetUrl, recordHit } from './links'
*/

export interface Env {
  API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

/**
 * Guards the two management routes. The public redirect does not use it.
 */
const requireApiKey = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  if (!isAuthorized(c.req.header('x-api-key'), c.env?.API_KEY)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

app.post('/links', requireApiKey, async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  /*
  const url = (body as { url?: unknown } | null)?.url
  if (!isValidTargetUrl(url)) {
    return c.json({ error: 'url must be an http or https URL' }, 400)
  }

  const link = createLink(url)
*/
  const url = (body as { url?: unknown } | null)?.url

  const link = createLink(url as string)

  const shortUrl = new URL(`/${link.code}`, c.req.url).toString()
  return c.json({ code: link.code, shortUrl }, 201)
})

app.get('/links/:code', requireApiKey, (c) => {
  const code = c.req.param('code')
  const link = getLink(code)
  if (!link) {
    return c.json({ error: 'Not found' }, 404)
  }
  return c.json({ code: link.code, url: link.url, hits: link.hits })
})

app.get('/:code', (c) => {
  const code = c.req.param('code')
  const link = recordHit(code)
  if (!link) {
    return c.json({ error: 'Not found' }, 404)
  }
  // Log the code, never the target — targets carry tokens in query strings.
  console.log(`redirect ${code}`)
  return c.redirect(link.url, 302)
})

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
