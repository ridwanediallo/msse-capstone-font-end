import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'
import useAuthStore from './useAuthStore'

const resetStore = () => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    guestQuota: null,
    loading: true,
    error: null,
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
      const result = await useAuthStore.getState().login('member@queryable.local', 'pw')
      expect(result.ok).toBe(true)
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user.role).toBe('member')
      expect(state.error).toBeNull()
    })

    it('records the error on failure', async () => {
      const result = await useAuthStore.getState().login('member@queryable.local', 'wrong')
      expect(result.ok).toBe(false)
      const state = useAuthStore.getState()
      expect(state.error).toBe('Invalid email or password')
      expect(state.user).toBeNull()
    })

    it('reports a clear error when the server returns a non-JSON empty body', async () => {
      server.use(
        http.post('/api/v1/auth/login', () =>
          new HttpResponse('', { status: 502 }),
        ),
      )
      const result = await useAuthStore.getState().login('member@queryable.local', 'pw')
      expect(result.ok).toBe(false)
      expect(result.error).toBe('HTTP 502')
      expect(useAuthStore.getState().error).toBe('HTTP 502')
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('reports a clear error when the server is unreachable', async () => {
      server.use(
        http.post('/api/v1/auth/login', () =>
          HttpResponse.error(),
        ),
      )
      const result = await useAuthStore.getState().login('member@queryable.local', 'pw')
      expect(result.ok).toBe(false)
      expect(result.error).toBe('Cannot reach the server. Make sure the backend is running.')
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('logout', () => {
    it('clears the user and guest quota', async () => {
      useAuthStore.setState({
        user: memberUser(),
        isAuthenticated: true,
        guestQuota: { limit: 5, used: 1, remaining: 4 },
      })
      await useAuthStore.getState().logout()
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.guestQuota).toBeNull()
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

function memberUser() {
  return {
    id: 'u-member',
    email: 'member@queryable.local',
    name: 'Member',
    role: 'member',
    is_active: true,
    created_at: '2026-07-01T00:00:00Z',
    last_login_at: null,
  }
}
