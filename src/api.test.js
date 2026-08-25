import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { apiFetch } from './api'
import { server } from './test/mocks/server'

const clearCsrfCookie = () => {
  document.cookie = 'csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

afterEach(clearCsrfCookie)

describe('apiFetch CSRF handling', () => {
  it('attaches X-CSRFToken from the cookie on POST', async () => {
    document.cookie = 'csrf_token=tok-123; path=/'
    let received = null
    server.use(
      http.post('*/api/v1/echo', ({ request }) => {
        received = request.headers.get('X-CSRFToken')
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiFetch('/echo', { method: 'POST', body: JSON.stringify({}) })

    expect(received).toBe('tok-123')
  })

  it('does not attach the header on GET', async () => {
    document.cookie = 'csrf_token=tok-123; path=/'
    let received = 'unset'
    server.use(
      http.get('*/api/v1/echo', ({ request }) => {
        received = request.headers.get('X-CSRFToken')
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiFetch('/echo')

    expect(received).toBeNull()
  })

  it('fetches /auth/csrf first when no token exists, then attaches it', async () => {
    clearCsrfCookie()
    let csrfCalls = 0
    let received = null
    server.use(
      http.get('*/api/v1/auth/csrf', () => {
        csrfCalls += 1
        return HttpResponse.json({ csrf_token: 'fresh-token' })
      }),
      http.post('*/api/v1/echo', ({ request }) => {
        received = request.headers.get('X-CSRFToken')
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiFetch('/echo', { method: 'POST', body: JSON.stringify({}) })

    expect(csrfCalls).toBe(1)
    expect(received).toBe('fresh-token')
  })

  it('reuses one in-flight token fetch for concurrent requests', async () => {
    clearCsrfCookie()
    let csrfCalls = 0
    server.use(
      http.get('*/api/v1/auth/csrf', () => {
        csrfCalls += 1
        return HttpResponse.json({ csrf_token: 'shared-token' })
      }),
      http.post('*/api/v1/echo', () => HttpResponse.json({ ok: true })),
    )

    await Promise.all([
      apiFetch('/echo', { method: 'POST', body: '{}' }),
      apiFetch('/echo', { method: 'POST', body: '{}' }),
    ])

    expect(csrfCalls).toBe(1)
  })

  it('lets an explicit X-CSRFToken header win over the cookie', async () => {
    document.cookie = 'csrf_token=cookie-token; path=/'
    let received = null
    server.use(
      http.post('*/api/v1/echo', ({ request }) => {
        received = request.headers.get('X-CSRFToken')
        return HttpResponse.json({ ok: true })
      }),
    )

    await apiFetch('/echo', {
      method: 'POST',
      body: '{}',
      headers: { 'X-CSRFToken': 'explicit-token' },
    })

    expect(received).toBe('explicit-token')
  })

  it('force-refreshes a stale token on 403 csrf_invalid and retries once', async () => {
    // Stale cookie: exists in the browser but no longer matches the session.
    document.cookie = 'csrf_token=stale-token; path=/'
    const attempts = []
    let csrfCalls = 0
    server.use(
      http.get('*/api/v1/auth/csrf', () => {
        csrfCalls += 1
        return HttpResponse.json({ csrf_token: `fresh-token-${csrfCalls}` })
      }),
      http.post('*/api/v1/echo', ({ request }) => {
        attempts.push(request.headers.get('X-CSRFToken'))
        if (attempts.length === 1) {
          return HttpResponse.json(
            { error: 'CSRF token missing or invalid.', code: 'csrf_invalid' },
            { status: 403 },
          )
        }
        return HttpResponse.json({ ok: true })
      }),
    )

    const res = await apiFetch('/echo', { method: 'POST', body: '{}' })

    expect(res.status).toBe(200)
    expect(attempts).toEqual(['stale-token', 'fresh-token-1'])
    expect(csrfCalls).toBe(1)
    // The refreshed token is persisted for subsequent requests.
    expect(document.cookie).toContain('fresh-token-1')
  })

  it('does not retry when the second attempt also fails CSRF validation', async () => {
    document.cookie = 'csrf_token=stale-token; path=/'
    let attempts = 0
    server.use(
      http.get('*/api/v1/auth/csrf', () =>
        HttpResponse.json({ csrf_token: 'fresh-token' }),
      ),
      http.post('*/api/v1/echo', () => {
        attempts += 1
        return HttpResponse.json(
          { error: 'CSRF token missing or invalid.', code: 'csrf_invalid' },
          { status: 403 },
        )
      }),
    )

    const res = await apiFetch('/echo', { method: 'POST', body: '{}' })

    expect(res.status).toBe(403)
    expect(attempts).toBe(2)
  })

  it('does not retry non-CSRF 403 responses', async () => {
    document.cookie = 'csrf_token=tok-123; path=/'
    let attempts = 0
    server.use(
      http.post('*/api/v1/echo', () => {
        attempts += 1
        return HttpResponse.json(
          { error: 'forbidden otherwise', code: 'other_reason' },
          { status: 403 },
        )
      }),
    )

    const res = await apiFetch('/echo', { method: 'POST', body: '{}' })

    expect(res.status).toBe(403)
    expect(attempts).toBe(1)
  })
})
