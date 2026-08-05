import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'
import QueryPage from './QueryPage'
import useQueryStore from '../stores/useQueryStore'
import useDatasourceStore from '../stores/useDatasourceStore'
import useAuthStore from '../stores/useAuthStore'

// ChartSpec renders an antv/G2 canvas, which jsdom cannot rasterize.
vi.mock('../components/ChartSpec', () => ({ default: () => null }))

const renderPage = () =>
  render(
    <MemoryRouter>
      <QueryPage />
    </MemoryRouter>,
  )

describe('QueryPage new-session suggestions', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = function () {}
    useQueryStore.setState({
      conversationId: null,
      turns: [],
      suggestions: [],
      suggestionsLoading: false,
      error: null,
      loading: false,
    })
    useDatasourceStore.setState({
      datasources: [],
      selectedDatasourceId: 'ds-1',
      currentDatasource: null,
    })
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      guestQuota: null,
      loading: false,
      error: null,
    })
  })

  it('shows schema-derived starter suggestions in the empty state', async () => {
    renderPage()
    expect(await screen.findByText('Try one of these:')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /How many students are in each major/i }),
    ).toBeInTheDocument()
  })

  it('submits the question when a suggestion chip is clicked', async () => {
    renderPage()
    const chip = await screen.findByRole('button', {
      name: /How many students are in each major/i,
    })
    await userEvent.click(chip)
    expect(
      await screen.findByText('Answered: How many students are in each major?'),
    ).toBeInTheDocument()
  })

  it('falls back to the static hint when there are no suggestions', async () => {
    server.use(
      http.get('/api/v1/datasources/ds-1/suggestions', () =>
        HttpResponse.json({ suggestions: [] }),
      ),
    )
    renderPage()
    expect(screen.getByText(/top 5 products by revenue/i)).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByText('Try one of these:')).toBeNull()
  })

  it('hides starter suggestions once a turn is present', async () => {
    renderPage()
    await screen.findByRole('button', { name: /How many students/i })
    await userEvent.click(
      screen.getAllByRole('button', { name: /How many students/i }).slice(-1)[0],
    )
    await screen.findByText(/Answered:/)
    expect(screen.queryByText('Try one of these:')).toBeNull()
  })
})

describe('QueryPage guest quota', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = function () {}
    useQueryStore.setState({
      conversationId: null,
      turns: [],
      suggestions: [],
      suggestionsLoading: false,
      error: null,
      loading: false,
    })
    useDatasourceStore.setState({
      datasources: [],
      selectedDatasourceId: 'ds-1',
      currentDatasource: null,
    })
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      guestQuota: null,
      loading: false,
      error: null,
    })
  })

  it('shows the guest quota badge and remaining count after a query', async () => {
    server.use(
      http.post('/api/v1/query', () =>
        HttpResponse.json({
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
          guest_quota: { limit: 5, used: 1, remaining: 4 },
        }),
      ),
    )
    renderPage()
    const input = screen.getByPlaceholderText('Ask a question about your data')
    await userEvent.type(input, 'how many customers?')
    await userEvent.click(screen.getByTitle('Send'))

    expect(await screen.findByText(/4 guest queries remaining/i)).toBeInTheDocument()
    expect(screen.getByText(/Guest 1\/5/)).toBeInTheDocument()
  })

  it('locks the composer and offers sign-in when the quota is exhausted', async () => {
    useAuthStore.setState({
      guestQuota: { limit: 5, used: 5, remaining: 0 },
    })
    renderPage()

    expect(
      await screen.findByText('Guest query limit reached.'),
    ).toBeInTheDocument()
    const input = screen.getByPlaceholderText(
      'Guest limit reached — sign in to keep querying',
    )
    expect(input).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /sign in to keep querying/i }),
    ).toBeInTheDocument()
  })

  it('does not show a quota banner to signed-in users', async () => {
    useAuthStore.setState({
      user: { id: 'u-1', email: 'a@b.c', name: 'A', role: 'member' },
      isAuthenticated: true,
    })
    renderPage()
    expect(screen.queryByText(/Guest 1\/5/)).toBeNull()
  })
})