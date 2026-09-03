import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'
import useAuthStore from './useAuthStore'
import useQueryStore from './useQueryStore'
import useDatasourceStore from './useDatasourceStore'

const resetStore = () => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    guestQuota: null,
    loading: true,
    error: null,
  })
  useQueryStore.setState({
    loading: false, error: null, conversationId: null, turns: [],
    conversations: [], conversationsLoading: false,
  })
  useDatasourceStore.setState({
    datasources: [], selectedDatasourceId: null, currentDatasource: null,
    loading: false, error: null,
  })
}

describe('useAuthStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('fetchMe', () => {
    it('loads an authenticated user', async () => {
      const user = await useAuthStore.getState().fetchMe()
      const state = useAuthStore.getState()
      expect(user).toMatchObject({ role: 'admin' })
      expect(state.isAuthenticated).toBe(true)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('marks unauthenticated when the server returns no user', async () => {
      server.use(
        http.get('/api/v1/auth/me', () =>
          HttpResponse.json({ is_authenticated: false, user: null }),
        ),
      )
      await useAuthStore.getState().fetchMe()
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.loading).toBe(false)
    })

    it('clears state on network failure', async () => {
      server.use(
        http.get('/api/v1/auth/me', () => HttpResponse.json({}, { status: 500 })),
      )
      await useAuthStore.getState().fetchMe()
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.loading).toBe(false)
    })
  })

  describe('login', () => {
    it('sets the user on success', async () => {
      const result = await useAuthStore.getState().login('user@queryable.local', 'pw')
      expect(result.ok).toBe(true)
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user.role).toBe('user')
      expect(state.error).toBeNull()
    })

    it('records the error on failure', async () => {
      const result = await useAuthStore.getState().login('user@queryable.local', 'wrong')
      expect(result.ok).toBe(false)
      const state = useAuthStore.getState()
      expect(state.error).toBe('Invalid email or password')
      expect(state.user).toBeNull()
    })

    it('resets query and datasource session state on success', async () => {
      useQueryStore.setState({
        conversationId: 'conv-1',
        turns: [{ id: 'x' }],
        conversations: [{ id: 'conv-1' }],
      })
      useDatasourceStore.setState({
        datasources: [{ id: 'ds-2' }],
        selectedDatasourceId: 'ds-2',
        currentDatasource: { id: 'ds-2' },
      })

      await useAuthStore.getState().login('user@queryable.local', 'pw')

      const q = useQueryStore.getState()
      expect(q.conversationId).toBeNull()
      expect(q.turns).toHaveLength(0)
      expect(q.conversations).toHaveLength(0)
      const ds = useDatasourceStore.getState()
      expect(ds.datasources).toHaveLength(0)
      expect(ds.selectedDatasourceId).toBeNull()
      expect(ds.currentDatasource).toBeNull()
    })

    it('does not reset session state on failure', async () => {
      useQueryStore.setState({ conversationId: 'conv-1', turns: [{ id: 'x' }] })
      useDatasourceStore.setState({ selectedDatasourceId: 'ds-2' })

      const result = await useAuthStore.getState().login('user@queryable.local', 'wrong')
      expect(result.ok).toBe(false)
      expect(useQueryStore.getState().conversationId).toBe('conv-1')
      expect(useDatasourceStore.getState().selectedDatasourceId).toBe('ds-2')
    })
  })

  describe('logout', () => {
    it('clears the user and guest quota', async () => {
      useAuthStore.setState({
        user: regularUser(),
        isAuthenticated: true,
        guestQuota: { limit: 5, used: 1, remaining: 4 },
      })
      await useAuthStore.getState().logout()
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.guestQuota).toBeNull()
    })

    it('resets query and datasource session state on logout', async () => {
      useAuthStore.setState({
        user: regularUser(),
        isAuthenticated: true,
        guestQuota: null,
      })
      useQueryStore.setState({
        conversationId: 'conv-1',
        turns: [{ id: 'x' }],
        conversations: [{ id: 'conv-1' }],
      })
      useDatasourceStore.setState({
        datasources: [{ id: 'ds-2' }],
        selectedDatasourceId: 'ds-2',
      })

      await useAuthStore.getState().logout()

      const q = useQueryStore.getState()
      expect(q.conversationId).toBeNull()
      expect(q.turns).toHaveLength(0)
      expect(q.conversations).toHaveLength(0)
      const ds = useDatasourceStore.getState()
      expect(ds.datasources).toHaveLength(0)
      expect(ds.selectedDatasourceId).toBeNull()
    })
  })

  describe('setGuestQuota', () => {
    it('stores the quota reported by a query', () => {
      useAuthStore.getState().setGuestQuota({ limit: 5, used: 3, remaining: 2 })
      expect(useAuthStore.getState().guestQuota).toEqual({
        limit: 5,
        used: 3,
        remaining: 2,
      })
    })
  })
})

function regularUser() {
  return {
    id: 'u-user',
    email: 'user@queryable.local',
    name: 'User',
    role: 'user',
    is_active: true,
    created_at: '2026-07-01T00:00:00Z',
    last_login_at: null,
  }
}
