import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Spin } from 'antd'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import AdminLayout from './components/AdminLayout'
import ErrorBoundary from './components/ErrorBoundary'
import useAuthStore from './stores/useAuthStore'

const QueryPage = lazy(() => import('./pages/QueryPage'))
const DatasourcePage = lazy(() => import('./pages/DatasourcePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const AuditPage = lazy(() => import('./pages/AuditPage'))
const AcceptInvitePage = lazy(() => import('./pages/AcceptInvitePage'))

function AppShell({ authKey }) {
  return (
    <div className="app-shell" key={authKey}>
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <Outlet />
      </div>
    </div>
  )
}

function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const loading = useAuthStore((s) => s.loading)
  const user = useAuthStore((s) => s.user)
  const authKey = user?.id ? `user:${user.id}` : 'guest'

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
      <ErrorBoundary>
      <Suspense fallback={<div className="app-loading"><Spin size="large" /></div>}>
      <Routes>
        <Route path="/invite" element={<AcceptInvitePage />} />
        <Route path="/admin" element={<AdminLayout key={authKey} />}>
          <Route index element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="datasources" element={<DatasourcePage />} />
          <Route path="audit-log" element={<AuditPage />} />
        </Route>
        <Route element={<AppShell authKey={authKey} />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<QueryPage />} />
          <Route path="/datasources" element={<Navigate to="/admin/datasources" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
