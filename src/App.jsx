import { Layout, Typography } from 'antd'

import { DatabaseOutlined } from '@ant-design/icons'
import QueryPage from './pages/QueryPage'

const { Header, Content } = Layout
const { Text } = Typography

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #001529 0%, #003a8c 100%)',
          padding: '0 32px',
          height: 72,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        <DatabaseOutlined
          style={{ fontSize: 24, color: '#fff', marginRight: 12 }}
        />
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>
          Natural Language to SQL
        </Text>
      </Header>
      <Content style={{ padding: '48px 24px' }}>
        <QueryPage />
      </Content>
    </Layout>
  )
}

export default App
