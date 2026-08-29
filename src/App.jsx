import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
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
  const user = useAuthStore((s) => s.user)
  const guest = useAuthStore((s) => s.guest)
  const location = useLocation()

  // After bootstrap, if neither user nor guest exists, the session is invalid.
  // Redirect to /login unless already there.
  if (!user && !guest && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

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
      <Routes>
        <Route path="/invite" element={<Suspense fallback={<div className="app-loading"><Spin size="large" /></div>}><AcceptInvitePage /></Suspense>} />
        <Route path="/admin" element={<AdminLayout key={authKey} />}>
          <Route index element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<Suspense fallback={<div className="app-loading"><Spin size="large" /></div>}><UsersPage /></Suspense>} />
          <Route path="datasources" element={<Suspense fallback={<div className="app-loading"><Spin size="large" /></div>}><DatasourcePage /></Suspense>} />
          <Route path="audit-log" element={<Suspense fallback={<div className="app-loading"><Spin size="large" /></div>}><AuditPage /></Suspense>} />
        </Route>
        <Route element={<AppShell authKey={authKey} />}>
          <Route path="/login" element={<Suspense fallback={<div className="app-loading"><Spin size="large" /></div>}><LoginPage /></Suspense>} />
          <Route path="/" element={<Suspense fallback={<div className="app-loading"><Spin size="large" /></div>}><QueryPage /></Suspense>} />
          <Route path="/datasources" element={<Navigate to="/admin/datasources" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
