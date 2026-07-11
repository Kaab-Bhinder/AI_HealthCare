"use client"
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Activity, ArrowRight, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useAuth, roleHome } from '../lib/auth'

export default function SiteHeader() {
  const { user, loading, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const initials = user?.name ? user.name.replace(/^Dr\.?\s*/i, '').split(' ').map((w) => w[0]).slice(0, 2).join('') : 'U'

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300/60 dark:border-white/10 bg-cream-50/80 dark:bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift">
            <Activity className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight text-ink-900 dark:text-white">Auravia</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-ink-400">Health Assistant</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-ink-500 dark:text-ink-300">
          <Link href="/" className="px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-white/5 transition-colors">Home</Link>
          <Link href="/consult" className="px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-white/5 transition-colors">Consult</Link>
          {user && (
            <Link href={roleHome(user.role)} className="px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-white/5 transition-colors">Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {loading ? (
            <div className="h-9 w-20 rounded-full bg-cream-200 dark:bg-white/5 animate-pulse" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-cream-300 dark:border-white/10 bg-white/70 dark:bg-white/5 pl-1 pr-2.5 py-1 hover:border-brand-300 transition-colors"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-semibold">{initials}</span>
                <span className="hidden sm:block text-sm font-medium text-ink-700 dark:text-ink-200 max-w-[8rem] truncate">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-ink-400" />
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-cream-300 dark:border-white/10 bg-white dark:bg-ink-900 shadow-lift p-1.5 animate-fade-up">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-ink-400 capitalize">{user.role}</p>
                  </div>
                  <Link href={roleHome(user.role)} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-ink-600 dark:text-ink-300 hover:bg-brand-50 dark:hover:bg-white/5 transition-colors">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <button onClick={() => { setOpen(false); logout() }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-coral-600 hover:bg-coral-50 dark:hover:bg-white/5 transition-colors">
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex px-4 py-2 rounded-full text-sm font-medium text-ink-600 dark:text-ink-300 hover:text-brand-600 transition-colors">Log in</Link>
              <Link href="/register" className="group inline-flex items-center gap-1.5 rounded-full bg-ink-900 dark:bg-white text-white dark:text-ink-900 px-4 py-2 text-sm font-semibold shadow-soft hover:shadow-lift transition-all">
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
