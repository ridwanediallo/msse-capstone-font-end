import { create } from 'zustand'

const useQueryStore = create((set) => ({
  question: '',
  summary: null,
  sql: null,
  rows: [],
  rowCount: 0,
  executionTime: null,
  loading: false,
  error: null,

  setQuestion: (question) => set({ question }),

  submitQuery: async (question) => {
    set({
      loading: true,
      error: null,
      summary: null,
      sql: null,
      rows: [],
      rowCount: 0,
      executionTime: null,
    })
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
        summary: data.summary,
        sql: data.sql,
        rows: data.rows,
        rowCount: data.row_count,
        executionTime: data.execution_time,
        loading: false,
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  reset: () =>
    set({
      question: '',
      summary: null,
      sql: null,
      rows: [],
      rowCount: 0,
      executionTime: null,
      error: null,
    }),
}))

export default useQueryStore
