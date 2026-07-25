import { useState } from 'react'
import { Input, Button, Table, Card, Typography, Tag, Spin, Alert, Collapse, Empty } from 'antd'
import { SearchOutlined, ClearOutlined, CodeOutlined } from '@ant-design/icons'
import useQueryStore from '../stores/useQueryStore'

const { Title, Text } = Typography
const { TextArea } = Input

function QueryPage() {
  const {
    sql,
    rows,
    rowCount,
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

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={2}>Ask a Question</Title>
      <Text type="secondary">
        Ask a natural language question about your database and get SQL results.
      </Text>

      <Card style={{ marginTop: 24 }}>
        <TextArea
          rows={3}
          placeholder='e.g. "total sales by region" or "which customer has the most orders"'
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          style={{ fontSize: 16 }}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
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
          style={{ marginTop: 16 }}
          closable
        />
      )}

      {loading && (
        <Card style={{ marginTop: 16, textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Generating SQL and running query...</Text>
          </div>
        </Card>
      )}

      {sql && !loading && (
        <Card style={{ marginTop: 16 }}>
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
                  <pre
                    style={{
                      margin: 0,
                      background: '#f5f5f5',
                      padding: 16,
                      borderRadius: 8,
                      overflow: 'auto',
                    }}
                  >
                    {sql}
                  </pre>
                ),
              },
            ]}
          />
        </Card>
      )}

      {!loading && rows.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <Tag color="blue">{rowCount} row{rowCount !== 1 ? 's' : ''}</Tag>
          </div>
          <Table
            columns={columns}
            dataSource={rows.map((row, i) => ({ ...row, key: i }))}
            pagination={{ pageSize: 10 }}
            size="middle"
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}

      {!loading && !error && sql && rows.length === 0 && (
        <Card style={{ marginTop: 16 }}>
          <Empty description="No results returned" />
        </Card>
      )}
    </div>
  )
}

export default QueryPage
