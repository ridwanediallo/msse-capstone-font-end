import { create } from 'zustand'

const useQueryStore = create((set) => ({
  question: '',
  sql: null,
  rows: [],
  rowCount: 0,
  loading: false,
  error: null,

  setQuestion: (question) => set({ question }),

  submitQuery: async (question) => {
    set({ loading: true, error: null, sql: null, rows: [], rowCount: 0 })
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      set({
        sql: data.sql,
        rows: data.rows,
        rowCount: data.row_count,
        loading: false,
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  reset: () => set({ question: '', sql: null, rows: [], rowCount: 0, error: null }),
}))

export default useQueryStore
