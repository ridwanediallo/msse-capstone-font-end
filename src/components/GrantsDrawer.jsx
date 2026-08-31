import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Divider, Drawer, Empty, Popconfirm, Select, Typography, message } from 'antd'
import { DeleteOutlined, UserAddOutlined } from '@ant-design/icons'
import useAdminStore from '../stores/useAdminStore'
import { friendlyError } from '../errors'
import { relativeTime } from '../lib/relativeTime'

const { Text } = Typography

function GrantsDrawer({ datasource, open, onClose }) {
  const {
    members, membersTotal, membersLoading, fetchMembers,
    grants, grantsLoading, grantsError, fetchGrants,
    grantDatasource, revokeGrant,
  } = useAdminStore()
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [granting, setGranting] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')

  const dsId = datasource?.id

  useEffect(() => {
    setSelectedUserId(null)
    setMemberSearch('')
    if (!open || !dsId) return
    fetchGrants(dsId)
    fetchMembers()
  }, [open, dsId, fetchGrants, fetchMembers])

  // Debounce member search: re-fetch from backend with query filter.
  const debounceRef = useRef(null)
  useEffect(() => {
    if (!open) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchMembers(memberSearch.trim())
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [memberSearch, open, fetchMembers])

  const grantedUserIds = useMemo(
    () => new Set(grants.map((g) => g.user_id)),
    [grants]
  )

  const memberOptions = useMemo(
    () =>
      members
        .filter((m) => !grantedUserIds.has(m.id))
        .map((m) => ({
          value: m.id,
          label: m.name ? `${m.name} (${m.email})` : m.email,
        })),
    [members, grantedUserIds]
  )

  const emailFor = (userId) => {
    const member = members.find((m) => m.id === userId)
    return member?.email || null
  }

  const handleGrant = async () => {
    if (!selectedUserId) return
    setGranting(true)
    const result = await grantDatasource(dsId, selectedUserId)
    setGranting(false)
    if (result.ok) {
      message.success('Access granted')
      setSelectedUserId(null)
    } else {
      message.error(friendlyError(result))
    }
  }

  const handleRevoke = async (grant) => {
    const result = await revokeGrant(grant.id, dsId)
    if (result.ok) {
      message.success('Access revoked')
    } else {
      message.error(friendlyError(result))
    }
  }

  return (
    <Drawer
      title={`Datasource access — ${datasource?.name ?? ''}`}
      open={open}
      onClose={onClose}
      width={420}
    >
      <Text type="secondary">
        Members need an explicit grant to query this datasource. Admins always
        have access.
      </Text>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0 24px' }}>
        <Select
          showSearch
          style={{ flex: 1 }}
          placeholder="Search members by name or email…"
          value={selectedUserId}
          onChange={setSelectedUserId}
          onSearch={setMemberSearch}
          loading={membersLoading}
          options={memberOptions}
          optionFilterProp="label"
          notFoundContent={
            membersLoading ? 'Loading…' : 'No members found'
          }
          aria-label="Select member to grant access"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          dropdownRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: 12 }}>
                {memberOptions.length} of {membersTotal} members shown
              </div>
            </>
          )}
        />
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          disabled={!selectedUserId}
          loading={granting}
          onClick={handleGrant}
        >
          Grant
        </Button>
      </div>

      <div className="user-drawer-label">Granted access</div>
      {grantsError && <Text type="danger">{grantsError}</Text>}
      {grantsLoading ? (
        <Text type="secondary">Loading…</Text>
      ) : grants.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No member has been granted access yet"
          style={{ marginTop: 16 }}
        />
      ) : (
        <ul className="user-drawer-activity" data-testid="grants-list">
          {grants.map((grant) => {
            const email = emailFor(grant.user_id)
            return (
              <li key={grant.id}>
                <span className="user-drawer-action">{email || 'Member'}</span>
                {!email && (
                  <Text type="secondary" code style={{ marginLeft: 6 }}>
                    {grant.user_id.slice(0, 8)}
                  </Text>
                )}
                <Text type="secondary">{relativeTime(grant.created_at)}</Text>
                <Popconfirm
                  title="Revoke this member's access?"
                  onConfirm={() => handleRevoke(grant)}
                  okText="Revoke"
                  cancelText="Cancel"
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={`Revoke access for ${email || grant.user_id}`}
                  />
                </Popconfirm>
              </li>
            )
          })}
        </ul>
      )}
    </Drawer>
  )
}

export default GrantsDrawer
