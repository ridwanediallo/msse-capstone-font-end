import { useState, useEffect } from 'react'
import {
  Table, Button, Card, Typography, Tag, Space, Popconfirm, message,
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, ReloadOutlined,
  CheckCircleOutlined, EditOutlined,
} from '@ant-design/icons'
import useDatasourceStore from '../stores/useDatasourceStore'
import DatasourceWizard from '../components/DatasourceWizard'

const { Title, Text } = Typography

function DatasourcePage() {
  const {
    datasources, loading, fetchDatasources, deleteDatasource, introspectSchema,
  } = useDatasourceStore()

  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    fetchDatasources()
  }, [fetchDatasources])

  const handleDelete = async (id) => {
    const result = await deleteDatasource(id)
    if (result.ok) {
      message.success('Datasource deleted')
    } else {
      message.error(result.error)
    }
  }

  const handleRefresh = async (id) => {
    const result = await introspectSchema(id)
    if (result.ok) {
      message.success(`Schema refreshed — ${result.data.length} tables`)
      fetchDatasources()
    } else {
      message.error(result.error)
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'db_type',
      key: 'db_type',
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: 'Host',
      key: 'host',
      render: (_, record) => <Text code>{record.host}:{record.port}</Text>,
    },
    {
      title: 'Database',
      dataIndex: 'database_name',
      key: 'database_name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'ready' ? 'green' : status === 'draft' ? 'orange' : 'default'}>
          {status === 'ready' && <CheckCircleOutlined style={{ marginRight: 4 }} />}
          {status}
        </Tag>
      ),
    },
    {
      title: 'Tables',
      dataIndex: 'schema_table_count',
      key: 'schema_table_count',
      render: (count) => count || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleRefresh(record.id)}
            disabled={record.status !== 'ready'}
          >
            Refresh
          </Button>
          <Popconfirm
            title="Delete this datasource?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>Data Sources</Title>
          <Text type="secondary">Connect and manage your databases</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setWizardOpen(true)}
        >
          Add Datasource
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={datasources.map((d) => ({ ...d, key: d.id }))}
          loading={loading}
          pagination={false}
        />
      </Card>

      <DatasourceWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  )
}

export default DatasourcePage
