const API_BASE = import.meta.env?.VITE_API_BASE || ''
const API_PREFIX = '/api/v1'

export const apiUrl = (path) => `${API_BASE}${API_PREFIX}${path}`
