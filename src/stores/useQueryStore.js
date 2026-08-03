import { create } from 'zustand'
import { apiUrl } from '../api.js'
import useDatasourceStore from './useDatasourceStore'

const useQueryStore = create((set, get) => ({
  loading: false,
  error: null,

  conversationId: null,
  turns: [],

  // New-session starter suggestions for the selected datasource
  suggestions: [],
  suggestionsLoading: false,

  // Sidebar / history list
  conversations: [],
  conversationsLoading: false,

  submitQuery: async (question) => {
    const { conversationId } = get()
    const { selectedDatasourceId } = useDatasourceStore.getState()

    set({ loading: true, error: null })
    try {
      const body = { question, conversation_id: conversationId }
      if (!conversationId && selectedDatasourceId) {
        body.data_source_id = selectedDatasourceId
      }
      const res = await fetch(apiUrl('/query'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const newTurn = {
        id: data.turn_id,
        question,
        summary: data.summary,
        sql: data.sql,
        rows: data.rows,
        rowCount: data.row_count,
        chartSpec: data.chart_spec,
        kpis: data.kpis || null,
        executionTime: data.execution_time,
        noQuery: data.no_query || false,
        questionResolved: data.question_resolved || null,
      }

      const isNewConversation = !conversationId

      set((state) => ({
        conversationId: data.conversation_id,
        turns: [...state.turns, newTurn],
        loading: false,
      }))

      // Refresh the recents list so a newly created session shows up
      if (isNewConversation) get().fetchConversations()
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  fetchConversations: async () => {
    const { selectedDatasourceId } = useDatasourceStore.getState()
    if (!selectedDatasourceId) {
      set({ conversations: [], conversationsLoading: false })
      return
    }
    set({ conversationsLoading: true })
    try {
      const res = await fetch(
        apiUrl(`/conversations?data_source_id=${encodeURIComponent(selectedDatasourceId)}`)
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      set({ conversations: data, conversationsLoading: false })
    } catch {
      set({ conversationsLoading: false })
    }
  },

  loadConversation: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(apiUrl(`/conversations/${id}`))
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const turns = data.turns.map((t) => ({
        id: t.id,
        question: t.question_raw,
        summary: t.summary,
        sql: t.generated_sql,
        rows: t.result_data || [],
        rowCount: t.result_row_count || 0,
        chartSpec: t.chart_spec,
        kpis: t.kpis || null,
        executionTime: t.execution_ms ? t.execution_ms / 1000 : null,
        noQuery: t.no_query,
        questionResolved: t.question_resolved || null,
      }))

      if (data.data_source_id) {
        useDatasourceStore.getState().selectDatasource(data.data_source_id)
      }

      set({
        conversationId: data.id,
        turns,
        loading: false,
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  deleteConversation: async (id) => {
    try {
      const res = await fetch(apiUrl(`/conversations/${id}`), { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        ...(state.conversationId === id
          ? { conversationId: null, turns: [] }
          : {}),
      }))
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  },

  newConversation: () =>
    set({
      conversationId: null,
      turns: [],
      suggestions: [],
      error: null,
    }),

  fetchSuggestions: async (dsId) => {
    if (!dsId) {
      set({ suggestions: [], suggestionsLoading: false })
      return
    }
    set({ suggestionsLoading: true })
    try {
      const res = await fetch(apiUrl(`/datasources/${dsId}/suggestions`))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      set({ suggestions: data.suggestions || [], suggestionsLoading: false })
    } catch {
      set({ suggestions: [], suggestionsLoading: false })
    }
  },
}))

export default useQueryStore
