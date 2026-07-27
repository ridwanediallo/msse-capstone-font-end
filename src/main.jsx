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
          colorPrimary: '#1677ff',
          borderRadius: 8,
          colorBgLayout: '#f0f2f5',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Layout: {
            siderBg: '#001529',
            bodyBg: '#f0f2f5',
          },
          Menu: {
            darkItemBg: '#001529',
            darkItemSelectedBg: '#1677ff',
            darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
          },
          Card: {
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
          },
          Table: {
            headerBg: '#fafafa',
            rowHoverBg: '#e6f7ff',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
