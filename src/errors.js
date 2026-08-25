// Maps backend error codes to user-facing messages.
//
// The backend's raw strings are written for API integrators (e.g. csrf_invalid
// tells the caller to fetch /auth/csrf and set a header). That's meaningless —
// and mildly revealing — in a UI toast, where the correct user action is
// almost always "sign in again".
const SESSION_EXPIRED = 'Your session has expired. Please sign in again.'

const FRIENDLY_CODES = {
  csrf_invalid: SESSION_EXPIRED,
  unauthorized: SESSION_EXPIRED,
  invalid_session: SESSION_EXPIRED,
  forbidden: 'You do not have permission to do that.',
}

/**
 * Translate a failure into a user-facing message. Accepts either an Error
 * tagged with `.code` (set by the stores) or a store-action result
 * (`{ error, code }`); falls back to the raw message for unknown codes.
 */
export const friendlyError = (err) => {
  if (!err) return 'Something went wrong. Please try again.'
  const raw = err.message || err.error
  return FRIENDLY_CODES[err.code] || raw || 'Something went wrong. Please try again.'
}
