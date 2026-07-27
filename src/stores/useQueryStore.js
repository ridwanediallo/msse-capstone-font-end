import { create } from 'zustand'

const useQueryStore = create((set) => ({
  question: '',
  summary: null,
  chartSpec: null,
  sql: null,
  rows: [],
  rowCount: 0,
  executionTime: null,
  noQuery: false,
  loading: false,
  error: null,

  setQuestion: (question) => set({ question }),

  submitQuery: async (question) => {
    set({
      loading: true,
      error: null,
      summary: null,
      chartSpec: null,
      sql: null,
      rows: [],
      rowCount: 0,
      executionTime: null,
      noQuery: false,
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
        chartSpec: data.chart_spec,
        sql: data.sql,
        rows: data.rows,
        rowCount: data.row_count,
        executionTime: data.execution_time,
        noQuery: data.no_query || false,
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
      chartSpec: null,
      sql: null,
      rows: [],
      rowCount: 0,
      executionTime: null,
      noQuery: false,
      error: null,
    }),
}))

export default useQueryStore
