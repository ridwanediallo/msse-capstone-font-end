import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Button, Alert, Typography } from 'antd'
import { LockOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { apiFetch } from '../api'

const { Title, Text } = Typography

function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const tokenFromState = location.state?.token || ''
  const [formError, setFormError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleFinish = async ({ password }) => {
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: tokenFromState, new_password: password }),
      })
      const data = await res.json()
      setSubmitting(false)
      if (!res.ok) {
        setFormError(data.error || `HTTP ${res.status}`)
        return
      }
      setSuccess(true)
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
            message="Password reset successful"
            description="Your password has been updated. Please sign in with your new password."
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
          <Button
            type="primary"
            block
            size="large"
            onClick={() => navigate('/login')}
          >
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  if (!tokenFromState) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-brand-icon">Q</div>
            <Title level={3} style={{ margin: 0 }}>Queryable</Title>
          </div>
          <Alert
            type="error"
            message="Invalid reset link"
            description="This password reset link is invalid or missing a token. Please request a new one."
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
          <Button
            type="primary"
            block
            size="large"
            onClick={() => navigate('/forgot-password')}
          >
            Request new reset link
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
          Enter your new password
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
            label="New password"
            name="password"
            rules={[
              { required: true, message: 'Enter a new password' },
              { min: 8, message: 'At least 8 characters' },
              { pattern: /[A-Z]/, message: 'Must contain an uppercase letter' },
              { pattern: /[a-z]/, message: 'Must contain a lowercase letter' },
              { pattern: /[0-9]/, message: 'Must contain a digit' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="New password" size="large" />
          </Form.Item>

          <Form.Item
            label="Confirm password"
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
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
        </Form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
