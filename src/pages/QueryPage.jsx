import { useState } from 'react'
import { Input, Button, Table, Card, Typography, Tag, Spin, Alert, Collapse, Empty } from 'antd'
import {
  SearchOutlined,
  ClearOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import useQueryStore from '../stores/useQueryStore'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

function QueryPage() {
  const {
    summary,
    sql,
    rows,
    rowCount,
    executionTime,
    loading,
    error,
    submitQuery,
    reset,
  } = useQueryStore()

  const [localQuestion, setLocalQuestion] = useState('')

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

  const columns = rows.length > 0
    ? Object.keys(rows[0]).map((key) => ({
        title: key,
        dataIndex: key,
        key,
        render: (val) => (val !== null && val !== undefined ? String(val) : '-'),
      }))
    : []

  const hasResults = !loading && (summary || sql || rows.length > 0 || error)

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

      <Card
        style={{
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        }}
      >
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
          <Button
            icon={<ClearOutlined />}
            onClick={handleClear}
            disabled={loading}
          >
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
        />
      )}

      {loading && (
        <Card style={{ textAlign: 'center', padding: '32px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Analyzing schema and generating SQL...
            </Text>
          </div>
        </Card>
      )}

      {summary && !loading && (
        <Card
          className="summary-card"
          style={{ marginBottom: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <BulbOutlined
              style={{ fontSize: 18, color: '#52c41a', marginTop: 3 }}
            />
            <div>
              <Text strong style={{ fontSize: 14, color: '#52c41a' }}>
                Summary
              </Text>
              <Paragraph
                style={{ marginTop: 4, marginBottom: 0, fontSize: 15 }}
              >
                {summary}
              </Paragraph>
            </div>
          </div>
        </Card>
      )}

      {sql && !loading && (
        <Card style={{ marginBottom: 16 }}>
          <Collapse
            items={[
              {
                key: 'sql',
                label: (
                  <span>
                    <CodeOutlined /> Generated SQL
                  </span>
                ),
                children: (
                  <pre className="sql-block">{sql}</pre>
                ),
              },
            ]}
          />
        </Card>
      )}

      {!loading && rows.length > 0 && (
        <Card>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DatabaseOutlined style={{ color: '#1677ff' }} />
            <Tag color="blue">
              {rowCount} row{rowCount !== 1 ? 's' : ''}
            </Tag>
            {executionTime !== null && (
              <Tag color="default">
                <ClockCircleOutlined /> {executionTime}s
              </Tag>
            )}
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

      {!loading && !error && sql && rows.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '32px 0' }}>
          <Empty description="No results returned" />
        </Card>
      )}
    </div>
  )
}

export default QueryPage
