import { useNavigate } from 'react-router-dom'
import { Popover } from 'antd'
import { LogoutOutlined, LoginOutlined } from '@ant-design/icons'
import useAuthStore from '../../stores/useAuthStore'
import { initials } from '../../initials'

function UserFooter() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleSignOut = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="sidebar-footer">
      <Popover
        trigger="click"
        placement="bottom"
        arrow={false}
        overlayClassName="sidebar-user-popover"
        content={
          user ? (
            <div className="sidebar-user-popover-body">
              <div className="sidebar-user-popover-name">{user.name || user.email}</div>
              <div className="sidebar-user-popover-email">{user.email}</div>
              {user.role && (
                <div className="sidebar-user-popover-role">
                  <span className="sidebar-role-tag">{user.role}</span>
                </div>
              )}
              <button
                type="button"
                className="sidebar-user-popover-action"
                onClick={handleSignOut}
              >
                <LogoutOutlined /> Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="sidebar-user-popover-action"
              onClick={() => navigate('/login')}
            >
              <LoginOutlined /> Sign in
            </button>
          )
        }
      >
        <button
          type="button"
          className="sidebar-user-trigger"
          title={user ? user.email : 'Guest'}
        >
          <div className="sidebar-avatar">
            {user ? initials(user.name, user.email) : 'G'}
          </div>
          <span className="sidebar-username">
            {user ? user.name || user.email : 'Guest'}
          </span>
        </button>
      </Popover>
    </div>
  )
}

export default UserFooter
