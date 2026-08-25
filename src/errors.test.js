import { describe, expect, it } from 'vitest'
import { friendlyError } from './errors'

describe('friendlyError', () => {
  it('maps session-related codes to a sign-in-again message', () => {
    for (const code of ['csrf_invalid', 'unauthorized', 'invalid_session']) {
      expect(friendlyError({ error: 'CSRF token missing or invalid.', code })).toBe(
        'Your session has expired. Please sign in again.',
      )
    }
  })

  it('never surfaces raw integration instructions to users', () => {
    const msg = friendlyError({
      error: 'CSRF token missing or invalid. Fetch GET /api/v1/auth/csrf and send it as the X-CSRFToken header.',
      code: 'csrf_invalid',
    })
    expect(msg).not.toMatch(/\/api\//i)
    expect(msg).not.toMatch(/X-CSRFToken/i)
  })

  it('maps forbidden to a permission message', () => {
    expect(friendlyError({ error: 'Insufficient permissions', code: 'forbidden' })).toBe(
      'You do not have permission to do that.',
    )
  })

  it('passes through unknown codes as the raw message', () => {
    expect(friendlyError({ error: 'Grant already exists', code: 'grant_exists' })).toBe(
      'Grant already exists',
    )
  })

  it('accepts tagged Error objects', () => {
    const err = new Error('boom')
    err.code = 'csrf_invalid'
    expect(friendlyError(err)).toBe('Your session has expired. Please sign in again.')
  })

  it('falls back gracefully for empty input', () => {
    expect(friendlyError(null)).toMatch(/something went wrong/i)
  })
})
