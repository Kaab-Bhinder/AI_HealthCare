"use client"
import { useEffect, useState } from 'react'
import {
  Users, CalendarClock, Plus, Stethoscope, Star, Trash2, Loader2,
  Check, X, UserPlus, Activity, Phone, TrendingUp, Layers, Gauge, Clock, ShieldCheck,
} from 'lucide-react'
import { useAuth, RequireRole } from '../../lib/auth'
import { DoctorAvatar, Blob, Leaf } from '../../components/Organic'

/* ---------- helpers ---------- */

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return ''
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 0 || secs > 60 * 60 * 24 * 30) {
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }
  if (secs < 60) return 'booked just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `booked ${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `booked ${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `booked ${days} day${days > 1 ? 's' : ''} ago`
}

function formatSlot(slot) {
  if (!slot) return ''
  const d = new Date(slot)
  if (isNaN(d)) return slot
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/* ---------- page ---------- */

function AdminPanel() {
  const { apiFetch } = useAuth()
  const [doctors, setDoctors] = useState(null)
  const [bookings, setBookings] = useState(null)
  const [stats, setStats] = useState(null)
  const [toast, setToast] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = () => {
    apiFetch('/api/admin/doctors').then((r) => r.json()).then((d) => setDoctors(d.doctors || [])).catch(() => setDoctors([]))
    apiFetch('/api/admin/bookings').then((r) => r.json()).then((d) => setBookings(d.bookings || [])).catch(() => setBookings([]))
    apiFetch('/api/admin/stats').then((r) => r.json()).then((d) => setStats(d.stats || [])).catch(() => setStats([]))
  }
  useEffect(() => { load() }, [])

  const flash = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000) }

  const deleteDoctor = async (id) => {
    if (!confirm('Remove this doctor and their appointments?')) return
    const r = await apiFetch(`/api/admin/doctors/${id}`, { method: 'DELETE' })
    if (r.ok) { flash('Doctor removed'); load() } else { flash('Could not remove', 'error') }
  }

  const loading = !doctors || !bookings || !stats

  const totalBooked = (stats || []).reduce((s, x) => s + (x.booked_slots || 0), 0)
  const totalOpen = (stats || []).reduce((s, x) => s + (x.available_slots || 0), 0)
  const totalSlots = (stats || []).reduce((s, x) => s + (x.total_slots || 0), 0)
  const occupancy = totalSlots ? Math.round((totalBooked / totalSlots) * 100) : 0

  const occupancyRows = (stats || [])
    .map((s) => ({ ...s, pct: s.total_slots ? Math.round(((s.booked_slots || 0) / s.total_slots) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)

  const specialtyMix = Object.entries(
    (doctors || []).reduce((acc, d) => {
      const k = d.specialty || 'Other'
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])

  const recentBookings = [...(bookings || [])]
    .sort((a, b) => new Date(b.booked_at || 0) - new Date(a.booked_at || 0))
    .slice(0, 8)

  return (
    <div className="relative overflow-hidden">
      {/* Ambient decorations */}
      <Blob className="pointer-events-none absolute -top-28 -right-28 h-96 w-96 text-brand-200/40 dark:text-brand-500/10" aria-hidden />
      <Blob className="pointer-events-none absolute top-[42rem] -left-40 h-[26rem] w-[26rem] text-coral-100/50 dark:text-coral-500/5" aria-hidden />
      <Leaf className="pointer-events-none absolute top-24 right-[8%] h-16 w-16 rotate-12 text-brand-300/30 dark:text-brand-400/10" />
      <Leaf className="pointer-events-none absolute bottom-40 left-[4%] h-12 w-12 -rotate-45 text-coral-300/25 dark:text-coral-400/10" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-up">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.25} />
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink-900 dark:text-white">
                Admin <span className="text-gradient">console</span>
              </h1>
              <p className="mt-0.5 text-sm text-ink-400">Everything happening across the Auravia clinic, at a glance.</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> Add doctor
          </button>
        </div>

        {/* ---- KPI row ---- */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-36" />)
          ) : (
            <>
              <Stat icon={Stethoscope} label="Doctors" value={doctors.length}
                hint={`${specialtyMix.length} specialt${specialtyMix.length === 1 ? 'y' : 'ies'} on the roster`} />
              <Stat icon={CalendarClock} label="Booked visits" value={totalBooked}
                hint={`${bookings.length} booking record${bookings.length === 1 ? '' : 's'} total`} tone="coral" />
              <Stat icon={Users} label="Open slots" value={totalOpen}
                hint={`out of ${totalSlots} scheduled slots`} />
              <Stat icon={Gauge} label="Occupancy" value={`${occupancy}%`}
                hint={occupancy >= 70 ? 'Running near capacity' : occupancy >= 40 ? 'Healthy utilisation' : 'Plenty of room to book'} tone="coral" />
            </>
          )}
        </div>

        {/* ---- Clinic pulse ---- */}
        <SectionHeading icon={Activity} title="Clinic pulse" subtitle="Live utilisation across the practice" className="mt-12" />
        <div className="mt-5 grid lg:grid-cols-2 gap-4">
          {loading ? (
            <>
              <SkeletonCard className="h-72" />
              <SkeletonCard className="h-72" />
            </>
          ) : (
            <>
              {/* Occupancy by doctor */}
              <div className="card p-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300">
                    <TrendingUp className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h3 className="font-display font-semibold text-ink-900 dark:text-white">Occupancy by doctor</h3>
                    <p className="text-xs text-ink-400">Booked share of each schedule</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {occupancyRows.map((s) => (
                    <div key={s.doctor_id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold text-ink-800 dark:text-ink-100 truncate">{s.doctor_name}</p>
                        <p className="shrink-0 text-xs tabular-nums text-ink-400">
                          <span className="font-semibold text-ink-700 dark:text-ink-200">{s.booked_slots || 0}</span> / {s.total_slots || 0}
                          <span className="ml-1.5 text-brand-600 dark:text-brand-300 font-semibold">{s.pct}%</span>
                        </p>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-cream-200 dark:bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700"
                          style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  {occupancyRows.length === 0 && (
                    <p className="text-sm text-ink-400">No schedule data yet — add doctors to see utilisation.</p>
                  )}
                </div>
              </div>

              {/* Specialty mix */}
              <div className="card p-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-coral-50 dark:bg-coral-500/10 text-coral-500 dark:text-coral-300">
                    <Layers className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h3 className="font-display font-semibold text-ink-900 dark:text-white">Specialty mix</h3>
                    <p className="text-xs text-ink-400">How the roster is composed</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {specialtyMix.map(([name, count]) => {
                    const share = doctors.length ? Math.round((count / doctors.length) * 100) : 0
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-ink-800 dark:text-ink-100 truncate">{name}</p>
                          <span className="chip shrink-0 tabular-nums">{count} doctor{count === 1 ? '' : 's'}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-cream-200 dark:bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-coral-300 to-coral-500 transition-all duration-700"
                            style={{ width: `${share}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  {specialtyMix.length === 0 && (
                    <p className="text-sm text-ink-400">No doctors yet — the mix will appear here.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ---- Recent bookings ---- */}
        <SectionHeading icon={Clock} title="Recent bookings" subtitle="The latest eight appointments made by patients" className="mt-12" />
        <div className="mt-5 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} className="h-20" />)
          ) : recentBookings.length === 0 ? (
            <div className="card p-8 text-center text-sm text-ink-400">No bookings yet — they will show up here as patients reserve slots.</div>
          ) : (
            recentBookings.map((b) => (
              <div key={b._id} className="card p-4 flex items-center gap-4 hover:shadow-lift hover:-translate-y-0.5 transition-all animate-fade-up">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300">
                  <CalendarClock className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900 dark:text-white truncate">{b.patient_name || b.patient_email || 'Patient'}</p>
                  <p className="text-xs text-ink-400 truncate">
                    with <span className="font-medium text-ink-600 dark:text-ink-300">{b.doctor_name || 'Doctor'}</span>
                    {b.slot_time ? <> · {formatSlot(b.slot_time)}</> : null}
                  </p>
                </div>
                {b.booked_at && <span className="chip hidden sm:inline-flex shrink-0">{timeAgo(b.booked_at)}</span>}
              </div>
            ))
          )}
        </div>

        {/* ---- Doctors ---- */}
        <SectionHeading icon={Stethoscope} title="Doctors" subtitle="Manage the clinic roster" className="mt-12" />
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} className="h-36" />)
          ) : doctors.length === 0 ? (
            <div className="card p-8 sm:col-span-2 lg:col-span-3 text-center text-sm text-ink-400">
              No doctors yet — use the Add doctor button to create the first profile.
            </div>
          ) : (
            doctors.map((d) => (
              <div key={d._id} className="card p-5 hover:shadow-lift hover:-translate-y-1 transition-all animate-fade-up">
                <div className="flex items-center gap-3">
                  <DoctorAvatar name={d.name} photo={d.photo} className="h-12 w-12 shrink-0 rounded-2xl text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink-900 dark:text-white truncate">{d.name}</p>
                    <p className="text-xs text-brand-600 dark:text-brand-300">{d.specialty}</p>
                  </div>
                  <button onClick={() => deleteDoctor(d._id)} title="Remove doctor"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-400 hover:text-coral-600 hover:bg-coral-50 dark:hover:bg-white/5 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-ink-400">
                  <span className="inline-flex items-center gap-1 text-amber-500"><Star className="h-3.5 w-3.5 fill-current" /> {d.rating}</span>
                  <span>{d.experience_years}y exp</span>
                  <span className="capitalize">{d.gender}</span>
                </div>
                {d.phone && (
                  <div className="mt-3 pt-3 border-t border-cream-200 dark:border-white/10 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                    <Phone className="h-3.5 w-3.5 text-brand-500" /> {d.phone}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {showAdd && <AddDoctorModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); flash('Doctor added') }} />}

        {toast && (
          <div className={`fixed bottom-8 right-8 z-[60] pl-4 pr-6 py-4 rounded-2xl shadow-lift text-white font-semibold flex items-center gap-3 animate-fade-up ${toast.type === 'success' ? 'bg-gradient-to-r from-brand-500 to-brand-600' : 'bg-gradient-to-r from-rose-500 to-red-500'}`}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20">{toast.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}</span>
            <span className="text-sm">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- building blocks ---------- */

function SectionHeading({ icon: Icon, title, subtitle, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white dark:bg-ink-900 border border-cream-300 dark:border-white/10 text-brand-600 dark:text-brand-300 shadow-soft">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, hint, tone = 'brand' }) {
  const tile = tone === 'coral'
    ? 'bg-coral-50 dark:bg-coral-500/10 text-coral-500 dark:text-coral-300'
    : 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300'
  return (
    <div className="card p-5 hover:shadow-lift hover:-translate-y-0.5 transition-all animate-fade-up">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tile}`}><Icon className="h-5 w-5" /></span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">{label}</span>
      </div>
      <p className="mt-3 font-display text-4xl font-semibold text-ink-900 dark:text-white tabular-nums">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

function SkeletonCard({ className = '' }) {
  return (
    <div className={`card relative overflow-hidden shimmer ${className}`}>
      <div className="p-5 space-y-3">
        <div className="h-9 w-9 rounded-xl bg-cream-200 dark:bg-white/10" />
        <div className="h-4 w-2/3 rounded-full bg-cream-200 dark:bg-white/10" />
        <div className="h-3 w-1/2 rounded-full bg-cream-100 dark:bg-white/5" />
      </div>
    </div>
  )
}

/* ---------- add-doctor modal (creates doctor profile + login) ---------- */

const SPECIALTIES = ['General Practitioner', 'Internal Medicine', 'Neurology', 'ENT Specialist', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Psychiatry', 'Gastroenterology', 'Pulmonology']

function AddDoctorModal({ onClose, onCreated }) {
  const { apiFetch } = useAuth()
  const [f, setF] = useState({ name: '', email: '', specialty: 'General Practitioner', gender: 'female', experience_years: 5, phone: '', password: 'doctor123' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const r = await apiFetch('/api/admin/doctors/create', { method: 'POST', body: JSON.stringify(f) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed to add doctor')
      setCreated(d.login)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-lg card p-0 overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-soft"><UserPlus className="h-5 w-5" /></span>
            <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Add a doctor</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-ink-400 hover:bg-cream-100 dark:hover:bg-white/10 transition-colors"><X className="h-5 w-5" /></button>
        </div>

        {created ? (
          <div className="p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-white shadow-lift"><Check className="h-7 w-7" /></span>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900 dark:text-white">Doctor added</h3>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">Their login was created:</p>
            <div className="mt-3 rounded-xl bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-white/10 p-3 font-mono text-sm text-brand-700 dark:text-brand-300">
              {created.email}<br />{created.password}
            </div>
            <button onClick={onCreated} className="btn-primary mt-6">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            {error && <div className="rounded-xl border border-coral-200 bg-coral-50 dark:bg-coral-500/10 px-4 py-3 text-sm text-coral-600 dark:text-coral-300">{error}</div>}
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Full name" value={f.name} onChange={set('name')} placeholder="Dr. Ayesha Khan" required />
              <Input label="Login email" type="email" value={f.email} onChange={set('email')} placeholder="ayesha.khan@auravia.health" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Select label="Specialty" value={f.specialty} onChange={set('specialty')} options={SPECIALTIES} />
              <Select label="Gender" value={f.gender} onChange={set('gender')} options={['female', 'male']} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Experience (years)" type="number" value={f.experience_years} onChange={set('experience_years')} />
              <Input label="Phone" value={f.phone} onChange={set('phone')} placeholder="+92 3XX XXXXXXX" />
            </div>
            <Input label="Temp password" value={f.password} onChange={set('password')} />
            <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 text-white font-semibold py-3 shadow-soft hover:shadow-lift transition-all disabled:opacity-50">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : <>Create doctor + login</>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{label}</span>
      <input {...props} className="mt-1.5 w-full rounded-xl border border-cream-300 dark:border-white/15 bg-white dark:bg-white/5 text-ink-800 dark:text-ink-100 px-3 py-2.5 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 placeholder-ink-400 transition-all" />
    </label>
  )
}
function Select({ label, options, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{label}</span>
      <select {...props} className="mt-1.5 w-full rounded-xl border border-cream-300 dark:border-white/15 bg-white dark:bg-white/5 text-ink-800 dark:text-ink-100 px-3 py-2.5 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 transition-all capitalize">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

export default function Page() {
  return <RequireRole role="admin"><AdminPanel /></RequireRole>
}
