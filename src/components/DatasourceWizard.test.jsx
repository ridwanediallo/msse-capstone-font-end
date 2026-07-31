import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  it('walks through the full add-datasource flow', async () => {
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

    // Step 4: save (introspect ran and produced 1 catalog entry)
    expect(await screen.findByText('Ready to Save')).toBeInTheDocument()
    expect(
      screen.getByText('1 tables will be saved to the schema catalog'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByText('Datasource Saved')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^done$/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('cancels without creating', async () => {
    const onClose = vi.fn()
    renderWizard(onClose)
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
