"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, Stethoscope, MessageCircle, Phone, ChevronRight, CalendarX } from 'lucide-react'
import { useAuth, RequireRole } from '../../lib/auth'

function fmt(iso) {
  try {
    const d = new Date(iso)
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }
  } catch { return { day: '', time: '' } }
}

function PatientDashboard() {
  const { user, apiFetch } = useAuth()
  const [appts, setAppts] = useState(null)

  useEffect(() => {
    apiFetch('/api/me/appointments').then((r) => r.json()).then((d) => setAppts(d.appointments || [])).catch(() => setAppts([]))
  }, [apiFetch])

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-sm text-ink-400">Patient dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink-900 dark:text-white">Hello, {firstName}.</h1>
      <p className="mt-2 text-ink-500 dark:text-ink-400">How are you feeling today?</p>

      {/* Quick actions */}
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <Link href="/consult" className="group card p-6 hover:-translate-y-1 hover:shadow-lift transition-all">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 ring-1 ring-brand-100 dark:ring-white/10 group-hover:bg-brand-500 group-hover:text-white transition-colors">
            <MessageCircle className="h-5 w-5" />
          </span>
          <h3 className="mt-4 font-semibold text-ink-900 dark:text-white">Start a consultation</h3>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Describe symptoms &amp; get matched to a doctor.</p>
        </Link>
        <Link href="/consult" className="group card p-6 hover:-translate-y-1 hover:shadow-lift transition-all">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 ring-1 ring-brand-100 dark:ring-white/10 group-hover:bg-brand-500 group-hover:text-white transition-colors">
            <CalendarClock className="h-5 w-5" />
          </span>
          <h3 className="mt-4 font-semibold text-ink-900 dark:text-white">Book an appointment</h3>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Find a specialist and reserve a time.</p>
        </Link>
        <a href="tel:112" className="group rounded-3xl p-6 bg-gradient-to-br from-coral-500 to-coral-600 text-white shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20"><Phone className="h-5 w-5" /></span>
          <h3 className="mt-4 font-semibold">Emergency</h3>
          <p className="mt-1 text-sm text-white/90">Call an ambulance now.</p>
        </a>
      </div>

      {/* Appointments */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">Your appointments</h2>
        <div className="mt-4 space-y-3">
          {appts === null && (
            <div className="card p-6 animate-pulse h-20" />
          )}
          {appts && appts.length === 0 && (
            <div className="card p-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream-200 dark:bg-white/5 text-ink-400"><CalendarX className="h-6 w-6" /></span>
              <p className="mt-3 text-ink-500 dark:text-ink-400">No appointments yet.</p>
              <Link href="/consult" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">Book your first visit <ChevronRight className="h-4 w-4" /></Link>
            </div>
          )}
          {appts && appts.map((a) => {
            const t = fmt(a.slot_time)
            return (
              <div key={a._id} className="card p-4 flex items-center gap-4">
                <div className="grid place-items-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 w-16 h-16 shrink-0">
                  <span className="text-xs font-medium">{t.day.split(' ').slice(0, 2).join(' ')}</span>
                  <span className="text-sm font-semibold">{t.time}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900 dark:text-white truncate">{a.doctor_name || 'Doctor'}</p>
                  <p className="text-sm text-brand-600 dark:text-brand-300">{a.doctor_specialty || ''}</p>
                </div>
                <span className="chip">Confirmed</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return <RequireRole role="patient"><PatientDashboard /></RequireRole>
}
