import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import ThemeProvider from './ThemeProvider'
import useThemeStore, { THEME_STORAGE_KEY } from '../stores/useThemeStore'

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY)
    document.documentElement.removeAttribute('data-theme')
    useThemeStore.setState({ theme: 'light' })
  })

  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY)
    document.documentElement.removeAttribute('data-theme')
    useThemeStore.setState({ theme: 'light' })
    vi.restoreAllMocks()
  })

  it('applies a data-theme attribute for the current theme', () => {
    useThemeStore.setState({ theme: 'dark' })
    render(
      <ThemeProvider>
        <div>app</div>
      </ThemeProvider>,
    )
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('defaults to the light system scheme when undecided', () => {
    render(
      <ThemeProvider>
        <div>app</div>
      </ThemeProvider>,
    )
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('follows OS scheme changes until the user chooses', () => {
    const listeners = []
    const mq = {
      matches: false,
      addEventListener: (event, cb) => listeners.push([event, cb]),
      removeEventListener: () => {},
    }
    window.matchMedia = vi.fn(() => mq)

    render(
      <ThemeProvider>
        <div>app</div>
      </ThemeProvider>,
    )
    expect(document.documentElement.dataset.theme).toBe('light')

    act(() => {
      listeners.forEach(([, cb]) => cb({ matches: true }))
    })
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})