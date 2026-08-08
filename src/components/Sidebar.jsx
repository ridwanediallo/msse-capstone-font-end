import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Popover } from 'antd'
import { PlusOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons'
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

  const handleSignOut = async () => {
    await logout()
    navigate('/')
  }

  const recents = conversations.slice(0, MAX_RECENTS)

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

      <div className="sidebar-footer">
        <Popover
          trigger="click"
          placement="bottom"
          arrow={false}
          overlayClassName="sidebar-user-popover"
          content={
            user ? (
              <div className="sidebar-user-popover-body">
                <div className="sidebar-user-popover-name">
                  {user.name || user.email}
                </div>
                <div className="sidebar-user-popover-email">{user.email}</div>
                {user.role && (
                  <div className="sidebar-user-popover-role">
                    <span className="sidebar-role-tag">{user.role}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="sidebar-user-popover-action"
                  onClick={handleSignOut}
                >
                  <LogoutOutlined /> Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="sidebar-user-popover-action"
                onClick={() => navigate('/login')}
              >
                <LoginOutlined /> Sign in
              </button>
            )
          }
        >
          <button
            type="button"
            className="sidebar-user-trigger"
            title={user ? user.email : 'Guest'}
          >
            <div className="sidebar-avatar">
              {user ? initials(user.name, user.email) : 'G'}
            </div>
            <span className="sidebar-username">
              {user ? user.name || user.email : 'Guest'}
            </span>
          </button>
        </Popover>
      </div>
    </aside>
  )
}

export default Sidebar
