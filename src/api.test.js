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
})
