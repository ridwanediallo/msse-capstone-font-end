import { create } from 'zustand'
import { apiFetch } from '../api.js'

export const ADMIN_PAGE_SIZE = 20

const useAdminStore = create((set, get) => ({
  users: [],
  usersTotal: 0,
  usersLoading: false,
  usersError: null,
  query: '',
  page: 1,

  auditLogs: [],
  auditTotal: 0,
  auditLoading: false,
  auditError: null,

  reset: () =>
    set({
      users: [],
      usersTotal: 0,
      usersLoading: false,
      usersError: null,
      query: '',
      page: 1,
      auditLogs: [],
      auditTotal: 0,
      auditLoading: false,
      auditError: null,
    }),

  fetchUsers: async (overrides = {}) => {
    const { query, page } = { query: get().query, page: get().page, ...overrides }
    set({ usersLoading: true, usersError: null, query, page })
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      params.set('limit', String(ADMIN_PAGE_SIZE))
      params.set('offset', String((page - 1) * ADMIN_PAGE_SIZE))
      const res = await apiFetch(`/admin/users?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      set({ users: data.items, usersTotal: data.total, usersLoading: false })
    } catch (err) {
      set({ usersError: err.message, usersLoading: false })
    }
  },

  inviteUser: async (payload) => {
    try {
      const res = await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await get().fetchUsers()
      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  regenerateInvite: async (userId) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/invite`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  cancelInvite: async (userId) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/invite`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await get().fetchUsers()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  updateUser: async (userId, payload) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        return { ok: false, error: data.error || `HTTP ${res.status}`, code: data.code }
      }
      await get().fetchUsers()
      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  revokeSessions: async (userId) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/revoke-sessions`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await get().fetchUsers()
      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  fetchAuditLogs: async (filters = {}) => {
    set({ auditLoading: true, auditError: null })
    try {
      const params = new URLSearchParams()
      if (filters.action) params.set('action', filters.action)
      if (filters.resource_type) params.set('resource_type', filters.resource_type)
      if (filters.user_id) params.set('user_id', filters.user_id)
      params.set('limit', String(filters.limit ?? ADMIN_PAGE_SIZE))
      params.set('offset', String(filters.offset ?? 0))
      const res = await apiFetch(`/admin/audit-logs?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      set({ auditLogs: data.items, auditTotal: data.total, auditLoading: false })
      return data
    } catch (err) {
      set({ auditError: err.message, auditLoading: false })
      return null
    }
  },
}))

export default useAdminStore
