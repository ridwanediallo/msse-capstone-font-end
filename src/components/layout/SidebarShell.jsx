import useThemeStore from '../../stores/useThemeStore'
import UserFooter from './UserFooter'

function SidebarShell({ actionIcon, actionLabel, onAction, secondActionIcon, secondActionLabel, onSecondAction, sectionLabel, children }) {
  const theme = useThemeStore((s) => s.theme)

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">Q</div>
        <span className="sidebar-brand-name">Queryable</span>
      </div>

      <button type="button" className="sidebar-new-session" onClick={onAction}>
        {actionIcon}
        {actionLabel}
      </button>

      {secondActionLabel && (
        <button type="button" className="sidebar-new-session sidebar-suggest" onClick={onSecondAction}>
          {secondActionIcon}
          {secondActionLabel}
        </button>
      )}

      <div className="sidebar-section-label">{sectionLabel}</div>

      <div className="sidebar-recents">
        {children}
      </div>

      <UserFooter />

      {theme === 'dark' && <div className="sidebar-gutter" />}
    </aside>
  )
}

export default SidebarShell
