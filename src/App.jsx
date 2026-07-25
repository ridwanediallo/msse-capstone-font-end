import { useState } from 'react'
import { Layout, Menu, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import QueryPage from './pages/QueryPage'

const { Header, Content } = Layout
const { Title } = Typography

const menuItems = [
  {
    key: 'query',
    icon: <SearchOutlined />,
    label: 'Query',
  },
]

function App() {
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
        <Title level={3} style={{ margin: 0 }}>
          MSSE Capstone
        </Title>
      </Header>
      <Content style={{ padding: '48px 24px' }}>
        <QueryPage />
      </Content>
    </Layout>
  )
}

export default App
