import { useRef, useState } from 'react';
import {
  Modal,
  Steps,
  Form,
  Input,
  InputNumber,
  Button,
  Result,
  Table,
  Typography,
  Space,
  Switch,
  message,
  Spin,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined,
  DatabaseOutlined,
  FormOutlined,
  SaveOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import useDatasourceStore from '../stores/useDatasourceStore';

const { Title, Text } = Typography;

const steps = [
  { title: 'DB Type', icon: <DatabaseOutlined /> },
  { title: 'Credentials', icon: <FormOutlined /> },
  { title: 'Test', icon: <ApiOutlined /> },
  { title: 'Review Schema', icon: <FormOutlined /> },
  { title: 'Save', icon: <SaveOutlined /> },
];

function DatasourceWizard({ open, onClose }) {
  const {
    testConnection,
    createDatasource,
    introspectSchema,
    fetchDatasources,
    updateSchemaEntry,
  } = useDatasourceStore();

  const [current, setCurrent] = useState(0);
  const [dbType] = useState('postgresql');
  const [connecting, setConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);
  const [schemaData, setSchemaData] = useState([]);
  const [introspecting, setIntrospecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [stepError, setStepError] = useState(null);

  const [form] = Form.useForm();
  const formValues = useRef(null);

  const handleNext = async () => {
    if (current === 1) {
      try {
        await form.validateFields();
        const values = form.getFieldsValue();
        formValues.current = values;
        setCurrent((prev) => prev + 1);
      } catch {
        return;
      }
      return;
    }

    if (current === 2) {
      await handleTestConnection();
      return;
    }

    if (current === 3) {
      if (schemaData.length > 0) {
        setCurrent((prev) => prev + 1);
      } else {
        await handleIntrospect();
      }
      return;
    }

    if (current === 4) {
      await handleSave();
      return;
    }

    setCurrent((prev) => prev + 1);
  };

  const handleTestConnection = async () => {
    setStepError(null);
    setConnecting(true);
    setConnectionResult(null);

    const values = formValues.current;
    if (!values) {
      message.error('Please fill in credentials first');
      setCurrent(1);
      setConnecting(false);
      return;
    }

    try {
      const result = await testConnection({
        host: values.host,
        port: values.port,
        database_name: values.database_name,
        username: values.username,
        password: values.password || '',
      });
      setConnectionResult(result);

      if (result.success) {
        setStepError(null);
        setCurrent((prev) => prev + 1);
      } else {
        const errMsg = result.message || result.error || 'Connection failed';
        setConnectionResult({ success: false, message: errMsg });
        setStepError(errMsg);
      }
    } catch (err) {
      message.error('Network error: ' + err.message);
      setConnectionResult({ success: false, message: err.message });
    } finally {
      setConnecting(false);
    }
  };

  const handleIntrospect = async () => {
    setStepError(null);
    setIntrospecting(true);
    const values = formValues.current;

    if (!values) {
      setStepError('No credentials found. Please start over.');
      setCurrent(1);
      setIntrospecting(false);
      return;
    }

    // First create the datasource so we can introspect
    const result = await createDatasource({
      name: values.name,
      db_type: dbType,
      host: values.host,
      port: values.port,
      database_name: values.database_name,
      username: values.username,
      password: values.password || '',
    });

    if (result.ok) {
      setCreatedId(result.data.id);
      const introspectResult = await introspectSchema(result.data.id);
      if (introspectResult.ok) {
        setSchemaData(introspectResult.data);
        setStepError(null);
      } else {
        setStepError(introspectResult.error);
      }
    } else {
      setStepError(result.error);
    }
    setIntrospecting(false);
  };

  const handleSave = async () => {
    setStepError(null);
    setSaving(true);
    try {
      // Persist curation (ADR-0006): excluded tables and descriptions feed
      // the pipeline's prompts and define the Guardian allowlist. Entries
      // left at their defaults need no request — the backend defaults
      // is_included to true on introspection.
      const curated = schemaData.filter(
        (t) => t.is_included === false || (t.description || '').trim()
      );
      for (const entry of curated) {
        const result = await updateSchemaEntry(createdId, entry.id, {
          is_included: entry.is_included !== false,
          ...(entry.description ? { description: entry.description } : {}),
        });
        if (!result.ok) throw new Error(result.error);
      }
      await fetchDatasources();
      setSaved(true);
    } catch (err) {
      setStepError('Could not save schema settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setCurrent(0);
    setStepError(null);
    setConnectionResult(null);
    setSchemaData([]);
    setSaved(false);
    setCreatedId(null);
    formValues.current = null;
    form.resetFields();
    onClose();
  };

  const toggleTableIncluded = (index, checked) => {
    const updated = [...schemaData];
    updated[index] = { ...updated[index], is_included: checked };
    setSchemaData(updated);
  };

  const setTableDescription = (index, description) => {
    const updated = [...schemaData];
    updated[index] = { ...updated[index], description };
    setSchemaData(updated);
  };

  const renderStepContent = () => {
    const errorAlert = stepError ? (
      <div style={{ marginBottom: 16, padding: '8px 16px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 6, color: '#cf1322' }}>
        <WarningOutlined style={{ marginRight: 8 }} />
        {stepError}
      </div>
    ) : null;

    return (
      <>
        {errorAlert}
        {renderStep()}
      </>
    );
  };

  const renderStep = () => {
    switch (current) {
      case 0:
        return (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <DatabaseOutlined
              style={{ fontSize: 48, color: 'var(--accent)', marginBottom: 16 }}
            />
            <Title level={4}>PostgreSQL</Title>
            <Text type="secondary">Connect to any PostgreSQL database</Text>
          </div>
        );

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
              <Form.Item name="password" label="Password" style={{ flex: 1 }}>
                <Input.Password placeholder="(leave empty for trust auth)" />
              </Form.Item>
            </Space>
          </Form>
        );

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
                subTitle={connectionResult.message || connectionResult.error || 'Unknown error'}
                icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              />
            ) : (
              <Text type="secondary">Click "Next" to test the connection</Text>
            )}
          </div>
        );

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
                    title: 'Description (helps the AI)',
                    key: 'description',
                    render: (_, record, index) => (
                      <Input
                        size="small"
                        placeholder="e.g. customer master list"
                        value={record.description || ''}
                        onChange={(e) =>
                          setTableDescription(index, e.target.value)
                        }
                        aria-label={`Description for ${record.table_name}`}
                      />
                    ),
                  },
                  {
                    title: 'Include',
                    key: 'is_included',
                    render: (_, record, index) => (
                      <Switch
                        checked={record.is_included !== false}
                        onChange={(checked) =>
                          toggleTableIncluded(index, checked)
                        }
                        aria-label={`Include ${record.table_name}`}
                      />
                    ),
                  },
                ]}
                pagination={false}
                size="small"
              />
            )}
          </div>
        );

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
            <DatabaseOutlined
              style={{ fontSize: 48, color: 'var(--teal)', marginBottom: 16 }}
            />
            <Title level={4}>Ready to Save</Title>
            <Text type="secondary">
              {schemaData.length} tables will be saved to the schema catalog
            </Text>
            {schemaData.some((t) => t.is_included === false) && (
              <div style={{ marginTop: 8 }}>
                <WarningOutlined style={{ color: '#faad14', marginRight: 6 }} />
                <Text type="warning">
                  Excluded tables are hidden from the AI and cannot be queried
                </Text>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

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
              <Button onClick={() => { setStepError(null); setCurrent((prev) => prev - 1); }}>
                Back
              </Button>
            )}
            <Button
              type="primary"
              onClick={handleNext}
              loading={connecting || introspecting || saving}
              disabled={saved}
            >
              {current === 2
                ? 'Test Connection'
                : current === 3
                  ? schemaData.length > 0 ? 'Next' : 'Introspect & Create'
                  : current === 4
                    ? 'Save'
                    : 'Next'}
            </Button>
          </Space>
        )
      }
    >
      <Steps current={current} items={steps} style={{ marginBottom: 24 }} />
      {renderStepContent()}
    </Modal>
  );
}

export default DatasourceWizard;
