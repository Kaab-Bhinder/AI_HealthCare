"use client"
import { useEffect, useState } from 'react'

/**
 * Light/dark theme toggle. Reads the initial theme set by the inline script in
 * layout.jsx (which runs before hydration to avoid a flash), then lets the user
 * switch it and persists the choice to localStorage.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    const root = document.documentElement
    if (next === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try {
      localStorage.setItem('theme', next)
    } catch (e) {}
  }

  // Avoid rendering the wrong icon before we know the theme (prevents flicker).
  if (!mounted) {
    return <div className="h-9 w-9" aria-hidden="true" />
  }

  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="h-9 w-9 rounded-full grid place-items-center border border-ink-200 dark:border-white/15 bg-white/60 dark:bg-white/5 text-ink-500 dark:text-ink-300 hover:text-brand-600 hover:border-brand-300 transition-all"
    >
      {isDark ? (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
        </svg>
      ) : (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  )
}
