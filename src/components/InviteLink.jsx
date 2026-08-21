import { Button, Input, Typography, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

const { Text } = Typography

export function inviteUrlFor(token) {
  return `${window.location.origin}/invite?token=${token}`
}

function InviteLink({ token, email }) {
  const url = inviteUrlFor(token)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      message.success('Invite link copied')
    } catch {
      message.info('Copy the link manually')
    }
  }

  return (
    <div className="invite-result">
      <Text type="secondary">
        Share this one-time link with {email}. It expires in 72 hours and can be used
        once.
      </Text>
      <div className="invite-link-row">
        <Input readOnly value={url} onFocus={(e) => e.target.select()} />
        <Button icon={<CopyOutlined />} onClick={handleCopy}>
          Copy
        </Button>
      </div>
    </div>
  )
}

export default InviteLink
