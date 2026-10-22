import { createSlice } from '@reduxjs/toolkit'

/** Resolve the actual theme given a mode string and OS preference. */
function resolveTheme(mode) {
  if (mode === 'dark') return 'dark'
  if (mode === 'light') return 'light'
  // 'system' — check OS preference
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Apply the resolved theme to the DOM. */
function applyTheme(resolved) {
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
  }
}

// Determine initial mode from storage (new key first, then legacy boolean key)
function getInitialMode() {
  try {
    const stored = localStorage.getItem('theme_mode')
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
    // Migrate legacy boolean key
    const legacy = localStorage.getItem('theme_dark')
    if (legacy === 'true') return 'dark'
    if (legacy === 'false') return 'light'
  } catch {}
  return 'system'
}

const initialMode = getInitialMode()
const initialResolved = resolveTheme(initialMode)

// Sync DOM on slice module load (before React renders)
applyTheme(initialResolved)

let osChangeHandler = null

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    // 'light' | 'dark' | 'system'
    mode: initialMode,
    // 'light' | 'dark' — the actual applied theme
    resolvedTheme: initialResolved,
    // Keep legacy field in sync for backward compat
    darkMode: initialResolved === 'dark',
  },
  reducers: {
    setThemeMode: (state, action) => {
      const mode = action.payload // 'light' | 'dark' | 'system'
      state.mode = mode
      const resolved = resolveTheme(mode)
      state.resolvedTheme = resolved
      state.darkMode = resolved === 'dark'
      try {
        localStorage.setItem('theme_mode', mode)
        // Remove legacy key
        localStorage.removeItem('theme_dark')
      } catch {}
      applyTheme(resolved)

      // Manage OS listener
      if (typeof window !== 'undefined') {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        if (mode === 'system') {
          if (!osChangeHandler) {
            osChangeHandler = () => {
              const r = resolveTheme('system')
              applyTheme(r)
            }
            mq.addEventListener('change', osChangeHandler)
          }
        } else {
          if (osChangeHandler) {
            mq.removeEventListener('change', osChangeHandler)
            osChangeHandler = null
          }
        }
      }
    },

    // Legacy actions — kept for backward compat
    toggleDarkMode: (state) => {
      const next = state.resolvedTheme === 'dark' ? 'light' : 'dark'
      state.mode = next
      state.resolvedTheme = next
      state.darkMode = next === 'dark'
      try {
        localStorage.setItem('theme_mode', next)
        localStorage.removeItem('theme_dark')
      } catch {}
      applyTheme(next)
    },
    setDarkMode: (state, action) => {
      const isDark = Boolean(action.payload)
      const mode = isDark ? 'dark' : 'light'
      state.mode = mode
      state.resolvedTheme = mode
      state.darkMode = isDark
      try {
        localStorage.setItem('theme_mode', mode)
        localStorage.removeItem('theme_dark')
      } catch {}
      applyTheme(mode)
    },
  },
})

export const { setThemeMode, toggleDarkMode, setDarkMode } = themeSlice.actions
export default themeSlice.reducer
