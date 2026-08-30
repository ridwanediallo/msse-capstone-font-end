const API_BASE = import.meta.env?.VITE_API_BASE || ''
const API_PREFIX = '/api/v1'
const CSRF_COOKIE = 'csrf_token'

export const apiUrl = (path) => `${API_BASE}${API_PREFIX}${path}`

// ── 401 session-expiry callback ────────────────────────────────────────────
// Registered by the auth store after the initial fetchMe resolves. Subsequent
// 401s trigger a redirect to /login so the user is never stuck on a stale page.
let onUnauthorized = null
export const setOnUnauthorized = (cb) => { onUnauthorized = cb }

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

let csrfFetch = null

// Lazily fetch a CSRF token before the first mutating request. The token is
// bound to the server session and echoed back in the X-CSRFToken header
// (see docs/adr/0001 in the backend repo).
//
// `force` overwrites a cached cookie: the cookie alone is not proof the token
// still matches the server session (logout, session expiry or re-login
// invalidate it server-side), so callers must be able to recover from a 403.
export const ensureCsrfToken = async (force = false) => {
  if (!force && readCookie(CSRF_COOKIE)) return
  if (!force && csrfFetch) {
    await csrfFetch
    return
  }
  csrfFetch = fetch(apiUrl('/auth/csrf'), { credentials: 'include' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data?.csrf_token) {
        const secure = window.location.protocol === 'https:' ? '; Secure' : ''
        document.cookie = `csrf_token=${encodeURIComponent(data.csrf_token)}; path=/; samesite=lax${secure}`
      }
    })
    .finally(() => {
      csrfFetch = null
    })
  await csrfFetch
}

const isCsrfRejection = async (res) => {
  if (res.status !== 403) return false
  try {
    const data = await res.clone().json()
    return data?.code === 'csrf_invalid'
  } catch {
    return false
  }
}

export const apiFetch = async (path, options = {}) => {
  const withToken = async () => {
    const headers = options.headers ? { ...options.headers } : {}
    if (options.body) {
      headers['Content-Type'] = 'application/json'
    }
    const method = (options.method || 'GET').toUpperCase()
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !headers['X-CSRFToken']) {
      await ensureCsrfToken()
      const token = readCookie(CSRF_COOKIE)
      if (token) headers['X-CSRFToken'] = token
    }
    return headers
  }

  const headers = await withToken()
  let res = await fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers,
  })

  // A 403 csrf_invalid means the cached token no longer matches the server
  // session. Force-refresh once and retry; if it fails again, surface it —
  // never loop.
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase()) &&
    (await isCsrfRejection(res))
  ) {
    await ensureCsrfToken(true)
    const retryHeaders = { ...headers }
    const fresh = readCookie(CSRF_COOKIE)
    if (fresh) retryHeaders['X-CSRFToken'] = fresh
    res = await fetch(apiUrl(path), {
      ...options,
      credentials: 'include',
      headers: retryHeaders,
    })
  }

  // Global 401 handler: the session expired or the user was logged out.
  // The callback is registered by the auth store AFTER the initial fetchMe,
  // so the guest-401 on first load does not trigger a redirect.
  if (res.status === 401 && onUnauthorized) {
    onUnauthorized()
  }

  return res
}

/**
 * Reads a newline-delimited JSON (NDJSON) response body, invoking onLine for
 * each parsed line as it arrives and resolving to the final payload line
 * (the last line) once the stream completes.
 */
export const readNdjsonStream = async (res, onLine) => {
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let lastLine = null

  const handleLine = (line) => {
    const text = line.trim()
    // Skip blank lines and SSE-style comment lines (":keepalive"), which the
    // backend emits as streaming heartbeats to keep proxies from idle-timing
    // out long queries. They are not JSON and must not reach JSON.parse.
    if (!text || text.startsWith(':')) return
    const obj = JSON.parse(text)
    onLine?.(obj)
    lastLine = obj
  }

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let idx
      while ((idx = buffer.indexOf('\n')) !== -1) {
        handleLine(buffer.slice(0, idx))
        buffer = buffer.slice(idx + 1)
      }
    }
    if (buffer.trim()) handleLine(buffer)
  } finally {
    reader.releaseLock()
  }
  return lastLine
}
