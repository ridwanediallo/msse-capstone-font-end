import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Typography, Menu } from 'antd'
import { DatabaseOutlined, SearchOutlined, ApiOutlined } from '@ant-design/icons'
import QueryPage from './pages/QueryPage'
import DatasourcePage from './pages/DatasourcePage'

const { Header, Content } = Layout
const { Text } = Typography

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <SearchOutlined />,
      label: 'Query',
    },
    {
      key: '/datasources',
      icon: <ApiOutlined />,
      label: 'Data Sources',
    },
  ]

  const selectedKey = location.pathname === '/datasources' ? '/datasources' : '/'

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
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 500, marginRight: 32 }}>
          Natural Language to SQL
        </Text>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, background: 'transparent', borderBottom: 'none' }}
        />
      </Header>
      <Content style={{ padding: '48px 24px' }}>
        <Routes>
          <Route path="/" element={<QueryPage />} />
          <Route path="/datasources" element={<DatasourcePage />} />
        </Routes>
      </Content>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
