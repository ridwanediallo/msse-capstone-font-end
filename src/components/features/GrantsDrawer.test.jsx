import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import useAdminStore from '../../stores/useAdminStore'
import GrantsDrawer from './GrantsDrawer'

const ds = {
  id: 'ds-1',
  name: 'school',
  db_type: 'postgresql',
}

const renderDrawer = (props = {}) =>
  render(<GrantsDrawer datasource={ds} open onClose={() => {}} {...props} />)

describe('GrantsDrawer', () => {
  beforeEach(() => {
    useAdminStore.setState({
      grantableUsers: [],
      grantableUsersLoading: false,
      grantableUsersError: null,
      grants: [],
      grantsLoading: false,
      grantsError: null,
    })
  })

  it('lists granted users with their email', async () => {
    renderDrawer()
    expect(await screen.findByText('user@queryable.local')).toBeInTheDocument()
    expect(screen.getByTestId('grants-list')).toBeInTheDocument()
  })

  it('shows the empty state when no grants exist', async () => {
    server.use(
      http.get('/api/v1/admin/datasources/:id/grants', () =>
        HttpResponse.json([]),
      ),
    )
    renderDrawer()
    expect(
      await screen.findByText(/No user has been granted access yet/i),
    ).toBeInTheDocument()
  })

  it('falls back to a short id when the user is unknown', async () => {
    server.use(
      http.get('/api/v1/admin/datasources/:id/grants', () =>
        HttpResponse.json([
          {
            id: 'grant-9',
            user_id: 'u-gone',
            data_source_id: 'ds-1',
            granted_by: null,
            created_at: '2026-08-01T00:00:00Z',
          },
        ]),
      ),
    )
    renderDrawer()
    expect(await screen.findByText('User')).toBeInTheDocument()
    expect(screen.getByText('u-gone')).toBeInTheDocument()
  })

  it('disables Grant until a user is selected', async () => {
    renderDrawer()
    await screen.findByText('user@queryable.local')
    const grantButton = screen.getByRole('button', { name: /grant/i })
    expect(grantButton).toBeDisabled()
  })

  it('revokes access via the confirm popover', async () => {
    const user = userEvent.setup()
    let deleted = false
    server.use(
      http.delete('*/api/v1/admin/grants/:id', () => {
        deleted = true
        return HttpResponse.json({ ok: true })
      }),
      http.get('*/api/v1/admin/datasources/:id/grants', () =>
        HttpResponse.json(deleted ? [] : [
          {
            id: 'grant-1',
            user_id: 'u-user',
            data_source_id: 'ds-1',
            granted_by: 'u-admin',
            created_at: '2026-08-01T00:00:00Z',
          },
        ]),
      ),
    )
    renderDrawer()

    const revokeButton = await screen.findByRole('button', {
      name: /revoke access for user@queryable\.local/i,
    })
    await user.click(revokeButton)
    // Popconfirm appears; confirm it.
    await user.click(await screen.findByRole('button', { name: /^revoke$/i }))

    expect(deleted).toBe(true)
    expect(
      await screen.findByText(/No user has been granted access yet/i),
    ).toBeInTheDocument()
  })
})
