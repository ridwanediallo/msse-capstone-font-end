const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "Just now", "5 minutes ago", "2 hours ago", "3 days ago", else a short date. */
export function relativeTime(iso) {
  if (!iso) return 'Never'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'Never'
  const diff = Date.now() - then
  if (diff < MINUTE) return 'Just now'
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE)
    return `${mins} minute${mins === 1 ? '' : 's'} ago`
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  if (diff < 30 * DAY) {
    const days = Math.floor(diff / DAY)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }
  return new Date(iso).toLocaleDateString()
}
