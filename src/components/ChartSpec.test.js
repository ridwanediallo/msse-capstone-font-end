import { describe, expect, it } from 'vitest'
import { buildConfig } from './ChartSpec'

const rows = [
  { region: 'North', revenue: 100 },
  { region: 'South', revenue: 80 },
]

describe('ChartSpec buildConfig', () => {
  it('uses a consistent palette across types', () => {
    const pie = buildConfig({ type: 'pie', x: 'region', y: 'revenue' }, rows)
    expect(pie.angleField).toBe('revenue')
    expect(pie.colorField).toBe('region')
    expect(pie.legend.position).toBe('bottom')
    expect(Array.isArray(pie.color)).toBe(true)
  })

  it('adds a series field for line charts when present', () => {
    const line = buildConfig({ type: 'line', x: 'region', y: 'revenue', series: 'group' }, rows)
    expect(line.seriesField).toBe('group')
  })

  it('builds vertical column axis config', () => {
    const col = buildConfig({ type: 'column', x: 'region', y: 'revenue' }, rows)
    expect(col.xField).toBe('region')
    expect(col.yField).toBe('revenue')
    expect(col.yAxis.title.text).toBe('revenue')
  })

  it('latest has autoFit and fixed height for responsive sizing', () => {
    const col = buildConfig({ type: 'column', x: 'region', y: 'revenue' }, rows)
    expect(col.autoFit).toBe(true)
    expect(col.height).toBe(280)
  })

  it('uses a single color when no series', () => {
    const col = buildConfig({ type: 'column', x: 'region', y: 'revenue' }, rows)
    expect(typeof col.color).toBe('string')
  })
})