const API_BASE = import.meta.env?.VITE_API_BASE || ''
const API_PREFIX = '/api/v1'

export const apiUrl = (path) => `${API_BASE}${API_PREFIX}${path}`

export const apiFetch = (path, options = {}) => {
  const headers = options.headers ? { ...options.headers } : {}
  if (options.body) {
    headers['Content-Type'] = 'application/json'
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
