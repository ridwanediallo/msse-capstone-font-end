import { useState } from 'react'
import {
  Modal, Steps, Form, Input, InputNumber, Button, Result, Table,
  Typography, Space, Switch, message, Spin,
} from 'antd'
import {
  CheckCircleOutlined, CloseCircleOutlined,
  ApiOutlined, DatabaseOutlined, FormOutlined, SaveOutlined,
} from '@ant-design/icons'
import useDatasourceStore from '../stores/useDatasourceStore'

const { Title, Text } = Typography

const steps = [
  { title: 'DB Type', icon: <DatabaseOutlined /> },
  { title: 'Credentials', icon: <FormOutlined /> },
  { title: 'Test', icon: <ApiOutlined /> },
  { title: 'Review Schema', icon: <FormOutlined /> },
  { title: 'Save', icon: <SaveOutlined /> },
]

function DatasourceWizard({ open, onClose }) {
  const { testConnection, createDatasource, introspectSchema, fetchDatasources } = useDatasourceStore()

  const [current, setCurrent] = useState(0)
  const [dbType] = useState('postgresql')
  const [connecting, setConnecting] = useState(false)
  const [connectionResult, setConnectionResult] = useState(null)
  const [schemaData, setSchemaData] = useState([])
  const [introspecting, setIntrospecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [createdId, setCreatedId] = useState(null)

  const [form] = Form.useForm()

  const handleNext = async () => {
    if (current === 1) {
      try {
        await form.validateFields()
      } catch {
        return
      }
    }

    if (current === 2) {
      await handleTestConnection()
      return
    }

    if (current === 3) {
      await handleIntrospect()
      return
    }

    if (current === 4) {
      await handleSave()
      return
    }

    setCurrent((prev) => prev + 1)
  }

  const handleTestConnection = async () => {
    setConnecting(true)
    setConnectionResult(null)
    const values = form.getFieldsValue()
    const result = await testConnection({
      host: values.host,
      port: values.port,
      database_name: values.database_name,
      username: values.username,
      password: values.password,
    })
    setConnectionResult(result)
    setConnecting(false)
    if (result.success) {
      setCurrent((prev) => prev + 1)
    }
  }

  const handleIntrospect = async () => {
    setIntrospecting(true)
    const values = form.getFieldsValue()

    // First create the datasource so we can introspect
    const result = await createDatasource({
      name: values.name,
      db_type: dbType,
      host: values.host,
      port: values.port,
      database_name: values.database_name,
      username: values.username,
      password: values.password,
    })

    if (result.ok) {
      setCreatedId(result.data.id)
      const introspectResult = await introspectSchema(result.data.id)
      if (introspectResult.ok) {
        setSchemaData(introspectResult.data)
        setCurrent((prev) => prev + 1)
      } else {
        message.error(introspectResult.error)
      }
    } else {
      message.error(result.error)
    }
    setIntrospecting(false)
  }

  const handleSave = async () => {
    setSaving(true)
    // Datasource is already created, just mark as saved
    await fetchDatasources()
    setSaved(true)
    setSaving(false)
  }

  const handleClose = () => {
    setCurrent(0)
    setConnectionResult(null)
    setSchemaData([])
    setSaved(false)
    setCreatedId(null)
    form.resetFields()
    onClose()
  }

  const toggleTableIncluded = (index, checked) => {
    const updated = [...schemaData]
    updated[index] = { ...updated[index], is_included: checked }
    setSchemaData(updated)
  }

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <DatabaseOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
            <Title level={4}>PostgreSQL</Title>
            <Text type="secondary">Connect to any PostgreSQL database</Text>
          </div>
        )

      case 1:
        return (
          <Form form={form} layout="vertical" initialValues={{ port: 5432 }}>
            <Form.Item
              name="name"
              label="Datasource Name"
              rules={[{ required: true, message: 'Enter a name' }]}
            >
              <Input placeholder="e.g. my_database" />
            </Form.Item>
            <Space size={16}>
              <Form.Item
                name="host"
                label="Host"
                rules={[{ required: true, message: 'Required' }]}
                style={{ flex: 2 }}
              >
                <Input placeholder="localhost" />
              </Form.Item>
              <Form.Item
                name="port"
                label="Port"
                rules={[{ required: true }]}
                style={{ flex: 1 }}
              >
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>
            </Space>
            <Form.Item
              name="database_name"
              label="Database"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="my_database" />
            </Form.Item>
            <Space size={16}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Required' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="postgres" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Required' }]}
                style={{ flex: 1 }}
              >
                <Input.Password placeholder="password" />
              </Form.Item>
            </Space>
          </Form>
        )

      case 2:
        return (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            {connecting ? (
              <Spin tip="Testing connection..." />
            ) : connectionResult?.success ? (
              <Result
                status="success"
                title="Connection Successful"
                subTitle="The database is reachable"
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            ) : connectionResult ? (
              <Result
                status="error"
                title="Connection Failed"
                subTitle={connectionResult.message}
                icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              />
            ) : (
              <Text type="secondary">Click "Next" to test the connection</Text>
            )}
          </div>
        )

      case 3:
        return (
          <div>
            {introspecting ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <Spin tip="Introspecting schema..." />
              </div>
            ) : (
              <Table
                dataSource={schemaData.map((t, i) => ({ ...t, key: i }))}
                columns={[
                  {
                    title: 'Table',
                    dataIndex: 'table_name',
                    key: 'table_name',
                  },
                  {
                    title: 'Columns',
                    key: 'columns',
                    render: (_, record) => record.columns?.length || 0,
                  },
                  {
                    title: 'Rows',
                    dataIndex: 'row_count',
                    key: 'row_count',
                    render: (val) => val?.toLocaleString() || '0',
                  },
                  {
                    title: 'Include',
                    key: 'is_included',
                    render: (_, record, index) => (
                      <Switch
                        defaultChecked={record.is_included !== false}
                        onChange={(checked) => toggleTableIncluded(index, checked)}
                      />
                    ),
                  },
                ]}
                pagination={false}
                size="small"
              />
            )}
          </div>
        )

      case 4:
        return saved ? (
          <Result
            status="success"
            title="Datasource Saved"
            subTitle="You can now use this datasource for queries"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <DatabaseOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4}>Ready to Save</Title>
            <Text type="secondary">
              {schemaData.length} tables will be saved to the schema catalog
            </Text>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Modal
      title="Add Datasource"
      open={open}
      onCancel={handleClose}
      width={720}
      footer={
        saved ? (
          <Button type="primary" onClick={handleClose}>
            Done
          </Button>
        ) : (
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            {current > 0 && current < 4 && (
              <Button onClick={() => setCurrent((prev) => prev - 1)}>
                Back
              </Button>
            )}
            <Button
              type="primary"
              onClick={handleNext}
              loading={connecting || introspecting || saving}
              disabled={saved}
            >
              {current === 2 ? 'Test Connection' :
               current === 3 ? 'Introspect & Create' :
               current === 4 ? 'Save' : 'Next'}
            </Button>
          </Space>
        )
      }
    >
      <Steps current={current} items={steps} style={{ marginBottom: 24 }} />
      {renderStepContent()}
    </Modal>
  )
}

export default DatasourceWizard
