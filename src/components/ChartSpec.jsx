import { Bar, Column, Line, Pie, Scatter } from '@ant-design/charts'
import useThemeStore from '../stores/useThemeStore'

// Consistent palette shared across all chart types (brand-aligned).
const PALETTE = ['#4f46e5', '#0d9488', '#f59e0b', '#ef4444', '#7c3aed', '#06b6d4', '#ec4899', '#84cc16']

const COMPONENTS = { bar: Bar, column: Column, line: Line, pie: Pie, scatter: Scatter }

// DB drivers may deliver numbers as strings (e.g. Postgres NUMERIC via JSON).
// Angle/size channels in G2 need real numbers, so coerce defensively.
function toNumber(value) {
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return value
}

export function normalizeRows(rows) {
  if (!Array.isArray(rows)) return rows
  return rows.map((row) => {
    if (typeof row !== 'object' || row === null) return row
    return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, toNumber(v)]))
  })
}

function baseConfig(rows, spec) {
  const hasSeries = Boolean(spec.series || spec.type === 'pie' || spec.type === 'scatter')
  return {
    data: rows,
    height: 280,
    autoFit: true,
    color: hasSeries ? PALETTE : PALETTE[0],
  }
}

function tickTruncate() {
  // Rotate/trim long category labels so they don't overlap or push off-canvas.
  return {
    autoEllipsis: true,
    maxRows: 2,
    style: { fontSize: 11 },
  }
}

export function buildConfig(spec, rows) {
  const { x, y, series } = spec
  const base = baseConfig(rows, spec)

  if (spec.type === 'pie') {
    const total = rows.reduce((sum, r) => sum + (Number(r[y]) || 0), 0)
    return {
      ...base,
      angleField: y,
      colorField: x,
      radius: 0.9,
      innerRadius: 0.5,
      labels: [
        {
          position: 'outside',
          text: (datum) => {
            const value = Number(datum[y]) || 0
            const pct = total ? ((value / total) * 100).toFixed(1) : '0'
            return `${datum[x]}: ${pct}%`
          },
        },
      ],
      legend: { position: 'bottom' },
    }
  }

  if (spec.type === 'line') {
    return {
      ...base,
      xField: x,
      yField: series || y,
      seriesField: series || undefined,
      smooth: true,
      point: { size: 2 },
      xAxis: { type: 'cat', tickRotation: 0 },
      yAxis: { title: { text: y } },
      legend: series ? { position: 'bottom' } : undefined,
    }
  }

  if (spec.type === 'scatter') {
    return {
      ...base,
      xField: x,
      yField: y,
      shape: 'circle',
      size: 5,
      point: { size: 5, shape: 'circle' },
      legend: series ? { position: 'bottom' } : undefined,
    }
  }

  // bar (horizontal) and column (vertical)
  const isBar = spec.type === 'bar'
  const axis = isBar
    ? {
        xAxis: { title: { text: y }, tick: tickTruncate() },
        yAxis: { title: { text: x }, tick: tickTruncate() },
        barWidthRatio: 0.55,
      }
    : {
        xAxis: { tick: tickTruncate() },
        yAxis: { title: { text: y } },
        columnWidthRatio: 0.55,
      }
  return { ...base, xField: x, yField: y, seriesField: series || undefined, ...axis }
}

export default function ChartSpec({ spec, rows }) {
  const theme = useThemeStore((s) => s.theme)
  const type = spec?.type
  const Component = COMPONENTS[type]
  const data = normalizeRows(rows)
  if (!Component || type === 'none' || !data || data.length === 0) {
    return null
  }
  return (
    <div className="chart-card">
      {spec.title ? <h3 className="chart-title">{spec.title}</h3> : null}
      <Component
        {...buildConfig(spec, data)}
        theme={theme === 'dark' ? 'classicDark' : 'classic'}
      />
    </div>
  )
}
