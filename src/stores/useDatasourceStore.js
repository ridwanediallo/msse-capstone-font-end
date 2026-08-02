import { create } from 'zustand'
import { apiUrl } from '../api.js'

const useDatasourceStore = create((set, get) => ({
  datasources: [],
  selectedDatasourceId: null,
  currentDatasource: null,
  loading: false,
  error: null,

  fetchDatasources: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(apiUrl('/datasources'))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      set({ datasources: data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  selectDatasource: (id) => set({ selectedDatasourceId: id }),

  fetchDatasource: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(apiUrl(`/datasources/${id}`))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      set({ currentDatasource: data, loading: false })
      return data
    } catch (err) {
      set({ error: err.message, loading: false })
      return null
    }
  },

  testConnection: async (credentials) => {
    try {
      const res = await fetch(apiUrl('/datasources/test-connection'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      const data = await res.json()
      return data
    } catch (err) {
      return { success: false, message: err.message }
    }
  },

  createDatasource: async (payload) => {
    try {
      const res = await fetch(apiUrl('/datasources'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await get().fetchDatasources()
      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  introspectSchema: async (id) => {
    try {
      const res = await fetch(apiUrl(`/datasources/${id}/introspect`), {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  updateSchemaEntry: async (dsId, catalogId, payload) => {
    try {
      const res = await fetch(apiUrl(`/datasources/${dsId}/schema/${catalogId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  deleteDatasource: async (id) => {
    try {
      const res = await fetch(apiUrl(`/datasources/${id}`), {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      await get().fetchDatasources()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },
}))

export default useDatasourceStore
