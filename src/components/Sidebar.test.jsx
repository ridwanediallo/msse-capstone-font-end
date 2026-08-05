import { describe, expect, it, beforeEach, vi } from 'vitest'
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
          <Route path="/login" element={<div>login page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('Sidebar', () => {
  beforeEach(() => {
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

    useDatasourceStore.getState().selectDatasource('ds-2')

    expect(
      await screen.findByText('Top products by region'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('How many students are in each major?'),
    ).toBeNull()
  })

  it('shows the account menu with identity and signs out', async () => {
    const logoutSpy = vi.fn(async () => {})
    useAuthStore.setState({
      user: {
        id: 'u-admin',
        email: 'admin@queryable.local',
        name: 'Admin',
        role: 'admin',
      },
      isAuthenticated: true,
      guestQuota: null,
    })
    useAuthStore.setState({ logout: logoutSpy })
    renderSidebar('/somewhere')

    await userEvent.click(await screen.findByRole('button', { name: /admin/i }))
    expect(await screen.findByText('Sign out')).toBeInTheDocument()
    expect(screen.getByText('admin@queryable.local')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Sign out'))
    expect(logoutSpy).toHaveBeenCalled()
    expect(await screen.findByText('home page')).toBeInTheDocument()
  })

  it('shows the account menu and signs a guest in from it', async () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      guestQuota: null,
    })
    renderSidebar()

    await userEvent.click(await screen.findByRole('button', { name: /guest/i }))
    expect(await screen.findByText('Sign in')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Sign in'))
    expect(await screen.findByText('login page')).toBeInTheDocument()
  })
})
