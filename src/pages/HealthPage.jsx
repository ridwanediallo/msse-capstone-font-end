import { useEffect } from 'react'
import { Card, Layout, Tag, Spin, Button, Typography } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import useHealthStore from '../stores/useHealthStore'

const { Header, Content } = Layout
const { Title, Text } = Typography

function HealthPage() {
  const { status, loading, error, fetchHealth } = useHealthStore()

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={3} style={{ margin: 0 }}>MSSE Capstone</Title>
      </Header>
      <Content style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
        <Card
          title="API Health Status"
          extra={
            <Button icon={<ReloadOutlined />} onClick={fetchHealth} loading={loading}>
              Refresh
            </Button>
          }
          style={{ width: 480 }}
        >
          {loading && <Spin style={{ display: 'block', textAlign: 'center', padding: 24 }} />}
          {error && (
            <div style={{ textAlign: 'center' }}>
              <CloseCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
              <div style={{ marginTop: 16 }}>
                <Tag color="error">ERROR</Tag>
              </div>
              <Text type="danger" style={{ display: 'block', marginTop: 8 }}>{error}</Text>
            </div>
          )}
          {status && !loading && (
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <div style={{ marginTop: 16 }}>
                <Tag color="success">HEALTHY</Tag>
              </div>
              <pre style={{ textAlign: 'left', marginTop: 16, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                {JSON.stringify(status, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  )
}

export default HealthPage
