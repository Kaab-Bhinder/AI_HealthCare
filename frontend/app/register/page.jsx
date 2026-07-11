"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Phone, ArrowRight, Loader2, Sparkles, CalendarCheck, Stethoscope } from 'lucide-react'
import { useAuth, roleHome } from '../../lib/auth'

export default function RegisterPage() {
  const { register, user, loading } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', gender: '', phone: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (!loading && user) router.replace(roleHome(user.role)) }, [loading, user, router])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
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
    <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        {/* Form */}
        <div className="w-full max-w-md mx-auto order-2 lg:order-1">
          <h1 className="font-display text-3xl font-semibold text-ink-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-ink-500 dark:text-ink-400">
            Already have one?{' '}
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-xl border border-coral-200 bg-coral-50 dark:bg-coral-500/10 px-4 py-3 text-sm text-coral-600 dark:text-coral-300">{error}</div>
            )}
            <Field icon={User} label="Full name" type="text" value={form.name} onChange={set('name')} placeholder="Ali Hassan" required />
            <Field icon={Mail} label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@gmail.com" required />
            <Field icon={Lock} label="Password" type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" required />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Gender <span className="text-ink-400 font-normal">(optional)</span></span>
                <select value={form.gender} onChange={set('gender')}
                  className="mt-1.5 w-full rounded-xl border border-cream-300 dark:border-white/15 bg-white dark:bg-white/5 text-ink-800 dark:text-ink-100 px-3 py-3 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 transition-all">
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </label>
              <Field icon={Phone} label="Phone" sub="(optional)" type="tel" value={form.phone} onChange={set('phone')} placeholder="+92 3XX XXXXXXX" />
            </div>
            <button type="submit" disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 text-white font-semibold py-3 shadow-soft hover:shadow-lift transition-all disabled:opacity-50">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <>Create account <ArrowRight className="h-4 w-4" /></>}
            </button>
            <p className="text-xs text-ink-400 text-center">Patient accounts only. Doctors are added by an administrator.</p>
          </form>
        </div>

        {/* Brand panel */}
        <div className="relative hidden lg:block order-1 lg:order-2">
          <div className="absolute -top-10 right-0 h-72 w-72 rounded-full bg-coral-200/40 blur-3xl" />
          <div className="absolute bottom-6 -left-6 h-56 w-56 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-white shadow-lift overflow-hidden">
            <svg className="absolute -left-10 bottom-0 h-48 w-48 text-white/10" viewBox="0 0 100 100" fill="currentColor"><path d="M50 5C60 25 80 30 95 35 75 45 70 70 50 95 30 70 25 45 5 35 20 30 40 25 50 5Z"/></svg>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Sparkles className="h-6 w-6" />
            </span>
            <h2 className="mt-8 font-display text-4xl font-semibold leading-tight">Your health, understood.</h2>
            <p className="mt-4 text-brand-50/90 leading-relaxed max-w-sm">
              Describe how you feel and we&apos;ll guide you calmly, match you to the right doctor, and book your visit.
            </p>
            <div className="mt-10 space-y-3 text-sm text-brand-50/90">
              <div className="flex items-center gap-3"><Stethoscope className="h-4 w-4" /> AI symptom insight</div>
              <div className="flex items-center gap-3"><CalendarCheck className="h-4 w-4" /> Effortless appointments</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, sub, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{label} {sub && <span className="text-ink-400 font-normal">{sub}</span>}</span>
      <div className="mt-1.5 relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input {...props}
          className="w-full rounded-xl border border-cream-300 dark:border-white/15 bg-white dark:bg-white/5 text-ink-800 dark:text-ink-100 pl-10 pr-4 py-3 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 placeholder-ink-400 transition-all" />
      </div>
    </label>
  )
}
