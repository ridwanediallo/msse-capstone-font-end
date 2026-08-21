import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Form, Input, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { apiFetch } from '../api.js'
import useAuthStore from '../stores/useAuthStore'

const { Title, Text } = Typography

function AcceptInvitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const token = searchParams.get('token') || ''

  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFinish = async ({ name, password }) => {
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await apiFetch('/auth/accept-invite', {
        method: 'POST',
        body: JSON.stringify({ token, password, name: name || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      await fetchMe()
      navigate('/')
    } catch (err) {
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">Q</div>
          <Title level={3} style={{ margin: 0 }}>Queryable</Title>
        </div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Set a password to activate your account
        </Text>

        {!token && (
          <Alert
            type="error"
            message="This invite link is missing its token. Ask your admin to resend the invite."
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        {formError && (
          <Alert
            type="error"
            message={formError}
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
            closable
          />
        )}

        <Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
          <Form.Item label="Name" name="name">
            <Input prefix={<UserOutlined />} placeholder="Your name (optional)" size="large" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Choose a password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="At least 8 characters"
              size="large"
            />
          </Form.Item>
          <Form.Item
            label="Confirm password"
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Repeat your password"
              size="large"
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            disabled={!token}
          >
            Activate account
          </Button>
        </Form>
      </div>
    </div>
  )
}

export default AcceptInvitePage
