import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'
import useQueryStore from './useQueryStore'

const resetStore = () => {
  useQueryStore.setState({
    loading: false,
    error: null,
    conversationId: null,
    dataSourceId: null,
    turns: [],
    conversations: [],
    conversationsLoading: false,
  })
}

describe('useQueryStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('submitQuery', () => {
    it('creates a turn and sets conversation id', async () => {
      await useQueryStore.getState().submitQuery('How many customers?')

      const state = useQueryStore.getState()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.conversationId).toBe('conv-1')
      expect(state.turns).toHaveLength(1)
      expect(state.turns[0]).toMatchObject({
        question: 'How many customers?',
        rowCount: 2,
        sql: expect.stringContaining('SELECT'),
      })
    })

    it('appends to existing turns on follow-up', async () => {
      await useQueryStore.getState().submitQuery('first')
      await useQueryStore.getState().submitQuery('second')

      const state = useQueryStore.getState()
      expect(state.turns).toHaveLength(2)
      expect(state.turns[0].question).toBe('first')
      expect(state.turns[1].question).toBe('second')
    })

    it('sends data_source_id when no conversation exists', async () => {
      let capturedBody = null
      server.use(
        http.post('/api/v1/query', async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            summary: 'ok',
            chart_spec: null,
            kpis: null,
            sql: 'SELECT 1',
            rows: [],
            row_count: 0,
            execution_time: 0.1,
            no_query: false,
            conversation_id: 'conv-1',
            turn_id: 't1',
          })
        }),
      )
      useQueryStore.setState({ dataSourceId: 'ds-2' })
      await useQueryStore.getState().submitQuery('question')

      expect(capturedBody).toMatchObject({
        question: 'question',
        conversation_id: null,
        data_source_id: 'ds-2',
      })
    })

    it('does not send data_source_id for follow-ups in a conversation', async () => {
      let capturedBody = null
      server.use(
        http.post('/api/v1/query', async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            summary: 'ok',
            chart_spec: null,
            kpis: null,
            sql: 'SELECT 1',
            rows: [],
            row_count: 0,
            execution_time: 0.1,
            no_query: false,
            conversation_id: 'conv-1',
            turn_id: 't1',
          })
        }),
      )
      useQueryStore.setState({ conversationId: 'conv-1' })
      await useQueryStore.getState().submitQuery('follow-up')

      expect(capturedBody).toMatchObject({
        question: 'follow-up',
        conversation_id: 'conv-1',
      })
      expect('data_source_id' in capturedBody).toBe(false)
    })

    it('sets error on failure', async () => {
      server.use(
        http.post('/api/v1/query', () =>
          HttpResponse.json({ error: 'LLM exploded' }, { status: 500 }),
        ),
      )
      await useQueryStore.getState().submitQuery('boom')

      const state = useQueryStore.getState()
      expect(state.error).toBe('LLM exploded')
      expect(state.loading).toBe(false)
    })
  })

  describe('fetchConversations', () => {
    it('loads the conversation list', async () => {
      await useQueryStore.getState().fetchConversations()
      expect(useQueryStore.getState().conversations).toHaveLength(1)
      expect(useQueryStore.getState().conversations[0].title).toBe(
        'How many students are in each major?',
      )
    })
  })

  describe('loadConversation', () => {
    it('maps turns from the server shape', async () => {
      await useQueryStore.getState().loadConversation('conv-1')

      const state = useQueryStore.getState()
      expect(state.conversationId).toBe('conv-1')
      expect(state.turns).toHaveLength(2)
      expect(state.turns[0].question).toBe('How many students are in each major?')
      expect(state.turns[0].rowCount).toBe(5)
      expect(state.turns[1].questionResolved).toBe(
        'What is the department with the most students?',
      )
    })
  })

  describe('deleteConversation', () => {
    it('removes conversation from the list and clears if active', async () => {
      useQueryStore.setState({ conversationId: 'conv-1', turns: [{ id: 'x' }] })
      await useQueryStore.getState().fetchConversations()

      const result = await useQueryStore.getState().deleteConversation('conv-1')

      expect(result.ok).toBe(true)
      const state = useQueryStore.getState()
      expect(state.conversations).toHaveLength(0)
      expect(state.conversationId).toBeNull()
      expect(state.turns).toHaveLength(0)
    })
  })

  describe('newConversation', () => {
    it('resets conversation state', () => {
      useQueryStore.setState({ conversationId: 'conv-1', turns: [{ id: 'x' }] })
      useQueryStore.getState().newConversation()
      expect(useQueryStore.getState().conversationId).toBeNull()
      expect(useQueryStore.getState().turns).toHaveLength(0)
    })
  })
})
