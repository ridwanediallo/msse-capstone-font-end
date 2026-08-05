import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Dropdown, Avatar } from 'antd'
import {
  PlusOutlined, LogoutOutlined, LoginOutlined, DownOutlined,
} from '@ant-design/icons'
import useQueryStore from '../stores/useQueryStore'
import useDatasourceStore from '../stores/useDatasourceStore'
import useAuthStore from '../stores/useAuthStore'
import { initials } from '../initials'

const MAX_RECENTS = 10

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    conversations, fetchConversations, loadConversation,
    newConversation, conversationId, loading,
  } = useQueryStore()
  const selectedDatasourceId = useDatasourceStore((s) => s.selectedDatasourceId)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    fetchConversations()
    // Reload the scoped list whenever the selected datasource changes
  }, [selectedDatasourceId, fetchConversations])

  const handleNewSession = () => {
    newConversation()
    navigate('/')
  }

  const handleSelect = (id) => {
    if (loading) return
    loadConversation(id)
    navigate('/')
  }

  const recents = conversations.slice(0, MAX_RECENTS)

  const accountMenuItems = user
    ? [
        {
          key: 'identity',
          label: (
            <div style={{ padding: '4px 0' }}>
              <div style={{ fontWeight: 600 }}>{user.name || user.email}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                {user.email}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'capitalize' }}>
                {user.role}
              </div>
            </div>
          ),
          disabled: true,
        },
        { type: 'divider' },
        {
          key: 'logout',
          label: 'Sign out',
          icon: <LogoutOutlined />,
          onClick: () => {
            logout()
            navigate('/')
          },
        },
      ]
    : [
        {
          key: 'login',
          label: 'Sign in',
          icon: <LoginOutlined />,
          onClick: () => navigate('/login'),
        },
      ]

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" onClick={handleNewSession}>
        <div className="sidebar-brand-icon">Q</div>
        <span className="sidebar-brand-name">Queryable</span>
      </div>

      <button className="sidebar-new-session" onClick={handleNewSession}>
        <PlusOutlined style={{ fontSize: 12 }} />
        New session
      </button>

      <div className="sidebar-section-label">RECENT</div>

      <div className="sidebar-recents">
        {recents.map((c) => (
          <button
            key={c.id}
            className={
              'sidebar-recent-item' +
              (c.id === conversationId && location.pathname === '/' ? ' active' : '')
            }
            title={c.title || 'Untitled session'}
            onClick={() => handleSelect(c.id)}
          >
            {c.title || 'Untitled session'}
          </button>
        ))}
        {recents.length === 0 && (
          <span style={{ fontSize: 13, color: 'var(--text-faint)', padding: '4px 12px' }}>
            No sessions yet
          </span>
        )}
      </div>

      <Dropdown menu={{ items: accountMenuItems }} trigger={['click']} placement="topRight">
        <button className="sidebar-footer" title={user ? user.email : 'Guest'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar size="small" className="sidebar-avatar">
              {user ? initials(user.name, user.email) : 'G'}
            </Avatar>
            <span className="sidebar-username">
              {user ? user.name || user.email : 'Guest'}
            </span>
          </div>
          <DownOutlined style={{ fontSize: 10, color: 'var(--text-faint)' }} />
        </button>
      </Dropdown>
    </aside>
  )
}

export default Sidebar
