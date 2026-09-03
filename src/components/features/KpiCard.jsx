import { useEffect, useState } from 'react'
import {
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined,
} from '@ant-design/icons'
import { parseKpiValue, formatKpiAmount } from '../../lib/kpiFormat'

const DURATION = 650

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function useCountUp(target) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (target == null) {
      setDisplay(target)
      return undefined
    }
    if (
      typeof requestAnimationFrame !== 'function' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplay(target)
      return undefined
    }
    let raf
    let start
    const tick = (now) => {
      if (start == null) start = now
      const t = Math.min((now - start) / DURATION, 1)
      setDisplay(target * easeOutCubic(t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])

  return display
}

const TREND_ARROW = {
  up: <ArrowUpOutlined aria-hidden />,
  down: <ArrowDownOutlined aria-hidden />,
  flat: <MinusOutlined aria-hidden />,
}

function KpiCard({ kpi }) {
  const parsed = parseKpiValue(kpi.value)
  const display = useCountUp(parsed ? parsed.amount : null)

  const trendClass =
    kpi.trend === 'up' ? ' positive' : kpi.trend === 'down' ? ' negative' : ''

  return (
    <div className="kpi-card">
      <div className="kpi-label" title={kpi.label}>{kpi.label}</div>
      <div className={'kpi-value' + trendClass} title={kpi.value}>
        <span>
          {parsed
            ? `${parsed.prefix}${formatKpiAmount(display)}${parsed.suffix}`
            : kpi.value}
        </span>
        {TREND_ARROW[kpi.trend] && (
          <span className={`kpi-arrow ${kpi.trend}`} aria-hidden>
            {TREND_ARROW[kpi.trend]}
          </span>
        )}
      </div>
    </div>
  )
}

export default KpiCard