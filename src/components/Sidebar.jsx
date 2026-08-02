import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import useQueryStore from '../stores/useQueryStore'
import useDatasourceStore from '../stores/useDatasourceStore'

const MAX_RECENTS = 10

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    conversations, fetchConversations, loadConversation,
    newConversation, conversationId, loading,
  } = useQueryStore()
  const selectedDatasourceId = useDatasourceStore((s) => s.selectedDatasourceId)

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
        <div className="sidebar-avatar">RS</div>
        <span className="sidebar-username">Rid</span>
      </div>
    </aside>
  )
}

export default Sidebar
