import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          colorInfo: '#3b82f6',
          borderRadius: 8,
          colorBgLayout: '#ffffff',
          colorText: '#1f2328',
          colorTextSecondary: '#6b7280',
          colorBorder: '#e2e2e0',
          colorBorderSecondary: '#ececea',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Button: {
            defaultBorderColor: '#e2e2e0',
            defaultShadow: 'none',
            primaryShadow: 'none',
          },
          Card: {
            boxShadow: 'none',
          },
          Table: {
            headerBg: '#fafaf9',
            rowHoverBg: '#f5f8ff',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
