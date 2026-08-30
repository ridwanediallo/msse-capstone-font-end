import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'
import useQueryStore from '../stores/useQueryStore'
import useDatasourceStore from '../stores/useDatasourceStore'
import useAuthStore from '../stores/useAuthStore'
import Sidebar from './Sidebar'

const Layout = () => (
  <>
    <Sidebar />
    <Outlet />
  </>
)

const renderSidebar = (initialEntry = '/') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<div>home page</div>} />
          <Route path="/somewhere" element={<div>other page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('Sidebar', () => {
  beforeEach(() => {
    useQueryStore.getState().reset()
    useDatasourceStore.getState().selectDatasource('ds-1')
  })

  it('fetches and shows recents', async () => {
    renderSidebar()
    expect(
      await screen.findByText('How many students are in each major?'),
    ).toBeInTheDocument()
  })

  it('shows an empty state when there are no sessions', async () => {
    server.use(
      http.get('/api/v1/conversations', () => HttpResponse.json([])),
    )
    renderSidebar()
    expect(await screen.findByText('No sessions yet')).toBeInTheDocument()
  })

  it('navigates home on new session', async () => {
    renderSidebar('/somewhere')
    await userEvent.click(screen.getByRole('button', { name: /new session/i }))
    expect(await screen.findByText('home page')).toBeInTheDocument()
  })

  it('loads a conversation when a recent item is clicked', async () => {
    renderSidebar()
    await userEvent.click(
      await screen.findByRole('button', { name: /how many students/i }),
    )
    await waitFor(() => {
      expect(useQueryStore.getState().conversationId).toBe('conv-1')
    })
  })

  it('reloads scoped recents when the datasource changes', async () => {
    renderSidebar()
    expect(
      await screen.findByText('How many students are in each major?'),
    ).toBeInTheDocument()

    useQueryStore.getState().reset()
    useDatasourceStore.getState().selectDatasource('ds-2')

    expect(
      await screen.findByText('Top products by region'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('How many students are in each major?'),
    ).toBeNull()
  })

  it('opens email, role, and sign out from the footer user', async () => {
    useAuthStore.setState({
      user: { id: 'u-admin', name: 'Ada Lovelace', email: 'ada@queryable.local', role: 'admin' },
      isAuthenticated: true,
      guestQuota: null,
      loading: false,
      error: null,
    })
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /ada lovelace/i }))
    expect(await screen.findByText('ada@queryable.local')).toBeInTheDocument()
    expect(screen.getAllByText('admin')).not.toHaveLength(0)
    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument()
  })

  it('signs out and returns to guest state', async () => {
    useAuthStore.setState({
      user: { id: 'u-admin', name: 'Ada Lovelace', email: 'ada@queryable.local', role: 'admin' },
      isAuthenticated: true,
      guestQuota: null,
      loading: false,
      error: null,
    })
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /ada lovelace/i }))
    await userEvent.click(await screen.findByRole('button', { name: /sign out/i }))
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
    expect(await screen.findByText('Guest')).toBeInTheDocument()
  })

  it('shows a Sign in action for guests in the footer', async () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      guestQuota: null,
      loading: false,
      error: null,
    })
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /guest/i }))
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
})
