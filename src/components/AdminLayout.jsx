import { Spin } from 'antd'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import useAuthStore from '../stores/useAuthStore'
import UserFooter from './UserFooter'

const NAV_ITEMS = [
  { to: '/admin/users', label: 'Users', icon: <TeamOutlined /> },
  { to: '/admin/datasources', label: 'Datasource access', icon: <DatabaseOutlined /> },
  { to: '/admin/audit-log', label: 'Audit log', icon: <FileTextOutlined /> },
]

function AdminLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return <div className="app-loading"><Spin size="large" /></div>
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">Q</div>
          <span className="sidebar-brand-name">Queryable</span>
        </div>

        <button type="button" className="sidebar-new-session" onClick={() => navigate('/')}>
          <ArrowLeftOutlined style={{ fontSize: 12 }} />
          Back to app
        </button>

        <div className="sidebar-section-label">ADMIN CONSOLE</div>

        <nav className="sidebar-recents">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                'sidebar-recent-item admin-nav-item' + (isActive ? ' active' : '')
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <UserFooter />
      </aside>

      <div className="app-main">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
