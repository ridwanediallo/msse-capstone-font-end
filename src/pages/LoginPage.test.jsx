import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import LoginPage from './LoginPage'
import useAuthStore from '../stores/useAuthStore'

const Home = () => <div>home page</div>

const CurrentPath = () => {
  const location = useLocation()
  return <div data-testid="path">{location.pathname}</div>
}

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<><LoginPage /><CurrentPath /></>} />
        <Route path="/" element={<Home />} />
      </Routes>
    </MemoryRouter>,
  )

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      guestQuota: null,
      loading: false,
      error: null,
    })
  })

  it('navigates home after a successful login', async () => {
    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'member@queryable.local')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await screen.findByText('home page')
    expect(useAuthStore.getState().user.role).toBe('member')
  })

  it('shows the error message when login fails', async () => {
    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'member@queryable.local')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('validates required fields before submitting', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Enter your email')).toBeInTheDocument()
    expect(await screen.findByText('Enter your password')).toBeInTheDocument()
  })
})
