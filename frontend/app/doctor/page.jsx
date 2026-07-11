"use client"
import { useEffect, useState } from 'react'
import { CalendarClock, User, Mail, Phone, Stethoscope, Users, CalendarX } from 'lucide-react'
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

function DoctorDashboard() {
  const { apiFetch } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    apiFetch('/api/doctor/appointments').then((r) => r.json()).then(setData).catch(() => setData({ appointments: [], profile: null }))
  }, [apiFetch])

  const profile = data?.profile
  const appts = data?.appointments
  const uniquePatients = appts ? new Set(appts.map((a) => a.patient_email)).size : 0

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-sm text-ink-400">Doctor dashboard</p>
      <div className="mt-1 flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift">
          <Stethoscope className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 dark:text-white">{profile?.name || 'Doctor'}</h1>
          <p className="text-brand-600 dark:text-brand-300 text-sm">{profile?.specialty || ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Stat icon={CalendarClock} label="Upcoming visits" value={appts ? appts.length : '—'} />
        <Stat icon={Users} label="Patients" value={appts ? uniquePatients : '—'} />
        <Stat icon={Stethoscope} label="Rating" value={profile?.rating ?? '—'} />
      </div>

      {/* Appointments */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">Your schedule</h2>
        <div className="mt-4 space-y-3">
          {appts == null && <div className="card p-6 animate-pulse h-20" />}
          {appts && appts.length === 0 && (
            <div className="card p-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream-200 dark:bg-white/5 text-ink-400"><CalendarX className="h-6 w-6" /></span>
              <p className="mt-3 text-ink-500 dark:text-ink-400">No appointments booked yet.</p>
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
                  <p className="font-semibold text-ink-900 dark:text-white truncate flex items-center gap-2"><User className="h-4 w-4 text-ink-400" /> {a.patient_name || a.patient_email || 'Patient'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                    {a.patient_email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {a.patient_email}</span>}
                    {a.patient_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {a.patient_phone}</span>}
                  </div>
                </div>
                <span className="chip">{t.day}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-ink-400"><Icon className="h-4 w-4" /> <span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className="mt-2 font-display text-3xl font-semibold text-ink-900 dark:text-white">{value}</p>
    </div>
  )
}

export default function Page() {
  return <RequireRole role="doctor"><DoctorDashboard /></RequireRole>
}
