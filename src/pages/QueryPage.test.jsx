import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'
import QueryPage from './QueryPage'
import useQueryStore from '../stores/useQueryStore'
import useDatasourceStore from '../stores/useDatasourceStore'

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

  it('shows the empty state without suggestions', async () => {
    server.use(
      http.get('/api/v1/datasources/ds-1/suggestions', () =>
        HttpResponse.json({ suggestions: [] }),
      ),
    )
    renderPage()
    expect(screen.getByText(/Ask your data anything/i)).toBeInTheDocument()
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