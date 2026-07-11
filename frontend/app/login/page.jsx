"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Loader2, HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react'
import { useAuth, roleHome } from '../../lib/auth'

export default function LoginPage() {
  const { login, user, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (!loading && user) router.replace(roleHome(user.role)) }, [loading, user, router])

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const u = await login(email.trim(), password)
      router.replace(roleHome(u.role))
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:py-20">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        {/* Brand panel */}
        <div className="relative hidden lg:block">
          <div className="absolute -top-10 -left-6 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-56 w-56 rounded-full bg-coral-200/40 blur-3xl" />
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-brand-500 to-brand-700 p-10 text-white shadow-lift overflow-hidden">
            <svg className="absolute -right-8 -top-8 h-40 w-40 text-white/10" viewBox="0 0 100 100" fill="currentColor"><path d="M50 5C60 25 80 30 95 35 75 45 70 70 50 95 30 70 25 45 5 35 20 30 40 25 50 5Z"/></svg>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Stethoscope className="h-6 w-6" />
            </span>
            <h2 className="mt-8 font-display text-4xl font-semibold leading-tight">Welcome back to calmer care.</h2>
            <p className="mt-4 text-brand-50/90 leading-relaxed max-w-sm">
              Sign in to pick up your consultations, appointments, and health guidance — right where you left off.
            </p>
            <div className="mt-10 space-y-3 text-sm text-brand-50/90">
              <div className="flex items-center gap-3"><HeartPulse className="h-4 w-4" /> AI-matched to the right doctor</div>
              <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4" /> Private &amp; secure by design</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="w-full max-w-md mx-auto">
          <h1 className="font-display text-3xl font-semibold text-ink-900 dark:text-white">Sign in</h1>
          <p className="mt-2 text-ink-500 dark:text-ink-400">
            New here?{' '}
            <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">Create an account</Link>
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-xl border border-coral-200 bg-coral-50 dark:bg-coral-500/10 px-4 py-3 text-sm text-coral-600 dark:text-coral-300">{error}</div>
            )}
            <label className="block">
              <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Email</span>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full rounded-xl border border-cream-300 dark:border-white/15 bg-white dark:bg-white/5 text-ink-800 dark:text-ink-100 pl-10 pr-4 py-3 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 placeholder-ink-400 transition-all" />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Password</span>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-cream-300 dark:border-white/15 bg-white dark:bg-white/5 text-ink-800 dark:text-ink-100 pl-10 pr-4 py-3 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 placeholder-ink-400 transition-all" />
              </div>
            </label>
            <button type="submit" disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 text-white font-semibold py-3 shadow-soft hover:shadow-lift transition-all disabled:opacity-50">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-cream-300 dark:border-white/10 bg-cream-100/60 dark:bg-white/5 p-4 text-xs text-ink-500 dark:text-ink-400">
            <p className="font-medium text-ink-600 dark:text-ink-300">Demo logins</p>
            <p className="mt-1">Patient: register your own · Doctor: <span className="font-mono">ayesha.siddiqui@auravia.health</span> / doctor123 · Admin: <span className="font-mono">admin@auravia.health</span> / admin123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
