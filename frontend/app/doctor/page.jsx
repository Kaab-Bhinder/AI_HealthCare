"use client"
import { useEffect, useMemo, useState } from 'react'
import {
  Star, Clock, Mail, Phone, User, Users, CalendarClock, CalendarDays, CalendarX,
  Award, GraduationCap, ClipboardCheck, CalendarPlus, HeartPulse,
} from 'lucide-react'
import { useAuth, RequireRole } from '../../lib/auth'
import { Blob, Leaf, DoctorAvatar } from '../../components/Organic'

/* ---------- date helpers ---------- */

function timeOf(iso) {
  try { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) } catch { return '' }
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function dayLabel(d) {
  const now = new Date()
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
  if (isSameDay(d, now)) return 'Today'
  if (isSameDay(d, tomorrow)) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ---------- dashboard ---------- */

function DoctorDashboard() {
  const { apiFetch } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    apiFetch('/api/doctor/appointments')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ appointments: [], profile: null }))
  }, [apiFetch])

  const profile = data?.profile
  const appts = data?.appointments

  const derived = useMemo(() => {
    if (!appts) return null
    const now = new Date()
    const withDates = appts
      .map((a) => ({ ...a, _date: new Date(a.slot_time) }))
      .filter((a) => !isNaN(a._date))
      .sort((a, b) => a._date - b._date)

    const today = withDates.filter((a) => isSameDay(a._date, now))

    // Current calendar week (Sunday -> Saturday)
    const weekStart = new Date(now); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)
    const thisWeek = withDates.filter((a) => a._date >= weekStart && a._date < weekEnd)

    const uniquePatients = new Set(withDates.map((a) => a.patient_email).filter(Boolean)).size

    // Upcoming = after today, grouped by day
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999)
    const upcoming = withDates.filter((a) => a._date > endOfToday)
    const groups = []
    for (const a of upcoming) {
      const label = dayLabel(a._date)
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.items.push(a)
      else groups.push({ label, items: [a] })
    }
    return { today, thisWeek, uniquePatients, groups }
  }, [appts])

  const docName = profile?.name || 'Doctor'
  const shortName = docName.replace(/^Dr\.?\s*/i, '')

  return (
    <div className="relative overflow-hidden">
      {/* page-level organic decorations */}
      <Blob className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 text-brand-200/40 dark:text-brand-500/10" />
      <Blob className="pointer-events-none absolute top-1/2 -left-32 w-80 h-80 text-coral-100/50 dark:text-coral-500/5" />
      <Leaf className="pointer-events-none absolute bottom-8 right-6 w-16 h-16 text-sage-200/70 dark:text-brand-500/10 rotate-12" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* ---- Hero band ---- */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-500 to-brand-700 p-8 sm:p-10 text-white shadow-lift animate-fade-up">
          <Blob className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 text-white/10" />
          <Leaf className="pointer-events-none absolute -bottom-4 left-1/2 w-24 h-24 text-white/10 -rotate-12" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-white/80">Doctor dashboard</p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl font-semibold">
                {profile ? `${greeting()}, Dr. ${shortName}` : `${greeting()}, Doctor`}
              </h1>
              <p className="mt-2 text-white/85">
                {profile?.specialty || 'Your practice at a glance'}
                {profile?.qualifications ? <span className="text-white/60"> &middot; {profile.qualifications}</span> : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur">
                <Star className="h-4 w-4 fill-current" /> {profile?.rating ?? '—'} rating
              </span>
              {profile?.experience_years != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur">
                  <Award className="h-4 w-4" /> {profile.experience_years} yrs experience
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ---- Stats row ---- */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {derived == null ? (
            [0, 1, 2, 3].map((i) => <div key={i} className="card h-28 animate-pulse" />)
          ) : (
            <>
              <Stat icon={CalendarClock} label="Today's visits" value={derived.today.length} tint="brand" />
              <Stat icon={CalendarDays} label="This week" value={derived.thisWeek.length} tint="sage" />
              <Stat icon={Users} label="Unique patients" value={derived.uniquePatients} tint="coral" />
              <Stat icon={Star} label="Rating" value={profile?.rating ?? '—'} tint="cream" />
            </>
          )}
        </div>

        {/* ---- Two-column area ---- */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Left: schedule */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-brand-500" /> Today&rsquo;s schedule
              </h2>
              <div className="mt-4">
                {derived == null && (
                  <div className="space-y-3">
                    <div className="card h-20 animate-pulse" />
                    <div className="card h-20 animate-pulse" />
                  </div>
                )}
                {derived && derived.today.length === 0 && (
                  <div className="card p-10 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream-200 dark:bg-white/5 text-ink-400">
                      <CalendarX className="h-6 w-6" />
                    </span>
                    <p className="mt-3 font-medium text-ink-700 dark:text-ink-200">No visits today</p>
                    <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Enjoy the calm — your upcoming bookings appear below.</p>
                  </div>
                )}
                {derived && derived.today.length > 0 && (
                  <ol className="relative space-y-3 before:absolute before:left-[2.65rem] before:top-3 before:bottom-3 before:w-px before:bg-brand-100 dark:before:bg-white/10">
                    {derived.today.map((a) => <ApptRow key={a._id} appt={a} timeline />)}
                  </ol>
                )}
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-brand-500" /> Upcoming
              </h2>
              <div className="mt-4 space-y-6">
                {derived == null && <div className="card h-20 animate-pulse" />}
                {derived && derived.groups.length === 0 && (
                  <div className="card p-8 text-center">
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-cream-200 dark:bg-white/5 text-ink-400">
                      <CalendarPlus className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">Nothing on the horizon yet — new bookings will show up here.</p>
                  </div>
                )}
                {derived && derived.groups.map((g) => (
                  <div key={g.label}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500 mb-2 pl-1">{g.label}</p>
                    <div className="space-y-3">
                      {g.items.map((a) => <ApptRow key={a._id} appt={a} />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right: profile + tips */}
          <div className="space-y-6">
            <section className="card p-6 relative overflow-hidden">
              <Blob className="pointer-events-none absolute -top-14 -right-14 w-44 h-44 text-brand-100/60 dark:text-brand-500/10" />
              <h2 className="relative font-display text-lg font-semibold text-ink-900 dark:text-white">Your profile</h2>
              {profile == null && data == null && <div className="mt-4 h-48 rounded-2xl bg-cream-100 dark:bg-white/5 animate-pulse" />}
              {data != null && (
                <div className="relative mt-4">
                  <div className="flex items-center gap-4">
                    <DoctorAvatar name={docName} className="h-16 w-16 rounded-2xl text-xl shadow-soft shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900 dark:text-white truncate">{docName}</p>
                      <p className="text-sm text-brand-600 dark:text-brand-300 truncate">{profile?.specialty || 'General practice'}</p>
                    </div>
                  </div>
                  <dl className="mt-5 space-y-3 text-sm">
                    {profile?.qualifications && (
                      <div className="flex items-start gap-2.5 text-ink-600 dark:text-ink-300">
                        <GraduationCap className="h-4 w-4 mt-0.5 shrink-0 text-ink-400" />
                        <span>{profile.qualifications}</span>
                      </div>
                    )}
                    {profile?.availability && (
                      <div className="flex items-start gap-2.5 text-ink-600 dark:text-ink-300">
                        <Clock className="h-4 w-4 mt-0.5 shrink-0 text-ink-400" />
                        <span>{profile.availability}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2.5 text-ink-600 dark:text-ink-300">
                      <Star className="h-4 w-4 mt-0.5 shrink-0 text-coral-500 fill-current" />
                      <span>{profile?.rating != null ? `${profile.rating} patient rating` : 'No rating yet'}</span>
                    </div>
                  </dl>
                  {profile?.bio && (
                    <p className="mt-5 border-t border-cream-200 dark:border-white/10 pt-4 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                      {profile.bio}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-white/10 p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Practice tips</h2>
              <ul className="mt-4 space-y-4">
                <Tip icon={ClipboardCheck} title="Confirm contact details" text="Double-check patient phone and email before each visit so follow-ups never bounce." />
                <Tip icon={CalendarPlus} title="Keep availability fresh" text="Availability updates go through the admin — share changes early so patients book the right slots." />
                <Tip icon={HeartPulse} title="Leave breathing room" text="A short buffer between visits keeps consultations unhurried and notes complete." />
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- small pieces ---------- */

const tintClasses = {
  brand: 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300',
  sage: 'bg-sage-100 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300',
  coral: 'bg-coral-50 dark:bg-coral-500/10 text-coral-500',
  cream: 'bg-cream-200 dark:bg-white/5 text-ink-500 dark:text-ink-300',
}

function Stat({ icon: Icon, label, value, tint = 'brand' }) {
  return (
    <div className="card p-5">
      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${tintClasses[tint]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-display text-3xl font-semibold text-ink-900 dark:text-white">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">{label}</p>
    </div>
  )
}

function ApptRow({ appt, timeline = false }) {
  const row = (
    <div className="card p-4 flex items-center gap-4 hover:shadow-lift transition-shadow">
      <div className="grid place-items-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300 w-[4.5rem] h-14 shrink-0">
        <span className="text-sm font-semibold">{timeOf(appt.slot_time)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink-900 dark:text-white truncate flex items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-ink-400" /> {appt.patient_name || appt.patient_email || 'Patient'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
          {appt.patient_email && <span className="inline-flex items-center gap-1 min-w-0"><Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{appt.patient_email}</span></span>}
          {appt.patient_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" /> {appt.patient_phone}</span>}
        </div>
      </div>
      {appt.status && <span className="chip hidden sm:inline-flex capitalize">{appt.status}</span>}
    </div>
  )
  if (!timeline) return row
  return <li className="relative">{row}</li>
}

function Tip({ icon: Icon, title, text }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white dark:bg-white/10 text-brand-600 dark:text-brand-300 shadow-soft">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-900 dark:text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{text}</p>
      </div>
    </li>
  )
}

export default function Page() {
  return <RequireRole role="doctor"><DoctorDashboard /></RequireRole>
}
