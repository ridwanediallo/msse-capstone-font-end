import { useState, useRef, useEffect } from 'react'
import { Table, Button, Alert, Tooltip, message } from 'antd'
import {
  CheckSquareOutlined, LoadingOutlined, BorderOutlined,
  CodeOutlined, CopyOutlined, TableOutlined,
  FilePdfOutlined, FileExcelOutlined, ArrowRightOutlined,
  ReloadOutlined, DatabaseOutlined,
} from '@ant-design/icons'
import { format } from 'sql-formatter'
import hljs from 'highlight.js/lib/core'
import postgresql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/github.css'
import * as html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import useQueryStore from '../stores/useQueryStore'
import useDatasourceStore from '../stores/useDatasourceStore'
import ChartSpec from '../components/ChartSpec'

hljs.registerLanguage('postgresql', postgresql)

const PIPELINE_STEPS = [
  'Schema analyzed',
  'Query written',
  'Validated',
  'Data retrieved',
  'Report composed',
]

function parseSuggestions(text) {
  if (!text) return []
  const match = text.match(/SUGGESTIONS:\s*([\s\S]*)/i)
  if (!match) return []
  return match[1]
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
    .filter(Boolean)
}

function stripSuggestions(text) {
  if (!text) return text
  return text.replace(/SUGGESTIONS:\s*[\s\S]*/i, '').trim()
}

function formatSql(sql) {
  // sql-formatter's parser can reject some generated/edge SQL; never crash
  // the report panel — fall back to the raw query.
  try {
    return format(sql, { language: 'postgresql', tabWidth: 2 })
  } catch {
    return sql
  }
}

function labelize(field) {
  return String(field).replace(/_/g, ' ')
}

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function deriveKpis(turn) {
  // Prefer real KPIs computed by the backend from actual query results
  if (turn.kpis && turn.kpis.length > 0) {
    return turn.kpis
  }

  const { chartSpec, rows } = turn
  if (!chartSpec || !chartSpec.x || !chartSpec.y || !rows || rows.length === 0) {
    return []
  }
  const x = chartSpec.x
  const y = chartSpec.y
  const values = rows
    .map((r) => Number(r[y]))
    .filter((v) => !Number.isNaN(v))
  if (values.length === 0) return []

  let top = rows[0]
  for (const r of rows) {
    if (Number(r[y]) > Number(top[y])) top = r
  }
  const total = values.reduce((a, b) => a + b, 0)

  return [
    { label: `Top ${labelize(x)}`, value: String(top[x]) },
    { label: labelize(y), value: numberFmt.format(Number(top[y])) },
    { label: `Total ${labelize(y)}`, value: numberFmt.format(total) },
  ]
}

function PipelineChips({ steps, doneCount, activeIndex }) {
  return (
    <div className="pipeline-chips">
      {steps.map((label, i) => {
        const done = i < doneCount
        const active = i === activeIndex
        return (
          <span key={label} className={'pipeline-chip' + (done || active ? '' : ' pending')}>
            {done ? (
              <CheckSquareOutlined />
            ) : active ? (
              <LoadingOutlined spin style={{ color: 'var(--accent)' }} />
            ) : (
              <BorderOutlined />
            )}
            {label}
          </span>
        )
      })}
    </div>
  )
}

function UserBubble({ turn }) {
  return (
    <div className="user-bubble">
      {turn.question}
      {turn.questionResolved && (
        <span className="resolved">Resolved to: {turn.questionResolved}</span>
      )}
    </div>
  )
}

