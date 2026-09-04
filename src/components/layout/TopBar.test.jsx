import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import TopBar from './TopBar'
import useQueryStore from '../../stores/useQueryStore'
import useDatasourceStore from '../../stores/useDatasourceStore'
import useAuthStore from '../../stores/useAuthStore'
import useThemeStore from '../../stores/useThemeStore'

const renderTopBar = () =>
  render(
    <MemoryRouter>
      <TopBar />
    </MemoryRouter>,
  )

describe('TopBar', () => {
  beforeEach(() => {
    useQueryStore.getState().reset()
    useDatasourceStore.setState({
      datasources: [],
      selectedDatasourceId: null,
      currentDatasource: null,
    })
    useAuthStore.setState({
      user: { id: 'u-admin', email: 'admin@queryable.local', name: 'Admin', role: 'admin' },
      isAuthenticated: true,
      guestQuota: null,
      loading: false,
      error: null,
    })
    useThemeStore.setState({ theme: 'light' })
  })

  it('toggles dark mode from the top bar', async () => {
    localStorage.removeItem('queryable-theme')
    renderTopBar()
    const toggle = screen.getByRole('button', { name: /toggle dark mode/i })
    await userEvent.click(toggle)
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(localStorage.getItem('queryable-theme')).toBe('dark')
  })

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

  it('defaults to the sample when it is the only datasource', async () => {
    server.use(
      http.get('/api/v1/datasources', () =>
        HttpResponse.json([
          {
            id: 'ds-2',
            name: 'Customers & Orders',
            db_type: 'postgresql',
            host: 'localhost',
            port: 5432,
            database_name: 'sample_target',
            username: 'data_retriever',
            status: 'ready',
            is_sample: true,
            description: '',
            schema_table_count: 2,
            created_at: '2026-07-30T00:00:00Z',
            updated_at: '2026-07-30T00:00:00Z',
          },
        ]),
      ),
    )
    renderTopBar()
    expect(
      await screen.findByRole('button', { name: /customers & orders/i }),
    ).toBeInTheDocument()
  })

  it('prefers a real datasource over the sample for the default', async () => {
    renderTopBar()
    const pill = await screen.findByRole('button', { name: /school/i })
    expect(pill).toHaveTextContent('school')
    expect(pill).not.toHaveTextContent('Customers & Orders')
  })

  it('renders a Sample badge in the datasource dropdown', async () => {
    renderTopBar()
    await screen.findByRole('button', { name: /school/i })

    await userEvent.click(screen.getByRole('button', { name: /school/i }))
    expect(await screen.findByText('Sample')).toBeInTheDocument()
    expect(screen.getAllByText('Sample')).toHaveLength(1)
  })

  it('opens the history drawer with conversations', async () => {
    renderTopBar()
    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    expect(
      await screen.findByText('How many students are in each major?'),
    ).toBeInTheDocument()
  })

  it('reloads a datasource-scoped list when the datasource changes', async () => {
    renderTopBar()
    await screen.findByRole('button', { name: /school/i })

    await userEvent.click(screen.getByRole('button', { name: /school/i }))
    await userEvent.click(await screen.findByText('Customers & Orders'))

    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    expect(
      await screen.findByText('Top products by region'),
    ).toBeInTheDocument()
    expect(screen.queryByText('How many students are in each major?')).toBeNull()
  })

  it('shows "Manage data sources" only to admins', async () => {
    renderTopBar()
    await userEvent.click(await screen.findByRole('button', { name: /school/i }))
    expect(
      await screen.findByText('Manage data sources'),
    ).toBeInTheDocument()
  })

  it('hides "Manage data sources" from users and hides the datasource button', async () => {
    useAuthStore.setState({
      user: { id: 'u-user', email: 'm@x.io', name: 'User', role: 'user' },
      isAuthenticated: true,
    })
    renderTopBar()
    await userEvent.click(await screen.findByRole('button', { name: /school/i }))
    await screen.findByText('Customers & Orders')
    expect(screen.queryByText('Manage data sources')).toBeNull()
    expect(screen.queryByTitle('Data sources')).toBeNull()
  })
})
