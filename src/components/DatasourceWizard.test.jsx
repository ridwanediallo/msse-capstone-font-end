import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'
import DatasourceWizard from './DatasourceWizard'

const renderWizard = (onClose = vi.fn()) =>
  render(<DatasourceWizard open onClose={onClose} />)

const fillCredentials = async () => {
  await userEvent.type(screen.getByLabelText(/datasource name/i), 'my_db')
  await userEvent.type(screen.getByLabelText(/^host/i), 'localhost')
  await userEvent.type(screen.getByLabelText('Database'), 'sample_target')
  await userEvent.type(screen.getByLabelText(/username/i), 'postgres')
}

describe('DatasourceWizard', () => {
  it(
    'walks through the full add-datasource flow',
    async () => {
      const onClose = vi.fn()
      renderWizard(onClose)

      // Step 0: DB type
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: /^next$/i }))

      // Step 1: credentials
      await fillCredentials()
      await userEvent.click(screen.getByRole('button', { name: /^next$/i }))

      // Step 2: test connection
      expect(screen.getByText('Click "Next" to test the connection')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: /test connection/i }))

      // Step 3: review schema
      await userEvent.click(await screen.findByRole('button', { name: /introspect & create/i }))

      // Step 3: review (introspect ran and produced 1 catalog entry)
      expect(await screen.findByLabelText(/description for customers/i)).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: /next/i }))

      // Step 4: save
      expect(await screen.findByText('Ready to Save')).toBeInTheDocument()
      expect(screen.getByText('1 tables will be saved to the schema catalog')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: /save/i }))
      expect(await screen.findByText('Datasource Saved')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /^done$/i }))
      expect(onClose).toHaveBeenCalled()
    },
    15000,
  )

  it('cancels without creating', async () => {
    const onClose = vi.fn()
    renderWizard(onClose)
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('persists excluded tables and descriptions on save', async () => {
    const schemaPuts = []
    server.use(
      http.post('/api/v1/datasources/:id/introspect', () =>
        HttpResponse.json([
          {
            id: 'cat-customers',
            table_name: 'customers',
            columns: [{ name: 'id', type: 'integer' }],
            relationships: [],
            row_count: 8,
          },
          {
            id: 'cat-orders',
            table_name: 'orders',
            columns: [{ name: 'id', type: 'integer' }],
            relationships: [],
            row_count: 20,
          },
        ]),
      ),
      http.put('/api/v1/datasources/:id/schema/:catalogId', async ({ request }) => {
        schemaPuts.push(await request.json())
        return HttpResponse.json({ ok: true })
      }),
    )

    renderWizard(vi.fn())

    await userEvent.click(screen.getByRole('button', { name: /^next$/i }))
    await fillCredentials()
    await userEvent.click(screen.getByRole('button', { name: /^next$/i }))
    await userEvent.click(screen.getByRole('button', { name: /test connection/i }))
    await userEvent.click(await screen.findByRole('button', { name: /introspect & create/i }))

    // Review step: describe customers, exclude orders.
    await screen.findByLabelText(/description for customers/i)
    await userEvent.type(screen.getByLabelText(/description for customers/i), 'customer master list')
    await userEvent.click(screen.getByLabelText(/include orders/i))

    // Move to the Save step; it warns about the exclusion, then persists curation.
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(
      await screen.findByText(/Excluded tables are hidden from the AI/i),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    await screen.findByText('Datasource Saved')

    expect(schemaPuts).toEqual([
      { is_included: true, description: 'customer master list' },
      { is_included: false },
    ])
  })
})
