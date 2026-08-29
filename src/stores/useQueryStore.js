import { create } from 'zustand'
import { apiFetch, readNdjsonStream } from '../api.js'
import useDatasourceStore from './useDatasourceStore'
import useAuthStore from './useAuthStore'

const useQueryStore = create((set, get) => ({
  loading: false,
  error: null,

  // AbortController for the in-flight query — calling abort() cancels the
  // fetch and readNdjsonStream, preventing stale writes to state.
  _queryAbort: null,

  // The question whose submit last failed — Retry must resubmit THIS, not
  // the previous successful turn (a failed submit never creates a turn).
  // Persisted to sessionStorage so page reloads don't lose it.
  lastFailedQuestion: (() => {
    try { return sessionStorage.getItem('lastFailedQuestion') || null } catch { return null }
  })(),

  // Number of pipeline steps revealed so far during an in-flight query
  // (0..5). The backend streams a progress line as each step actually
  // completes: schema analyzed -> query written -> validated -> data
  // retrieved -> report composed.
  stepsDone: 0,

  conversationId: null,
  turns: [],

  // New-session starter suggestions for the selected datasource
  suggestions: [],
  suggestionsLoading: false,

  // Sidebar / history list
  conversations: [],
  conversationsLoading: false,

  submitQuery: async (question) => {
    const { conversationId, _queryAbort } = get()
    const { selectedDatasourceId } = useDatasourceStore.getState()

    // Cancel any in-flight query before starting a new one.
    if (_queryAbort) _queryAbort.abort()
    const controller = new AbortController()
    set({ loading: true, error: null, stepsDone: 0, _queryAbort: controller })

    try {
      const body = { question, conversation_id: conversationId }
      if (!conversationId && selectedDatasourceId) {
        body.data_source_id = selectedDatasourceId
      }
      const res = await apiFetch('/query', {
        method: 'POST',
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.code === 'query_quota_exceeded') {
          const d = data.details || {}
          const limit = d.limit ?? 5
          useAuthStore.getState().setGuestQuota({
            limit,
            used: limit,
            remaining: d.remaining ?? 0,
          })
        }
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/x-ndjson')
        ? await readNdjsonStream(res, (obj) => {
            if (obj.type === 'progress' && Number.isFinite(Number(obj.step))) {
              set((s) => ({ ...s, stepsDone: Math.max(s.stepsDone, Number(obj.step) + 1) }))
            }
          })
        : await res.json()

      if (data.error) {
        if (data.code === 'query_quota_exceeded') {
          const d = data.details || {}
          const limit = d.limit ?? 5
          useAuthStore.getState().setGuestQuota({
            limit,
            used: limit,
            remaining: d.remaining ?? 0,
          })
        }
        throw new Error(data.error || 'Query failed')
      }

      if (data.guest_quota) {
        useAuthStore.getState().setGuestQuota(data.guest_quota)
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
        stepsDone: 0,
        lastFailedQuestion: null,
        _queryAbort: null,
      }))
      try { sessionStorage.removeItem('lastFailedQuestion') } catch {}

      // Refresh the recents list so a newly created session shows up
      if (isNewConversation) get().fetchConversations()
    } catch (err) {
      // AbortError means the user started a new query — don't treat as failure.
      if (err.name === 'AbortError') return
      try { sessionStorage.setItem('lastFailedQuestion', question) } catch {}
      set({ error: err.message, loading: false, stepsDone: 0, lastFailedQuestion: question, _queryAbort: null })
    }
  },

  fetchConversations: async ({ signal } = {}) => {
    const { selectedDatasourceId } = useDatasourceStore.getState()
    if (!selectedDatasourceId) {
      set({ conversations: [], conversationsLoading: false })
      return
    }
    set({ conversationsLoading: true })
    try {
      const res = await apiFetch(
        `/conversations?data_source_id=${encodeURIComponent(selectedDatasourceId)}&per_page=100`,
        { signal }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      const items = Array.isArray(data) ? data : data.items ?? []
      set({ conversations: items, conversationsLoading: false })
    } catch {
      set({ conversationsLoading: false })
    }
  },

  loadConversation: async (id, { signal } = {}) => {
    set({ loading: true, error: null })
    try {
      const res = await apiFetch(`/conversations/${id}`, { signal })
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
      set({
        error: err.message,
        loading: false,
        conversationId: null,
        turns: [],
      })
    }
  },

  deleteConversation: async (id) => {
    try {
      const res = await apiFetch(`/conversations/${id}`, { method: 'DELETE' })
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
      stepsDone: 0,
    }),

  reset: () => {
    const { _queryAbort } = get()
    if (_queryAbort) _queryAbort.abort()
    try { sessionStorage.removeItem('lastFailedQuestion') } catch {}
    set({
      loading: false,
      error: null,
      lastFailedQuestion: null,
      conversationId: null,
      turns: [],
      suggestions: [],
      suggestionsLoading: false,
      conversations: [],
      conversationsLoading: false,
      stepsDone: 0,
      _queryAbort: null,
    })
  },

  fetchSuggestions: async (dsId) => {
    if (!dsId) {
      set({ suggestions: [], suggestionsLoading: false })
      return
    }
    set({ suggestionsLoading: true })
    try {
      const res = await apiFetch(`/datasources/${dsId}/suggestions`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      set({ suggestions: data.suggestions || [], suggestionsLoading: false })
    } catch {
      set({ suggestions: [], suggestionsLoading: false })
    }
  },
}))

export default useQueryStore
