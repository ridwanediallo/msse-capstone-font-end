import { useEffect } from 'react'
import { ConfigProvider, theme as antdTheme } from 'antd'
import useThemeStore, { THEME_STORAGE_KEY } from '../stores/useThemeStore'

const FONT = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontFamilyCode: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
}

const lightTokens = {
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
  ...FONT,
}

const darkTokens = {
  ...lightTokens,
  colorPrimary: '#818cf8',
  colorInfo: '#818cf8',
  colorSuccess: '#2dd4bf',
  colorWarning: '#fbbf24',
  colorError: '#f87171',
  colorBgLayout: '#0e0e12',
  colorBgContainer: '#17171d',
  colorBgElevated: '#1e1e25',
  colorBgContainerDisabled: '#1f1f26',
  colorText: '#ececf1',
  colorTextSecondary: '#a3a3ab',
  colorTextTertiary: '#6d6d76',
  colorBorder: '#2a2a33',
  colorBorderSecondary: '#26262e',
}

const lightComponents = {
  Button: {
    defaultBorderColor: '#e7e5e4',
    defaultShadow: 'none',
    primaryShadow: 'none',
  },
  Card: { boxShadow: 'none' },
  Table: { headerBg: '#f7f6f4', rowHoverBg: '#f5f5ff' },
}

const darkComponents = {
  Button: {
    defaultBorderColor: '#2a2a33',
    defaultShadow: 'none',
    primaryShadow: 'none',
  },
  Card: { boxShadow: 'none' },
  Table: { headerBg: '#1b1b22', rowHoverBg: '#1f1f28' },
}

function ThemeProvider({ children }) {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Follow the OS scheme until the user explicitly chooses a mode.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    if (localStorage.getItem(THEME_STORAGE_KEY)) return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme, setTheme])

  const isDark = theme === 'dark'

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: isDark ? darkTokens : lightTokens,
        components: isDark ? darkComponents : lightComponents,
      }}
    >
      {children}
    </ConfigProvider>
  )
}

export default ThemeProvider