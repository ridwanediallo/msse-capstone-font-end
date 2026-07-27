import { useState, useRef } from 'react'
import {
  Input, Button, Table, Card, Typography, Tag, Spin, Alert,
  Collapse, Empty, Space, Steps,
} from 'antd'
import {
  SearchOutlined, ClearOutlined, CodeOutlined, BulbOutlined,
  DatabaseOutlined, ClockCircleOutlined,
  FilePdfOutlined, FileExcelOutlined, LineChartOutlined,
  BarChartOutlined, PieChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Bar, Column, Line, Pie, Scatter } from '@ant-design/charts'
import { format } from 'sql-formatter'
import hljs from 'highlight.js/lib/core'
import postgresql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/github.css'
import * as html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import useQueryStore from '../stores/useQueryStore'

hljs.registerLanguage('postgresql', postgresql)

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const chartComponents = {
  bar: Bar,
  line: Line,
  pie: Pie,
  scatter: Scatter,
  column: Column,
}

const chartIcons = {
  bar: <BarChartOutlined />,
  line: <LineChartOutlined />,
  pie: <PieChartOutlined />,
  scatter: <BarChartOutlined />,
  column: <BarChartOutlined />,
}

function parseSuggestions(text) {
  if (!text) return []
  const match = text.match(/SUGGESTIONS:\s*([\s\S]*)/i)
  if (!match) return []
  const lines = match[1].trim().split('\n')
  const suggestions = []
  for (const line of lines) {
    const cleaned = line.replace(/^\d+\.\s*/, '').trim()
    if (cleaned) suggestions.push(cleaned)
  }
  return suggestions
}

function stripSuggestions(text) {
  if (!text) return text
  return text.replace(/SUGGESTIONS:\s*[\s\S]*/i, '').trim()
}

