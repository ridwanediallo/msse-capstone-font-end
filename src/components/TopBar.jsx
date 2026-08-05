import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Dropdown, Drawer, List, Popconfirm, Typography, Empty, Avatar } from 'antd'
import {
  DatabaseOutlined, HistoryOutlined, SettingOutlined,
  DeleteOutlined, DownOutlined, UserOutlined, LogoutOutlined, LoginOutlined,
} from '@ant-design/icons'
import useDatasourceStore from '../stores/useDatasourceStore'
import useQueryStore from '../stores/useQueryStore'
import useAuthStore from '../stores/useAuthStore'
import { initials } from '../initials'

const { Text } = Typography

function TopBar() {
  const navigate = useNavigate()
  const [historyOpen, setHistoryOpen] = useState(false)

  const {
    datasources, fetchDatasources, selectedDatasourceId, selectDatasource,
  } = useDatasourceStore()
  const {
    conversations, fetchConversations, loadConversation, deleteConversation,
    newConversation,
  } = useQueryStore()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchDatasources()
  }, [fetchDatasources])

  // Default to the first real datasource; fall back to the sample when it's
  // the only one available.
  useEffect(() => {
    if (!selectedDatasourceId && datasources.length > 0) {
      const preferred = datasources.find((d) => !d.is_sample) || datasources[0]
      selectDatasource(preferred.id)
    }
  }, [datasources, selectedDatasourceId, selectDatasource])

  const selected =
    datasources.find((d) => d.id === selectedDatasourceId) || datasources[0]

  const menuItems = [
    ...datasources.map((d) => ({
      key: d.id,
      label: (
        <>
          {d.name}
          {d.is_sample && <span className="sample-tag">Sample</span>}
        </>
      ),
      icon: <DatabaseOutlined />,
      onClick: () => {
        selectDatasource(d.id)
        newConversation()
        fetchConversations()
      },
    })),
    ...(isAdmin
      ? [
          { type: 'divider' },
          {
            key: 'manage',
            label: 'Manage data sources',
            icon: <SettingOutlined />,
            onClick: () => navigate('/datasources'),
          },
        ]
      : []),
  ]

  const userMenuItems = user
    ? [
        {
          key: 'identity',
          label: (
            <div style={{ padding: '4px 0' }}>
              <div style={{ fontWeight: 600 }}>{user.name || user.email}</div>
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

  const openHistory = () => {
    fetchConversations()
    setHistoryOpen(true)
  }

  return (
    <div className="topbar">
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <button className="datasource-pill">
          <span className={'datasource-dot' + (selected?.status === 'ready' ? '' : ' offline')} />
          {selected ? selected.name : 'No data source'}
          <DownOutlined style={{ fontSize: 10, color: 'var(--text-faint)' }} />
        </button>
      </Dropdown>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button icon={<HistoryOutlined />} onClick={openHistory}>
          History
        </Button>
        {isAdmin && (
          <Button
            icon={<DatabaseOutlined />}
            onClick={() => navigate('/datasources')}
            title="Data sources"
          />
        )}
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <button className="user-menu-btn" title={user ? user.email : 'Guest'}>
            <Avatar size="small" icon={<UserOutlined />} className="user-menu-avatar">
              {user ? initials(user.name, user.email) : null}
            </Avatar>
            <span className="user-menu-label">
              {user ? user.name || user.email : 'Guest'}
            </span>
            <DownOutlined style={{ fontSize: 10, color: 'var(--text-faint)' }} />
          </button>
        </Dropdown>
      </div>

      <Drawer
        title="History"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        width={380}
      >
        {conversations.length === 0 ? (
          <Empty description="No sessions yet" />
        ) : (
          <List
            dataSource={conversations}
            renderItem={(c) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  loadConversation(c.id)
                  navigate('/')
                  setHistoryOpen(false)
                }}
                actions={[
                  <Popconfirm
                    key="del"
                    title="Delete this session?"
                    onConfirm={(e) => {
                      e?.stopPropagation?.()
                      deleteConversation(c.id)
                    }}
                    onCancel={(e) => e?.stopPropagation?.()}
                  >
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={c.title || 'Untitled session'}
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {c.turn_count} turn{c.turn_count !== 1 ? 's' : ''} ·{' '}
                      {c.updated_at ? new Date(c.updated_at).toLocaleString() : ''}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </div>
  )
}

export default TopBar
