import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography } from 'antd'
import { SearchOutlined, DatabaseOutlined, BarChartOutlined } from '@ant-design/icons'
import QueryPage from './pages/QueryPage'
import DatasourcePage from './pages/DatasourcePage'

const { Sider, Content } = Layout
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
      icon: <DatabaseOutlined />,
      label: 'Data Sources',
    },
  ]

  const selectedKey = location.pathname === '/datasources' ? '/datasources' : '/'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="logo">
          <BarChartOutlined style={{ fontSize: 20, marginRight: 8 }} />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
            NL → SQL
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: 220 }}>
        <Content className="site-layout-content">
          <Routes>
            <Route path="/" element={<QueryPage />} />
            <Route path="/datasources" element={<DatasourcePage />} />
          </Routes>
        </Content>
      </Layout>
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
