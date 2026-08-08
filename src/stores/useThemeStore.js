import { create } from 'zustand'

export const THEME_STORAGE_KEY = 'queryable-theme'

export function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readInitialTheme() {
  if (typeof localStorage === 'undefined') return 'light'
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  return saved === 'dark' || saved === 'light' ? saved : getSystemTheme()
}

const useThemeStore = create((set, get) => ({
  theme: readInitialTheme(),

  setTheme: (theme) => set({ theme }),

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    }
    set({ theme: next })
  },
}))

export default useThemeStore