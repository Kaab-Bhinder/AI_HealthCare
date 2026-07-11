"use client"
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
const TOKEN_KEY = 'auravia_token'

const AuthContext = createContext(null)

/** Where each role lands after logging in. */
export function roleHome(role) {
  if (role === 'admin') return '/admin'
  if (role === 'doctor') return '/doctor'
  return '/dashboard'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Restore session on load: if a token exists, ask the server who it belongs to.
  useEffect(() => {
    let token = null
    try { token = localStorage.getItem(TOKEN_KEY) } catch (e) {}
    if (!token) { setLoading(false); return }
    fetch(`${BACKEND}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.user) setUser(d.user)
        else { try { localStorage.removeItem(TOKEN_KEY) } catch (e) {} }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const persist = (token, u) => {
    try { localStorage.setItem(TOKEN_KEY, token) } catch (e) {}
    setUser(u)
  }

  const login = async (email, password) => {
    const r = await fetch(`${BACKEND}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d.error || 'Login failed')
    persist(d.token, d.user)
    return d.user
  }

  const register = async (payload) => {
    const r = await fetch(`${BACKEND}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d.error || 'Registration failed')
    persist(d.token, d.user)
    return d.user
  }

  const logout = () => {
    try { localStorage.removeItem(TOKEN_KEY) } catch (e) {}
    setUser(null)
    router.push('/')
  }

  /** fetch() that automatically attaches the auth token + JSON header. */
  const apiFetch = useCallback((path, opts = {}) => {
    let token = null
    try { token = localStorage.getItem(TOKEN_KEY) } catch (e) {}
    return fetch(`${BACKEND}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

/** Guard a page to a role (or any signed-in user if role is omitted). */
export function RequireRole({ role, children }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (role && user.role !== role) { router.replace(roleHome(user.role)) }
  }, [loading, user, role, router])

  if (loading || !user || (role && user.role !== role)) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin" />
      </div>
    )
  }
  return children
}
