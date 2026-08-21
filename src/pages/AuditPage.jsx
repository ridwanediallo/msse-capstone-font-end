import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Card, Input, Table, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import useAdminStore, { ADMIN_PAGE_SIZE } from '../stores/useAdminStore'
import { relativeTime } from '../lib/relativeTime'

const { Title, Text } = Typography

function AuditPage() {
  const [searchParams] = useSearchParams()
  const { auditLogs, auditTotal, auditLoading, fetchAuditLogs } = useAdminStore()

  const [action, setAction] = useState('')
  const [userId, setUserId] = useState(searchParams.get('user_id') || '')
  const [resourceType, setResourceType] = useState('')
  const [page, setPage] = useState(1)

  const load = (pageToLoad = 1, overrides = {}) => {
    fetchAuditLogs({
      action: action.trim() || undefined,
      user_id: userId.trim() || undefined,
      resource_type: resourceType.trim() || undefined,
      limit: ADMIN_PAGE_SIZE,
      offset: (pageToLoad - 1) * ADMIN_PAGE_SIZE,
      ...overrides,
    })
    setPage(pageToLoad)
  }

  // Load on mount, honoring the ?user_id= deep link from the user drawer.
  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns = [
    {
      title: 'When',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (value) => <Text type="secondary">{relativeTime(value)}</Text>,
    },
    { title: 'Action', dataIndex: 'action', key: 'action', width: 190 },
    {
      title: 'Actor',
      key: 'actor',
      width: 220,
      render: (_, entry) => (
        <Text code style={{ fontSize: 12 }}>
          {entry.user_id ? `user:${entry.user_id.slice(0, 8)}` : `guest:${entry.guest_id?.slice(0, 8) ?? '—'}`}
        </Text>
      ),
    },
    {
      title: 'Resource',
      key: 'resource',
      render: (_, entry) => (
        <Text type="secondary">
          {entry.resource_type ? `${entry.resource_type}:${(entry.resource_id || '').slice(0, 8)}` : '—'}
        </Text>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
      render: (value) => <Text type="secondary">{value || '—'}</Text>,
    },
  ]

  return (
    <div className="page-pad">
      <div className="admin-page-header">
        <Title level={3} className="admin-page-title" style={{ marginBottom: 0 }}>
          Audit log
        </Title>
      </div>

      <div className="audit-filters">
        <Input
          className="audit-filter"
          prefix={<SearchOutlined />}
          placeholder="Action (e.g. user.update)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          onPressEnter={() => load(1)}
          allowClear
        />
        <Input
          className="audit-filter"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onPressEnter={() => load(1)}
          allowClear
        />
        <Input
          className="audit-filter"
          placeholder="Resource type"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          onPressEnter={() => load(1)}
          allowClear
        />
        <Button type="primary" onClick={() => load(1)}>
          Apply
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={auditLogs.map((e) => ({ ...e, key: e.id }))}
          loading={auditLoading}
          locale={{ emptyText: 'No audit entries match these filters.' }}
          pagination={
            auditTotal > ADMIN_PAGE_SIZE
              ? {
                  current: page,
                  total: auditTotal,
                  pageSize: ADMIN_PAGE_SIZE,
                  showSizeChanger: false,
                  onChange: (p) => load(p),
                }
              : false
          }
        />
      </Card>
    </div>
  )
}

export default AuditPage