function QueryPage() {
  const {
    summary, chartSpec, sql, rows, rowCount, executionTime, noQuery,
    loading, error, submitQuery, reset,
  } = useQueryStore()

  const [localQuestion, setLocalQuestion] = useState('')
  const reportRef = useRef(null)

  const handleSubmit = () => {
    const q = localQuestion.trim()
    if (!q) return
    submitQuery(q)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleClear = () => {
    setLocalQuestion('')
    reset()
  }

  const handleRetry = () => {
    const q = localQuestion.trim()
    if (q) submitQuery(q)
  }

  const columns = rows.length > 0
    ? Object.keys(rows[0]).map((key) => ({
        title: key,
        dataIndex: key,
        key,
        render: (val) => (val !== null && val !== undefined ? String(val) : '-'),
      }))
    : []

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
      // Silently fail — PDF export is best-effort
    }
  }

  const handleExportExcel = () => {
    if (rows.length === 0) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Results')
    XLSX.writeFile(wb, 'query-results.xlsx')
  }

  const hasResults = !loading && (summary || sql || rows.length > 0 || error)

  const renderChart = () => {
    if (!chartSpec || !chartSpec.type || chartSpec.type === 'none' || rows.length === 0) return null

    const ChartComponent = chartComponents[chartSpec.type]
    if (!ChartComponent) return null

    const chartProps = {
      data: rows,
      xField: chartSpec.x,
      yField: chartSpec.y,
      height: 300,
      color: '#1677ff',
    }

    if (chartSpec.type === 'pie') {
      chartProps.angleField = chartSpec.y
      chartProps.colorField = chartSpec.x
      delete chartProps.xField
      delete chartProps.yField
    }

    return (
      <Card
        style={{ marginBottom: 16 }}
        title={
          <span>
            {chartIcons[chartSpec.type] || <BarChartOutlined />}
            {' '}{chartSpec.title || 'Visualization'}
          </span>
        }
      >
        <ChartComponent {...chartProps} />
      </Card>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          Ask a Question
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Query your database using natural language — no SQL required.
        </Text>
      </div>

      <Card style={{ marginBottom: 24, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
        <TextArea
          rows={3}
          placeholder='e.g. "Show me total sales by region for Q1" or "Which customer has the most orders?"'
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          style={{ fontSize: 15, marginBottom: 12 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSubmit}
            loading={loading}
            disabled={!localQuestion.trim()}
            size="large"
          >
            Run Query
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear} disabled={loading}>
            Clear
          </Button>
        </div>
      </Card>

      {error && (
        <Alert
          type="error"
          message="Query Failed"
          description={error}
          showIcon
          style={{ marginBottom: 16 }}
          closable
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={handleRetry}>
              Retry
            </Button>
          }
        />
      )}

      {loading && (
        <Card style={{ textAlign: 'center', padding: '32px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Steps
              size="small"
              current={-1}
              items={[
                { title: 'Analyzing schema' },
                { title: 'Generating SQL' },
                { title: 'Running query' },
                { title: 'Composing report' },
              ]}
              style={{ maxWidth: 500, margin: '0 auto' }}
            />
          </div>
        </Card>
      )}

      {hasResults && (
        <div ref={reportRef}>
          {summary && !loading && (
            <Card className="summary-card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <BulbOutlined style={{ fontSize: 18, color: '#52c41a', marginTop: 3 }} />
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 14, color: '#52c41a' }}>
                    {noQuery ? 'Notice' : 'Summary'}
                  </Text>
                  <Paragraph style={{ marginTop: 4, marginBottom: 0, fontSize: 15 }}>
                    {stripSuggestions(summary)}
                  </Paragraph>
                </div>
              </div>
            </Card>
          )}

          {noQuery && !loading && parseSuggestions(summary).length > 0 && (
            <Card
              style={{
                marginBottom: 16,
                background: '#fffbe6',
                border: '1px solid #ffe58f',
              }}
              title={
                <span>
                  <BulbOutlined style={{ color: '#faad14' }} /> Suggested Queries
                </span>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {parseSuggestions(summary).map((suggestion, i) => (
                  <Button
                    key={i}
                    block
                    style={{
                      textAlign: 'left',
                      height: 'auto',
                      padding: '10px 16px',
                      whiteSpace: 'normal',
                      borderColor: '#ffe58f',
                    }}
                    onClick={() => {
                      setLocalQuestion(suggestion)
                      submitQuery(suggestion)
                    }}
                  >
                    <BulbOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    {suggestion}
                  </Button>
                ))}
              </Space>
            </Card>
          )}

          {!loading && renderChart()}

          {sql && !loading && (() => {
            const formatted = format(sql, { language: 'postgresql', tabWidth: 2 })
            const highlighted = hljs.highlight(formatted, { language: 'postgresql' }).value
            return (
              <Card style={{ marginBottom: 16 }}>
                <Collapse
                  defaultActiveKey={['sql']}
                  items={[{
                    key: 'sql',
                    label: <span><CodeOutlined /> Generated SQL</span>,
                    children: (
                      <pre className="sql-block">
                        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
                      </pre>
                    ),
                  }]}
                />
              </Card>
            )
          })()}

          {!loading && rows.length > 0 && !noQuery && (
            <Card>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                  <DatabaseOutlined style={{ color: '#1677ff' }} />
                  <Tag color="blue">{rowCount} row{rowCount !== 1 ? 's' : ''}</Tag>
                  {executionTime !== null && (
                    <Tag color="default"><ClockCircleOutlined /> {executionTime}s</Tag>
                  )}
                  {chartSpec && chartSpec.type && chartSpec.type !== 'none' && (
                    <Tag color="purple">{chartIcons[chartSpec.type]} {chartSpec.type}</Tag>
                  )}
                </Space>
                <Space>
                  <Button size="small" icon={<FilePdfOutlined />} onClick={handleExportPDF}>
                    PDF
                  </Button>
                  <Button size="small" icon={<FileExcelOutlined />} onClick={handleExportExcel}>
                    Excel
                  </Button>
                </Space>
              </div>
              <Table
                columns={columns}
                dataSource={rows.map((row, i) => ({ ...row, key: i }))}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                size="middle"
                scroll={{ x: 'max-content' }}
              />
            </Card>
          )}
        </div>
      )}

      {!loading && !hasResults && (
        <Card style={{ textAlign: 'center', padding: '48px 0' }}>
          <DatabaseOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <div>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Ask a question above to get started.
            </Text>
          </div>
        </Card>
      )}

      {!loading && !error && sql && rows.length === 0 && !noQuery && (
        <Card style={{ textAlign: 'center', padding: '32px 0' }}>
          <Empty description="No results returned" />
        </Card>
      )}
    </div>
  )
}

export default QueryPage
