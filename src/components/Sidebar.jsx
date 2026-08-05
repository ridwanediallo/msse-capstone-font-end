import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Popover, Avatar } from 'antd'
import { PlusOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons'
import useQueryStore from '../stores/useQueryStore'
import useDatasourceStore from '../stores/useDatasourceStore'
import useAuthStore from '../stores/useAuthStore'
import { initials } from '../initials'

const MAX_RECENTS = 10

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [accountOpen, setAccountOpen] = useState(false)
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

  const handleSignOut = () => {
    setAccountOpen(false)
    logout()
    navigate('/')
  }

  const handleSignIn = () => {
    setAccountOpen(false)
    navigate('/login')
  }

  const accountContent = (
    <div className="account-pop">
      <div className="account-pop-header">
        <Avatar className="account-pop-avatar">
          {user ? initials(user.name, user.email) : 'G'}
        </Avatar>
        <div className="account-pop-meta">
          <div className="account-pop-name">
            {user ? user.name || user.email : 'Guest'}
          </div>
          {user && (
            <>
              <div className="account-pop-sub">{user.email}</div>
              <div className="account-pop-role">{user.role}</div>
            </>
          )}
        </div>
      </div>
      <div className="account-pop-actions">
        {user ? (
          <button className="account-pop-action" onClick={handleSignOut}>
            <LogoutOutlined /> Sign out
          </button>
        ) : (
          <button className="account-pop-action" onClick={handleSignIn}>
            <LoginOutlined /> Sign in
          </button>
        )}
      </div>
    </div>
  )

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

      <Popover
        content={accountContent}
        trigger="click"
        open={accountOpen}
        onOpenChange={setAccountOpen}
        placement="topLeft"
        arrow={false}
        overlayClassName="account-popover"
      >
        <button className="sidebar-footer" title={user ? user.email : 'Guest'}>
          <Avatar size="small" className="sidebar-avatar">
            {user ? initials(user.name, user.email) : 'G'}
          </Avatar>
          <span className="sidebar-username">
            {user ? user.name || user.email : 'Guest'}
          </span>
        </button>
      </Popover>
    </aside>
  )
}

export default Sidebar
