import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from './test/mocks/server'
import App from './App'
import useAuthStore from './stores/useAuthStore'

vi.mock('./components/ChartSpec', () => ({ default: () => null }))

const memberUser = {
  id: 'u-member',
  email: 'member@queryable.local',
  name: 'Member',
  role: 'member',
  is_active: true,
  created_at: '2026-07-01T00:00:00Z',
  last_login_at: null,
}

const renderAt = (path) => {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('App admin route guard', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = function () {}
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      guestQuota: null,
      loading: true,
      error: null,
    })
  })

  it('lets an admin into /datasources', async () => {
    renderAt('/datasources')
    expect(await screen.findByText('Data Sources')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /add datasource/i }),
    ).toBeInTheDocument()
  })

  it('redirects a member away from /datasources', async () => {
    server.use(
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json({ is_authenticated: true, user: memberUser }),
      ),
    )
    renderAt('/datasources')
    expect(await screen.findByText('Ask your data anything')).toBeInTheDocument()
  })

  it('shows the login page to anonymous visitors at /login', async () => {
    server.use(
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json({ is_authenticated: false, user: null }),
      ),
    )
    renderAt('/login')
    expect(
      await screen.findByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument()
  })

  it('refetches the session history after signing in', async () => {
    const adminConv = {
      id: 'conv-admin',
      title: 'Admin revenue report',
      turn_count: 1,
      updated_at: '2026-08-01T00:00:00Z',
      data_source_id: 'ds-1',
    }
    let signedIn = false
    server.use(
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json({ is_authenticated: false, user: null }),
      ),
      http.get('/api/v1/conversations', () =>
        HttpResponse.json(signedIn ? [adminConv] : []),
      ),
      http.post('/api/v1/auth/login', async () => {
        signedIn = true
        return HttpResponse.json({ user: memberUser })
      }),
    )
    renderAt('/')
    expect(await screen.findByText('No sessions yet')).toBeInTheDocument()

    await useAuthStore.getState().login('member@queryable.local', 'pw')

    expect(
      await screen.findByText('Admin revenue report'),
    ).toBeInTheDocument()
  })

  it('clears the previous user recents after signing out', async () => {
    const adminConv = {
      id: 'conv-admin',
      title: 'Admin revenue from recent',
      turn_count: 1,
      updated_at: '2026-08-01T00:00:00Z',
      data_source_id: 'ds-1',
    }
    let signedOut = false
    server.use(
      http.get('/api/v1/conversations', () =>
        HttpResponse.json(signedOut ? [] : [adminConv]),
      ),
    )
    renderAt('/')
    expect(
      await screen.findByText('Admin revenue from recent'),
    ).toBeInTheDocument()

    signedOut = true
    await useAuthStore.getState().logout()

    expect(await screen.findByText('No sessions yet')).toBeInTheDocument()
  })
})
