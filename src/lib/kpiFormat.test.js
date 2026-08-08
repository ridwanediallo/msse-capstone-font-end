import { describe, expect, it } from 'vitest'
import { parseKpiValue, formatKpiAmount, formatKpiValue } from './kpiFormat'

describe('parseKpiValue', () => {
  it('parses plain integers', () => {
    const p = parseKpiValue('1234')
    expect(p.amount).toBe(1234)
    expect(p.prefix).toBe('')
    expect(p.suffix).toBe('')
  })

  it('parses currency with a compact k suffix', () => {
    const p = parseKpiValue('$84k')
    expect(p.amount).toBe(84000)
    expect(p.prefix).toBe('$')
  })

  it('parses currency with thousands separators', () => {
    const p = parseKpiValue('$84,200')
    expect(p.amount).toBe(84200)
    expect(p.prefix).toBe('$')
  })

  it('parses compact M and B suffixes', () => {
    expect(parseKpiValue('1.5M').amount).toBe(1500000)
    expect(parseKpiValue('2B').amount).toBe(2000000000)
  })

  it('parses percentages', () => {
    const p = parseKpiValue('12.5%')
    expect(p.amount).toBe(12.5)
    expect(p.suffix).toBe('%')
  })

  it('parses negative values', () => {
    expect(parseKpiValue('-1,200').amount).toBe(-1200)
  })

  it('returns null for non-numeric values', () => {
    expect(parseKpiValue('CS')).toBeNull()
    expect(parseKpiValue('Engineering')).toBeNull()
    expect(parseKpiValue('')).toBeNull()
    expect(parseKpiValue(null)).toBeNull()
    expect(parseKpiValue(undefined)).toBeNull()
  })
})

describe('formatKpiAmount', () => {
  it('formats with thousands separators', () => {
    expect(formatKpiAmount(84000)).toBe('84,000')
  })

  it('keeps small decimals', () => {
    expect(formatKpiAmount(12.5)).toBe('12.5')
  })
})

describe('formatKpiValue', () => {
  it('round-trips a formatted currency value', () => {
    expect(formatKpiValue('$84,200')).toBe('$84,200')
  })

  it('expands a compact suffix', () => {
    expect(formatKpiValue('$84k')).toBe('$84,000')
  })

  it('keeps non-numeric values as-is', () => {
    expect(formatKpiValue('CS')).toBe('CS')
  })
})