function ReportPanel({ turn }) {
  const hasData = Boolean(turn.rows && turn.rows.length > 0 && !turn.noQuery)
  const [view, setView] = useState(() => {
    if (hasData) return 'data'
    if (turn.sql) return 'sql'
    return null
  })
  const reportRef = useRef(null)

  const kpis = deriveKpis(turn)
  const narrative = stripSuggestions(turn.summary)

  const columns =
    turn.rows && turn.rows.length > 0
      ? Object.keys(turn.rows[0]).map((key) => ({
          title: key,
          dataIndex: key,
          key,
          render: (val) => (val !== null && val !== undefined ? String(val) : '-'),
        }))
      : []

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(turn.sql)
      message.success('SQL copied')
    } catch {
      message.error('Could not copy')
    }
  }

  const handleExportPDF = async () => {
    if (!reportRef.current) return
    try {
      const canvas = await html2canvas.default(reportRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('query-report.pdf')
    } catch {
      message.error('PDF export failed')
    }
  }

  const handleExportExcel = () => {
    if (!turn.rows || turn.rows.length === 0) return
    const ws = XLSX.utils.json_to_sheet(turn.rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Results')
    XLSX.writeFile(wb, 'query-results.xlsx')
  }

  const renderChart = () => {
    return <ChartSpec spec={turn.chartSpec} rows={turn.rows} />
  }

  const pipelineSteps = turn.noQuery
    ? ['Schema analyzed', 'Report composed']
    : PIPELINE_STEPS

  return (
    <div className="report-panel" ref={reportRef}>
      <PipelineChips steps={pipelineSteps} doneCount={pipelineSteps.length} activeIndex={-1} />

      {!turn.noQuery && kpis.length > 0 && (
        <div className="kpi-row">
          {kpis.map((kpi) => (
            <div className="kpi-card" key={kpi.label}>
              <div className="kpi-label" title={kpi.label}>{kpi.label}</div>
              <div
                className={
                  'kpi-value' +
                  (kpi.trend === 'up' ? ' positive' : kpi.trend === 'down' ? ' negative' : '')
                }
                title={kpi.value}
              >
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {renderChart()}

      {narrative && <p className="narrative">{narrative}</p>}

      {(turn.sql || (turn.rows && turn.rows.length > 0)) && (
        <>
          <hr className="report-divider" />
          <div className="report-toggles">
            {turn.sql && (
              <>
                <button
                  className={'link-toggle' + (view === 'sql' ? ' active' : '')}
                  onClick={() => setView('sql')}
                >
                  <CodeOutlined /> View SQL
                </button>
                <Tooltip title="Copy SQL">
                  <button className="icon-btn" onClick={handleCopySql}>
                    <CopyOutlined />
                  </button>
                </Tooltip>
              </>
            )}
            {hasData && (
              <>
                <button
                  className={'link-toggle' + (view === 'data' ? ' active' : '')}
                  onClick={() => setView('data')}
                >
                  <TableOutlined /> View data
                  <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>
                    ({turn.rowCount} row{turn.rowCount !== 1 ? 's' : ''}
                    {turn.executionTime != null ? ` · ${turn.executionTime}s` : ''})
                  </span>
                </button>
                <Tooltip title="Export PDF">
                  <button className="icon-btn" onClick={handleExportPDF}>
                    <FilePdfOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="Export Excel">
                  <button className="icon-btn" onClick={handleExportExcel}>
                    <FileExcelOutlined />
                  </button>
                </Tooltip>
              </>
            )}
          </div>

          {view === 'sql' && turn.sql && (
            <pre className="sql-block">
              <code
                dangerouslySetInnerHTML={{
                  __html: hljs.highlight(
                    formatSql(turn.sql),
                    { language: 'postgresql' }
                  ).value,
                }}
              />
            </pre>
          )}

          {view === 'data' && hasData && (
            <div className="data-card">
              <Table
                columns={columns}
                dataSource={turn.rows.map((row, i) => ({ ...row, key: i }))}
                pagination={{ pageSize: 5, showSizeChanger: false, size: 'small' }}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function LoadingPanel() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => Math.min(s + 1, PIPELINE_STEPS.length - 1))
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="report-panel">
      <PipelineChips steps={PIPELINE_STEPS} doneCount={step} activeIndex={step} />
      <p className="narrative" style={{ color: 'var(--text-faint)' }}>
        Working on your report…
      </p>
    </div>
  )
}

function QueryPage() {
  const {
    turns, loading, error, submitQuery, newConversation, conversationId,
    suggestions, fetchSuggestions,
  } = useQueryStore()

  const { selectedDatasourceId } = useDatasourceStore()

  const [localQuestion, setLocalQuestion] = useState('')
  const threadEndRef = useRef(null)

  const hasTurns = turns.length > 0

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns.length, loading])

  // Load schema-aware starter suggestions whenever an empty session is shown
  // for a datasource.
  useEffect(() => {
    if (!hasTurns && !loading && selectedDatasourceId) {
      fetchSuggestions(selectedDatasourceId)
    }
  }, [hasTurns, loading, selectedDatasourceId, fetchSuggestions])

  const handleSubmit = () => {
    const q = localQuestion.trim()
    if (!q || loading) return
    submitQuery(q)
    setLocalQuestion('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleRetry = () => {
    const lastTurn = turns[turns.length - 1]
    if (lastTurn) submitQuery(lastTurn.question)
  }

  const latestTurn = hasTurns ? turns[turns.length - 1] : null
  const followUpSuggestions = latestTurn && !loading ? parseSuggestions(latestTurn.summary) : []

  return (
    <>
      <div className="thread">
        <div className="thread-inner">
          {!hasTurns && !loading && (
            <div className="empty-state">
              <DatabaseOutlined style={{ fontSize: 40, color: 'var(--text-faint)' }} />
              <h2>Ask your data anything</h2>
              {suggestions.length > 0 && (
                <div className="starter-suggestions">
                  <div className="starter-label">Try one of these:</div>
                  <div className="suggestion-row">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="suggestion-chip"
                        onClick={() => submitQuery(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {turns.map((turn, i) => (
            <div key={turn.id || i}>
              <UserBubble turn={turn} />
              {(turn.summary || turn.sql) && (
                <ReportPanel turn={turn} />
              )}
            </div>
          ))}

          {loading && <LoadingPanel />}

          {error && (
            <Alert
              type="error"
              message="Query failed"
              description={error}
              showIcon
              style={{ marginBottom: 16, borderRadius: 10 }}
              closable
              action={
                <Button size="small" icon={<ReloadOutlined />} onClick={handleRetry}>
                  Retry
                </Button>
              }
            />
          )}

          {followUpSuggestions.length > 0 && (
            <div className="suggestion-row">
              {followUpSuggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  disabled={loading}
                  onClick={() => submitQuery(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={threadEndRef} />
        </div>
      </div>

      <div className="composer">
        <div className="composer-inner">
          <textarea
            className="composer-input"
            rows={1}
            placeholder={
              conversationId ? 'Ask a follow-up question' : 'Ask a question about your data'
            }
            value={localQuestion}
            onChange={(e) => setLocalQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="composer-send"
            onClick={handleSubmit}
            disabled={!localQuestion.trim() || loading}
            title="Send"
          >
            <ArrowRightOutlined />
          </button>
        </div>
        {hasTurns && (
          <div style={{ maxWidth: 1000, margin: '6px auto 0', textAlign: 'right' }}>
            <Button size="small" type="text" onClick={newConversation} disabled={loading}>
              Start new session
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export default QueryPage
