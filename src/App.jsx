import { useState } from 'react'
import { Layout, Menu, Typography } from 'antd'
import { HealthCheckOutlined, SearchOutlined } from '@ant-design/icons'
import HealthPage from './pages/HealthPage'
import QueryPage from './pages/QueryPage'

const { Header, Content } = Layout
const { Title } = Typography

const menuItems = [
  {
    key: 'health',
    icon: <HealthCheckOutlined />,
    label: 'Health',
  },
  {
    key: 'query',
    icon: <SearchOutlined />,
    label: 'Query',
  },
]

function App() {
  const [currentPage, setCurrentPage] = useState('health')

  const renderPage = () => {
    switch (currentPage) {
      case 'query':
        return <QueryPage />
      case 'health':
      default:
        return <HealthPage />
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
        }}
      >
        <Title level={3} style={{ margin: 0, marginRight: 48, whiteSpace: 'nowrap' }}>
          MSSE Capstone
        </Title>
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={({ key }) => setCurrentPage(key)}
          style={{ flex: 1, borderBottom: 'none' }}
        />
      </Header>
      <Content style={{ padding: '48px 24px' }}>
        {renderPage()}
      </Content>
    </Layout>
  )
}

export default App
