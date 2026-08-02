import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Dropdown, Drawer, List, Popconfirm, Typography, Empty } from 'antd'
import {
  DatabaseOutlined, HistoryOutlined, SettingOutlined,
  DeleteOutlined, DownOutlined,
} from '@ant-design/icons'
import useDatasourceStore from '../stores/useDatasourceStore'
import useQueryStore from '../stores/useQueryStore'

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

  useEffect(() => {
    fetchDatasources()
  }, [fetchDatasources])

  // Default to the first datasource when none is selected yet
  useEffect(() => {
    if (!selectedDatasourceId && datasources.length > 0) {
      selectDatasource(datasources[0].id)
    }
  }, [datasources, selectedDatasourceId, selectDatasource])

  const selected =
    datasources.find((d) => d.id === selectedDatasourceId) || datasources[0]

  const menuItems = [
    ...datasources.map((d) => ({
      key: d.id,
      label: d.name,
      icon: <DatabaseOutlined />,
      onClick: () => {
        selectDatasource(d.id)
        newConversation()
        fetchConversations()
      },
    })),
    { type: 'divider' },
    {
      key: 'manage',
      label: 'Manage data sources',
      icon: <SettingOutlined />,
      onClick: () => navigate('/datasources'),
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

      <div style={{ display: 'flex', gap: 8 }}>
        <Button icon={<HistoryOutlined />} onClick={openHistory}>
          History
        </Button>
        <Button
          icon={<DatabaseOutlined />}
          onClick={() => navigate('/datasources')}
          title="Data sources"
        />
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
