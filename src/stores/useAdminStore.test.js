import { beforeEach, describe, expect, it } from 'vitest'
import useAdminStore from './useAdminStore'

const resetStore = () => {
  useAdminStore.setState({
    grantableUsers: [],
    grantableUsersLoading: false,
    grantableUsersError: null,
    grants: [],
    grantsLoading: false,
    grantsError: null,
  })
}

describe('useAdminStore — datasource grants', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('fetchGrantableUsers', () => {
    it('loads regular users only', async () => {
      await useAdminStore.getState().fetchGrantableUsers()
      const state = useAdminStore.getState()
      expect(state.grantableUsers).toHaveLength(2)
      expect(state.grantableUsers.every((m) => m.role === 'user')).toBe(true)
      expect(state.grantableUsers[0].email).toBe('user@queryable.local')
    })
  })

  describe('fetchGrants', () => {
    it('loads grants for a datasource', async () => {
      await useAdminStore.getState().fetchGrants('ds-1')
      const state = useAdminStore.getState()
      expect(state.grants).toHaveLength(1)
      expect(state.grants[0].user_id).toBe('u-user')
      expect(state.loading ?? false).toBe(false)
    })

    it('records the error when the request fails', async () => {
      // Point at a datasource the mock doesn't know; handler still returns
      // 200, so simulate failure by hitting a bogus path via direct override.
      const { http, HttpResponse } = await import('msw')
      const { server } = await import('../test/mocks/server')
      server.use(
        http.get('/api/v1/admin/datasources/:id/grants', () =>
          HttpResponse.json({ error: 'nope' }, { status: 500 }),
        ),
      )
      await useAdminStore.getState().fetchGrants('ds-x')
      expect(useAdminStore.getState().grantsError).toBe('nope')
    })
  })

  describe('grantDatasource', () => {
    it('posts the grant and refetches', async () => {
      const result = await useAdminStore.getState().grantDatasource('ds-1', 'u-user-2')
      expect(result.ok).toBe(true)
      expect(result.data.user_id).toBe('u-user-2')
      // fetchGrants ran again as part of the action
      expect(useAdminStore.getState().grants.length).toBeGreaterThan(0)
    })

    it('surfaces backend errors (e.g. duplicate grant)', async () => {
      const { http, HttpResponse } = await import('msw')
      const { server } = await import('../test/mocks/server')
      server.use(
        http.post('/api/v1/admin/datasources/:id/grants', () =>
          HttpResponse.json(
            { error: 'Grant already exists', code: 'grant_exists' },
            { status: 409 },
          ),
        ),
      )
      const result = await useAdminStore.getState().grantDatasource('ds-1', 'u-user')
      expect(result.ok).toBe(false)
      expect(result.error).toBe('Grant already exists')
    })
  })

  describe('revokeGrant', () => {
    it('deletes the grant and refetches', async () => {
      await useAdminStore.getState().fetchGrants('ds-1')
      const result = await useAdminStore.getState().revokeGrant('grant-1', 'ds-1')
      expect(result.ok).toBe(true)
    })
  })
})
