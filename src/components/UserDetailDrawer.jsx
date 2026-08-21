import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Drawer, Modal, Select, Tooltip, Typography, message } from 'antd'
import useAdminStore from '../stores/useAdminStore'
import useAuthStore from '../stores/useAuthStore'
import { apiFetch } from '../api.js'
import { initials } from '../initials'
import { relativeTime } from '../lib/relativeTime'
import { confirmDeactivate, confirmRevokeSession } from './adminActions'

const { Text } = Typography

function displayName(user) {
  return user.name || user.email
}

function UserDetailDrawer({ user, open, onClose, isLastAdmin }) {
  const currentUser = useAuthStore((s) => s.user)
  const { updateUser, revokeSessions } = useAdminStore()
  const [pendingRole, setPendingRole] = useState(null)
  const [activity, setActivity] = useState([])

  const isSelf = currentUser?.id === user?.id

  useEffect(() => {
    setPendingRole(null)
    if (!open || !user) return
    let cancelled = false
    apiFetch(`/admin/audit-logs?user_id=${user.id}&limit=5`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setActivity(data?.items ?? [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open, user])

  if (!user) return null

  const name = displayName(user)
  const lastAdmin = isLastAdmin(user)

  const applyRole = async (role, confirm = false) => {
    setPendingRole(role)
    const payload = confirm ? { role, confirm: true } : { role }
    const result = await updateUser(user.id, payload)
    if (!result.ok) {
      message.error(result.error)
    }
    setPendingRole(null)
  }

  const handleRoleChange = (role) => {
    if (isSelf && role !== 'admin') {
      Modal.confirm({
        title: 'Change your own role to Member?',
        content: "You're changing your own role to Member. You'll lose admin access immediately.",
        okText: 'Change my role',
        okButtonProps: { danger: true },
        onOk: () => applyRole(role, true),
      })
      return
    }
    applyRole(role)
  }

  const handleToggleActive = () => {
    if (user.is_active) {
      confirmDeactivate(user, isSelf, updateUser)
      return
    }
    updateUser(user.id, { is_active: true }).then((result) => {
      if (!result.ok) message.error(result.error)
    })
  }

  const handleRevoke = () => confirmRevokeSession(user, revokeSessions)

  return (
    <Drawer title={null} open={open} onClose={onClose} width={380}>
      <div className="user-drawer-header">
        <div className="sidebar-avatar user-drawer-avatar">
          {initials(user.name, user.email)}
        </div>
        <div>
          <div className="user-drawer-name">{name}</div>
          <Text type="secondary">{user.email}</Text>
        </div>
      </div>

      <div className="user-drawer-row">
        <span className="user-drawer-label">Role</span>
        <Tooltip title={lastAdmin ? "Can't remove the last admin" : null}>
          <Select
            value={pendingRole ?? user.role}
            loading={pendingRole !== null}
            disabled={lastAdmin}
            style={{ width: 140 }}
            options={[
              { value: 'member', label: 'Member' },
              { value: 'admin', label: 'Admin' },
            ]}
            onChange={handleRoleChange}
          />
        </Tooltip>
      </div>

      <div className="user-drawer-row">
        <span className="user-drawer-label">Active session</span>
        {user.has_active_session ? (
          <span className="status-active-text">Signed in</span>
        ) : (
          <Text type="secondary">No active session</Text>
        )}
      </div>

      <div className="user-drawer-actions">
        <Button
          danger
          block
          disabled={!user.has_active_session}
          onClick={handleRevoke}
        >
          Revoke session
        </Button>
        <Tooltip title={lastAdmin ? "Can't remove the last admin" : null}>
          <Button
            danger={user.is_active}
            block
            disabled={lastAdmin && user.is_active}
            onClick={handleToggleActive}
          >
            {user.is_active ? 'Deactivate account' : 'Reactivate account'}
          </Button>
        </Tooltip>
      </div>

      <div className="user-drawer-divider" />

      <div className="user-drawer-label">Recent activity</div>
      {activity.length === 0 ? (
        <Text type="secondary">No recent activity</Text>
      ) : (
        <ul className="user-drawer-activity">
          {activity.map((entry) => (
            <li key={entry.id}>
              <span className="user-drawer-action">{entry.action}</span>
              <Text type="secondary">{relativeTime(entry.created_at)}</Text>
            </li>
          ))}
        </ul>
      )}
      <Link to={`/admin/audit-log?user_id=${user.id}`} onClick={onClose}>
        View full history
      </Link>
    </Drawer>
  )
}

export default UserDetailDrawer
