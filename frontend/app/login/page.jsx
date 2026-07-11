"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth, roleHome } from '../../lib/auth'
import AuthShell, { PillInput, GoogleButton, OrDivider } from '../../components/AuthShell'

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
    <AuthShell
      heading="Sign in"
      tagline={<>New here? <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">Create an account</Link></>}
      sideTitle={<>Care,<br />made calm</>}
      sideSub="Auravia Health"
      below={
        <div className="rounded-2xl border border-cream-300 dark:border-white/10 bg-cream-100/70 dark:bg-white/5 p-3.5 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
          <span className="font-semibold text-ink-600 dark:text-ink-300">Demo</span> · Doctor: <span className="font-mono">ayesha.siddiqui@auravia.health</span> / doctor123 · Admin: <span className="font-mono">admin@auravia.health</span> / admin123
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-coral-200 bg-coral-50 dark:bg-coral-500/10 px-4 py-3 text-sm text-coral-600 dark:text-coral-300">{error}</div>
        )}
        <PillInput icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e-mail" autoComplete="email" />
        <PillInput icon={Lock} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" autoComplete="current-password" />
        <div className="pt-1">
          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-brand-400 to-brand-600 px-8 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lift hover:shadow-glow hover:-translate-y-0.5 transition-all disabled:opacity-50">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </form>
      <OrDivider />
      <GoogleButton />
    </AuthShell>
  )
}
