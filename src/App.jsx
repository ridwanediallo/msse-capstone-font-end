import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import QueryPage from './pages/QueryPage'
import DatasourcePage from './pages/DatasourcePage'
import LoginPage from './pages/LoginPage'
import useAuthStore from './stores/useAuthStore'

function RequireAdmin({ children }) {
  const user = useAuthStore((s) => s.user)
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return children
}

function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const loading = useAuthStore((s) => s.loading)

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  if (loading) {
    return (
      <div className="app-loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <TopBar />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<QueryPage />} />
            <Route
              path="/datasources"
              element={
                <RequireAdmin>
                  <DatasourcePage />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
