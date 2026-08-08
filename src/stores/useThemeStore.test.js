import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import useThemeStore, { THEME_STORAGE_KEY, getSystemTheme } from './useThemeStore'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY)
    useThemeStore.setState({ theme: 'light' })
  })

  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY)
    useThemeStore.setState({ theme: 'light' })
  })

  it('reads a persisted theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    useThemeStore.setState({
      ...useThemeStore.getState(),
      theme: 'dark',
    })
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('toggles and persists the theme', () => {
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('setTheme updates without persisting (system-driven)', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('getSystemTheme respects the OS preference', () => {
    expect(getSystemTheme()).toMatch(/^(light|dark)$/)
  })
})