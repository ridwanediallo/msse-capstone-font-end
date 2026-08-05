import { create } from 'zustand'
import { apiFetch } from '../api.js'

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  guestQuota: null,
  loading: true,
  error: null,

  fetchMe: async () => {
    try {
      const res = await apiFetch('/auth/me')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      set({
        user: data.user || null,
        isAuthenticated: Boolean(data.is_authenticated),
        guestQuota: data.guest_quota || null,
        loading: false,
        error: null,
      })
    } catch (err) {
      set({
        user: null,
        isAuthenticated: false,
        guestQuota: null,
        loading: false,
        error: err.message,
      })
    }
    return get().user
  },

  login: async (email, password) => {
    set({ error: null })
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      set({
        user: data.user || null,
        isAuthenticated: Boolean(data.user),
        guestQuota: null,
        loading: false,
      })
      return { ok: true }
    } catch (err) {
      set({ error: err.message })
      return { ok: false, error: err.message }
    }
  },

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // server session already gone; clear client state anyway
    }
    set({ user: null, isAuthenticated: false, guestQuota: null })
  },

  setGuestQuota: (quota) => set({ guestQuota: quota }),
}))

export default useAuthStore
