import { useRef, useState, useEffect } from 'react';
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
import useDatasourceStore from '../../stores/useDatasourceStore';

const { Title, Text } = Typography;

const createSteps = [
  { title: 'DB Type', icon: <DatabaseOutlined /> },
  { title: 'Credentials', icon: <FormOutlined /> },
  { title: 'Test', icon: <ApiOutlined /> },
  { title: 'Review Schema', icon: <FormOutlined /> },
  { title: 'Save', icon: <SaveOutlined /> },
];

const editSteps = [
  { title: 'Credentials', icon: <FormOutlined /> },
  { title: 'Test', icon: <ApiOutlined /> },
  { title: 'Review Schema', icon: <FormOutlined /> },
  { title: 'Save', icon: <SaveOutlined /> },
];

function DatasourceWizard({ open, onClose, datasource }) {
  const editMode = !!datasource;

  const {
    testConnection,
    createDatasource,
    updateDatasource,
    introspectSchema,
    deleteDatasource,
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
  const [fieldsChanged, setFieldsChanged] = useState(false);

  const [form] = Form.useForm();
  const formValues = useRef(null);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (editMode && open) {
      form.setFieldsValue({
        name: datasource.name,
        host: datasource.host,
        port: datasource.port,
        database_name: datasource.database_name,
        username: datasource.username,
        password: '',
      });
      setFieldsChanged(false);
    }
  }, [editMode, open, datasource, form]);

  const activeSteps = editMode ? editSteps : createSteps;

  const handleNext = async () => {
    // Map current step index to the right handler
    const stepKey = editMode
      ? ['credentials', 'test', 'schema', 'save'][current]
      : ['dbtype', 'credentials', 'test', 'schema', 'save'][current];

    if (stepKey === 'dbtype') {
      setCurrent((prev) => prev + 1);
      return;
    }

    if (stepKey === 'credentials') {
      try {
        await form.validateFields();
        const values = form.getFieldsValue();
        formValues.current = values;

        // Track whether any editable field changed (edit mode)
        if (editMode) {
          const changed =
            values.name !== datasource.name ||
            values.host !== datasource.host ||
            values.port !== datasource.port ||
            values.database_name !== datasource.database_name ||
            values.username !== datasource.username ||
            (values.password && values.password.length > 0);
          setFieldsChanged(changed);
        }

        setCurrent((prev) => prev + 1);
      } catch {
        return;
      }
      return;
    }

    if (stepKey === 'test') {
      await handleTestConnection();
      return;
    }

    if (stepKey === 'schema') {
      if (schemaData.length > 0) {
        setCurrent((prev) => prev + 1);
      } else {
        await handleIntrospect();
      }
      return;
    }

    if (stepKey === 'save') {
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
      setCurrent(editMode ? 0 : 1);
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
      setCurrent(editMode ? 0 : 1);
      setIntrospecting(false);
      return;
    }

    if (editMode) {
      // Edit mode: update fields if changed, then re-introspect
      if (fieldsChanged) {
        const updatePayload = {
          name: values.name,
          host: values.host,
          port: values.port,
          database_name: values.database_name,
          username: values.username,
        };
        if (values.password) {
          updatePayload.password = values.password;
        }
        const updateResult = await updateDatasource(datasource.id, updatePayload);
        if (!updateResult.ok) {
          setStepError(updateResult.error);
          setIntrospecting(false);
          return;
        }
      }

      const introspectResult = await introspectSchema(datasource.id);
      if (introspectResult.ok) {
        setSchemaData(introspectResult.data);
        setCreatedId(datasource.id);
        setStepError(null);
      } else {
        setStepError(introspectResult.error);
      }
    } else {
      // Create mode: create the datasource first, then introspect
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
          try {
            await deleteDatasource(result.data.id);
          } catch {
            // Delete failed — user may need to remove it manually
          }
          setCreatedId(null);
          setStepError(introspectResult.error);
        }
      } else {
        setStepError(result.error);
      }
    }
    setIntrospecting(false);
  };

  const handleSave = async () => {
    setStepError(null);
    setSaving(true);
    try {
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
    setFieldsChanged(false);
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
      <div style={{ marginBottom: 16, padding: '8px 16px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', color: 'var(--danger)' }}>
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
    // In edit mode, step 0 = credentials; in create mode, step 0 = DB type
    const isStep = (label) => {
      if (editMode) {
        return (label === 'credentials' && current === 0)
          || (label === 'test' && current === 1)
          || (label === 'schema' && current === 2)
          || (label === 'save' && current === 3);
      }
      return (label === 'dbtype' && current === 0)
        || (label === 'credentials' && current === 1)
        || (label === 'test' && current === 2)
        || (label === 'schema' && current === 3)
        || (label === 'save' && current === 4);
    };

    if (isStep('dbtype')) {
      return (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <DatabaseOutlined
            style={{ fontSize: 48, color: 'var(--accent)', marginBottom: 16 }}
          />
          <Title level={4}>PostgreSQL</Title>
          <Text type="secondary">Connect to any PostgreSQL database</Text>
        </div>
      );
    }

    if (isStep('credentials')) {
      return (
        <Form form={form} layout="vertical" initialValues={{ port: 5432 }}>
          <Form.Item
            name="name"
            label="Datasource Name"
            rules={[{ required: true, message: 'Enter a name' }]}
          >
            <Input placeholder="e.g. my_database" size="large" />
          </Form.Item>
          <Space size={16}>
            <Form.Item
              name="host"
              label="Host"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 2 }}
            >
              <Input placeholder="localhost" size="large" />
            </Form.Item>
            <Form.Item
              name="port"
              label="Port"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} max={65535} style={{ width: '100%' }} size="large" />
            </Form.Item>
          </Space>
          <Form.Item
            name="database_name"
            label="Database"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="my_database" size="large" />
          </Form.Item>
          <Space size={16}>
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Required' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="postgres" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Password" style={{ flex: 1 }}>
              <Input.Password
                placeholder={editMode ? 'Leave blank to keep current' : '(leave empty for trust auth)'}
                size="large"
              />
            </Form.Item>
          </Space>
        </Form>
      );
    }

    if (isStep('test')) {
      return (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          {connecting ? (
            <Spin tip="Testing connection..." />
          ) : connectionResult?.success ? (
            <Result
              status="success"
              title="Connection Successful"
              subTitle="The database is reachable"
              icon={<CheckCircleOutlined style={{ color: 'var(--green)' }} />}
            />
          ) : connectionResult ? (
            <Result
              status="error"
              title="Connection Failed"
              subTitle={connectionResult.message || connectionResult.error || 'Unknown error'}
              icon={<CloseCircleOutlined style={{ color: 'var(--danger)' }} />}
            />
          ) : (
            <Text type="secondary">Click "Next" to test the connection</Text>
          )}
        </div>
      );
    }

    if (isStep('schema')) {
      return (
        <div>
          {introspecting ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Spin tip={editMode ? 'Re-introspecting schema...' : 'Introspecting schema...'} />
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
    }

    if (isStep('save')) {
      return saved ? (
        <Result
          status="success"
          title={editMode ? 'Datasource Updated' : 'Datasource Saved'}
          subTitle="You can now use this datasource for queries"
          icon={<CheckCircleOutlined style={{ color: 'var(--green)' }} />}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <DatabaseOutlined
            style={{ fontSize: 48, color: 'var(--teal)', marginBottom: 16 }}
          />
          <Title level={4}>Ready to {editMode ? 'Update' : 'Save'}</Title>
          <Text type="secondary">
            {schemaData.length} tables will be saved to the schema catalog
          </Text>
          {schemaData.some((t) => t.is_included === false) && (
            <div style={{ marginTop: 8 }}>
              <WarningOutlined style={{ color: 'var(--warning)', marginRight: 6 }} />
              <Text type="warning">
                Excluded tables are hidden from the AI and cannot be queried
              </Text>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Determine the next button label
  const getNextLabel = () => {
    const stepKey = editMode
      ? ['credentials', 'test', 'schema', 'save'][current]
      : ['dbtype', 'credentials', 'test', 'schema', 'save'][current];

    if (stepKey === 'test') return 'Test Connection';
    if (stepKey === 'schema') return schemaData.length > 0 ? 'Next' : editMode ? 'Re-introspect & Review' : 'Introspect & Create';
    if (stepKey === 'save') return editMode ? 'Update' : 'Save';
    return 'Next';
  };

  const lastStepIndex = editMode ? 3 : 4;

  return (
    <Modal
      title={editMode ? 'Edit Datasource' : 'Add Datasource'}
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
            {current > 0 && current < lastStepIndex && (
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
              {getNextLabel()}
            </Button>
          </Space>
        )
      }
    >
      <Steps current={current} items={activeSteps} style={{ marginBottom: 24 }} />
      {renderStepContent()}
    </Modal>
  );
}

export default DatasourceWizard;
