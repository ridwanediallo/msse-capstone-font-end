import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import KpiCard from './KpiCard'

let rafCallback

vi.stubGlobal('requestAnimationFrame', (cb) => {
  rafCallback = cb
  return 1
})

vi.stubGlobal('cancelAnimationFrame', () => {})

const advance = (now) => act(() => rafCallback(now))

describe('KpiCard', () => {
  afterEach(() => {
    rafCallback = undefined
  })

  it('renders the label', () => {
    render(<KpiCard kpi={{ label: 'REVENUE', value: '5', trend: 'flat' }} />)
    expect(screen.getByText('REVENUE')).toBeInTheDocument()
  })

  it('formats and animates a numeric value to completion', () => {
    render(<KpiCard kpi={{ label: 'REVENUE', value: '$84k', trend: 'up' }} />)
    advance(0)
    advance(650)
    expect(screen.getByText('$84,000')).toBeInTheDocument()
  })

  it('renders non-numeric values statically', () => {
    render(<KpiCard kpi={{ label: 'TOP MAJOR', value: 'CS' }} />)
    expect(screen.getByText('CS')).toBeInTheDocument()
  })

  it('shows a positive trend arrow for up', () => {
    const { container } = render(
      <KpiCard kpi={{ label: 'N', value: '5', trend: 'up' }} />,
    )
    expect(container.querySelector('.kpi-arrow.up')).toBeInTheDocument()
  })

  it('shows a negative trend arrow for down', () => {
    const { container } = render(
      <KpiCard kpi={{ label: 'N', value: '5', trend: 'down' }} />,
    )
    expect(container.querySelector('.kpi-arrow.down')).toBeInTheDocument()
  })

  it('omits the arrow when there is no trend', () => {
    const { container } = render(<KpiCard kpi={{ label: 'N', value: '5' }} />)
    expect(container.querySelector('.kpi-arrow')).toBeNull()
  })
})