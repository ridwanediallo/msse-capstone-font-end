const API_BASE = import.meta.env?.VITE_API_BASE || ''
const API_PREFIX = '/api/v1'
const CSRF_COOKIE = 'csrf_token'

export const apiUrl = (path) => `${API_BASE}${API_PREFIX}${path}`

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

let csrfFetch = null

// Lazily fetch a CSRF token before the first mutating request. The token is
// bound to the server session and echoed back in the X-CSRFToken header
// (see docs/adr/0001 in the backend repo).
export const ensureCsrfToken = async () => {
  if (readCookie(CSRF_COOKIE)) return
  if (!csrfFetch) {
    csrfFetch = fetch(apiUrl('/auth/csrf'), { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.csrf_token) {
          document.cookie = `csrf_token=${encodeURIComponent(data.csrf_token)}; path=/; samesite=lax`
        }
      })
      .finally(() => {
        csrfFetch = null
      })
  }
  await csrfFetch
}

export const apiFetch = async (path, options = {}) => {
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
  return fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers,
  })
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
    if (!text) return
    const obj = JSON.parse(text)
    onLine?.(obj)
    lastLine = obj
  }

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
  return lastLine
}
