import { create } from 'zustand'

const useHealthStore = create((set) => ({
  status: null,
  loading: false,
  error: null,

  fetchHealth: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      set({ status: data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },
}))

export default useHealthStore
