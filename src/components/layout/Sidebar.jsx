import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import useQueryStore from '../../stores/useQueryStore'
import useDatasourceStore from '../../stores/useDatasourceStore'
import SidebarShell from './SidebarShell'

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
    <SidebarShell
      actionIcon={<PlusOutlined style={{ fontSize: 12 }} />}
      actionLabel="New session"
      onAction={handleNewSession}
      sectionLabel="RECENT"
    >
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
    </SidebarShell>
  )
}

export default Sidebar
