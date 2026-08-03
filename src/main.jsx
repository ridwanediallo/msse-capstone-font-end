import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from './App.jsx'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/fraunces/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          colorInfo: '#4f46e5',
          colorSuccess: '#0d9488',
          colorWarning: '#f59e0b',
          colorError: '#dc2626',
          borderRadius: 8,
          colorBgLayout: '#fdfdfc',
          colorText: '#1c1917',
          colorTextSecondary: '#78716c',
          colorTextTertiary: '#a8a29e',
          colorBorder: '#e7e5e4',
          colorBorderSecondary: '#e7e5e4',
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          fontFamilyCode: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
        },
        components: {
          Button: {
            defaultBorderColor: '#e7e5e4',
            defaultShadow: 'none',
            primaryShadow: 'none',
          },
          Card: {
            boxShadow: 'none',
          },
          Table: {
            headerBg: '#f7f6f4',
            rowHoverBg: '#f5f5ff',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
