"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Phone, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth, roleHome } from '../../lib/auth'
import AuthShell, { PillInput, GoogleButton, OrDivider } from '../../components/AuthShell'

export default function RegisterPage() {
  const { register, user, loading } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', gender: '', phone: '' })
  const [agree, setAgree] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (!loading && user) router.replace(roleHome(user.role)) }, [loading, user, router])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!agree) { setError('Please accept the terms of service to continue.'); return }
    setBusy(true)
    try {
      const u = await register({
        name: form.name.trim(), email: form.email.trim(), password: form.password,
        gender: form.gender || null, phone: form.phone || null,
      })
      router.replace(roleHome(u.role))
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally { setBusy(false) }
  }

  return (
    <AuthShell
      image="/images/pic3.jpg"
      heading="Sign up"
      tagline={<>Already have an account? <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link></>}
      sideTitle={<>Your health,<br />understood</>}
      sideSub="Auravia Health"
      below={<p className="text-[11px] text-ink-400 text-center">Patient accounts only — doctors are added by an administrator.</p>}
    >
      <form onSubmit={submit} className="space-y-3.5">
        {error && (
          <div className="rounded-2xl border border-coral-200 bg-coral-50 dark:bg-coral-500/10 px-4 py-3 text-sm text-coral-600 dark:text-coral-300">{error}</div>
        )}
        <PillInput icon={User} type="text" required value={form.name} onChange={set('name')} placeholder="full name" autoComplete="name" />
        <PillInput icon={Mail} type="email" required value={form.email} onChange={set('email')} placeholder="e-mail" autoComplete="email" />
        <PillInput icon={Lock} type="password" required value={form.password} onChange={set('password')} placeholder="password (6+ characters)" autoComplete="new-password" />
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select value={form.gender} onChange={set('gender')}
              className="w-full appearance-none rounded-full bg-brand-100/70 dark:bg-brand-500/15 border border-transparent text-ink-700 dark:text-ink-100 px-5 py-3.5 text-sm focus:outline-none focus:bg-white dark:focus:bg-ink-950 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 transition-all">
              <option value="">gender (optional)</option>
              <option value="female">female</option>
              <option value="male">male</option>
            </select>
          </div>
          <PillInput icon={Phone} type="tel" value={form.phone} onChange={set('phone')} placeholder="+92 3XX XXXXXXX" autoComplete="tel" />
        </div>

        {/* Terms checkbox — reference style */}
        <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)}
            className="h-4.5 w-4.5 h-[18px] w-[18px] rounded accent-teal-500" />
          <span className="text-xs text-ink-500 dark:text-ink-400">
            I agree to all statements in the <span className="text-brand-600 underline decoration-brand-300 underline-offset-2">terms of service</span>
          </span>
        </label>

        <div className="pt-1">
          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-brand-400 to-brand-600 px-8 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lift hover:shadow-glow hover:-translate-y-0.5 transition-all disabled:opacity-50">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <>Sign up <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </form>
      <OrDivider />
      <GoogleButton />
    </AuthShell>
  )
}
