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
