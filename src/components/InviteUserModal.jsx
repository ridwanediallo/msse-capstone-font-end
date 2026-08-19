import { useState } from 'react'
import { Button, Form, Input, Modal, Select, message } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import useAdminStore from '../stores/useAdminStore'
import InviteLink from './InviteLink'

function InviteUserModal({ open, onClose }) {
  const [form] = Form.useForm()
  const inviteUser = useAdminStore((s) => s.inviteUser)
  const [submitting, setSubmitting] = useState(false)
  const [inviteResult, setInviteResult] = useState(null)

  const reset = () => {
    form.resetFields()
    setInviteResult(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFinish = async ({ email, name, role }) => {
    setSubmitting(true)
    const result = await inviteUser({ email, name: name || undefined, role })
    setSubmitting(false)
    if (!result.ok) {
      message.error(result.error)
      return
    }
    setInviteResult(result.data)
  }

  return (
    <Modal
      title={inviteResult ? 'Invite created' : 'Invite user'}
      open={open}
      onCancel={handleClose}
      footer={
        inviteResult
          ? [
              <Button key="done" type="primary" onClick={handleClose}>
                Done
              </Button>,
            ]
          : null
      }
      destroyOnHidden
    >
      {inviteResult ? (
        <InviteLink token={inviteResult.invite_token} email={inviteResult.user.email} />
      ) : (
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleFinish}
          initialValues={{ role: 'member' }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Enter their email' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="teammate@example.com" />
          </Form.Item>
          <Form.Item label="Name" name="name" extra="Optional — they can fill it in when accepting.">
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item label="Role" name="role">
            <Select
              options={[
                { value: 'member', label: 'Member' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Send invite
          </Button>
        </Form>
      )}
    </Modal>
  )
}

export default InviteUserModal
