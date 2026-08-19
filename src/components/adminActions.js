import { Modal, message } from 'antd'

/** Shared confirmation modals for user-management actions (table menu + drawer). */

export function confirmDeactivate(user, isSelf, updateUser) {
  const name = user.name || user.email
  Modal.confirm({
    title: isSelf
      ? "You're deactivating your own account"
      : `Deactivate ${name}'s account?`,
    content: isSelf
      ? "You'll be signed out immediately and won't be able to log back in until another admin reactivates you."
      : "They'll be signed out and won't be able to log back in until reactivated.",
    okText: 'Deactivate',
    okButtonProps: { danger: true },
    onOk: async () => {
      const payload = isSelf ? { is_active: false, confirm: true } : { is_active: false }
      const result = await updateUser(user.id, payload)
      if (!result.ok) message.error(result.error)
    },
  })
}

export function confirmRevokeSession(user, revokeSessions) {
  const name = user.name || user.email
  Modal.confirm({
    title: `Sign ${name} out of their current session?`,
    okText: 'Revoke session',
    okButtonProps: { danger: true },
    onOk: async () => {
      const result = await revokeSessions(user.id)
      if (result.ok) {
        message.success(`Revoked ${result.data.revoked} session(s)`)
      } else {
        message.error(result.error)
      }
    },
  })
}
