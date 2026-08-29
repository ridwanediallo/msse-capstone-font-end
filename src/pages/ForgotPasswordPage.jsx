import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Alert, Typography } from 'antd'
import { MailOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons'
import { apiFetch } from '../api'

const { Title, Text } = Typography

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [resetToken, setResetToken] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFinish = async ({ email }) => {
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setSubmitting(false)
      if (!res.ok) {
        setFormError(data.error || `HTTP ${res.status}`)
        return
      }
      setSuccess(true)
      // For demo: show the token directly since there's no email service.
      if (data.token) setResetToken(data.token)
    } catch (err) {
      setSubmitting(false)
      setFormError(err.message)
    }
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-brand-icon">Q</div>
            <Title level={3} style={{ margin: 0 }}>Queryable</Title>
          </div>
          <Alert
            type="success"
            message="Reset link sent"
            description="If an account exists with that email, you will receive a password reset link."
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
          {resetToken && (
            <Alert
              type="info"
              message="Demo mode — use this token"
              description={
                <span
                  style={{ cursor: 'pointer', wordBreak: 'break-all', fontFamily: 'monospace' }}
                  onClick={() => {
                    navigator.clipboard?.writeText(resetToken)
                  }}
                  title="Click to copy"
                >
                  {resetToken}
                </span>
              }
              showIcon
              style={{ marginBottom: 16, borderRadius: 10 }}
            />
          )}
          <Button
            type="primary"
            block
            size="large"
            onClick={() => navigate('/reset-password', { state: { token: resetToken } })}
          >
            Reset password
          </Button>
          <Button
            type="text"
            block
            icon={<ArrowLeftOutlined />}
            className="login-back"
            onClick={() => navigate('/login')}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">Q</div>
          <Title level={3} style={{ margin: 0 }}>Queryable</Title>
        </div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Enter your email to reset your password
        </Text>

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
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Enter your email' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" size="large" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            icon={<SendOutlined />}
          >
            Send reset link
          </Button>

          <Button
            type="text"
            block
            icon={<ArrowLeftOutlined />}
            className="login-back"
            onClick={() => navigate('/login')}
          >
            Back to sign in
          </Button>
        </Form>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
