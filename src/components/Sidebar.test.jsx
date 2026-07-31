import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'
import useQueryStore from '../stores/useQueryStore'
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
})
