import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'
import TopBar from './TopBar'

const renderTopBar = () =>
  render(
    <MemoryRouter>
      <TopBar />
    </MemoryRouter>,
  )

describe('TopBar', () => {
  it('fetches datasources and shows the selected one', async () => {
    renderTopBar()
    expect(await screen.findByRole('button', { name: /school/i })).toBeInTheDocument()
  })

  it('shows "No data source" when the list is empty', async () => {
    server.use(
      http.get('/api/v1/datasources', () => HttpResponse.json([])),
    )
    renderTopBar()
    expect(await screen.findByText('No data source')).toBeInTheDocument()
  })

  it('opens the history drawer with conversations', async () => {
    renderTopBar()
    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    expect(
      await screen.findByText('How many students are in each major?'),
    ).toBeInTheDocument()
  })
})
