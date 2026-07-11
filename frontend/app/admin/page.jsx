"use client"
import { useEffect, useState } from 'react'
import {
  Users, CalendarClock, BarChart3, Plus, Stethoscope, Star, Trash2, Loader2,
  Check, X, UserPlus, Activity,
} from 'lucide-react'
import { useAuth, RequireRole } from '../../lib/auth'
import { DoctorAvatar } from '../../components/Organic'

const TABS = [
  { k: 'overview', label: 'Overview', icon: BarChart3 },
  { k: 'doctors', label: 'Doctors', icon: Stethoscope },
  { k: 'bookings', label: 'Bookings', icon: CalendarClock },
]

function AdminPanel() {
  const { apiFetch } = useAuth()
  const [tab, setTab] = useState('overview')
  const [doctors, setDoctors] = useState([])
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState([])
  const [toast, setToast] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = () => {
    apiFetch('/api/admin/doctors').then((r) => r.json()).then((d) => setDoctors(d.doctors || [])).catch(() => {})
    apiFetch('/api/admin/bookings').then((r) => r.json()).then((d) => setBookings(d.bookings || [])).catch(() => {})
    apiFetch('/api/admin/stats').then((r) => r.json()).then((d) => setStats(d.stats || [])).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const flash = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000) }

  const deleteDoctor = async (id) => {
    if (!confirm('Remove this doctor and their appointments?')) return
    const r = await apiFetch(`/api/admin/doctors/${id}`, { method: 'DELETE' })
    if (r.ok) { flash('Doctor removed'); load() } else { flash('Could not remove', 'error') }
  }

  const totalBooked = stats.reduce((s, x) => s + (x.booked_slots || 0), 0)
  const totalSlots = stats.reduce((s, x) => s + (x.total_slots || 0), 0)

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift"><Activity className="h-5 w-5" strokeWidth={2.5} /></span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Admin</h1>
            <p className="text-sm text-ink-400">Manage doctors, bookings & analytics</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm"><Plus className="h-4 w-4" /> Add doctor</button>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${tab === t.k ? 'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-soft' : 'bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300 border border-cream-300 dark:border-white/10 hover:border-brand-300'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={Stethoscope} label="Doctors" value={doctors.length} />
          <Stat icon={CalendarClock} label="Booked visits" value={totalBooked} />
          <Stat icon={Users} label="Total slots" value={totalSlots} />
          <Stat icon={BarChart3} label="Occupancy" value={totalSlots ? `${Math.round((totalBooked / totalSlots) * 100)}%` : '0%'} />
        </div>
      )}

      {/* Doctors */}
      {tab === 'doctors' && (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((d) => (
            <div key={d._id} className="card p-5">
              <div className="flex items-center gap-3">
                <DoctorAvatar name={d.name} photo={d.photo} className="h-12 w-12 rounded-2xl text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900 dark:text-white truncate">{d.name}</p>
                  <p className="text-xs text-brand-600 dark:text-brand-300">{d.specialty}</p>
                </div>
                <button onClick={() => deleteDoctor(d._id)} className="grid h-8 w-8 place-items-center rounded-full text-ink-400 hover:text-coral-600 hover:bg-coral-50 dark:hover:bg-white/5 transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-ink-400">
                <span className="inline-flex items-center gap-1 text-amber-500"><Star className="h-3.5 w-3.5 fill-current" /> {d.rating}</span>
                <span>{d.experience_years}y exp</span>
                <span className="capitalize">{d.gender}</span>
              </div>
            </div>
          ))}
          {doctors.length === 0 && <p className="text-ink-400">No doctors yet.</p>}
        </div>
      )}

      {/* Bookings */}
      {tab === 'bookings' && (
        <div className="mt-8 space-y-3">
          {bookings.map((b) => (
            <div key={b._id} className="card p-4 flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600"><CalendarClock className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900 dark:text-white truncate">{b.patient_name || b.patient_email || 'Patient'}</p>
                <p className="text-xs text-ink-400">with {b.doctor_name || 'Doctor'} · {b.slot_time ? new Date(b.slot_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</p>
              </div>
            </div>
          ))}
          {bookings.length === 0 && <p className="text-ink-400">No bookings yet.</p>}
        </div>
      )}

      {showAdd && <AddDoctorModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); flash('Doctor added') }} />}

      {toast && (
        <div className={`fixed bottom-8 right-8 z-[60] pl-4 pr-6 py-4 rounded-2xl shadow-lift text-white font-semibold flex items-center gap-3 animate-fade-up ${toast.type === 'success' ? 'bg-gradient-to-r from-brand-500 to-brand-600' : 'bg-gradient-to-r from-rose-500 to-red-500'}`}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20">{toast.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}</span>
          <span className="text-sm">{toast.message}</span>
        </div>
      )}
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
      <div className="w-full max-w-lg card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white"><UserPlus className="h-5 w-5" /></span>
            <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Add a doctor</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-ink-400 hover:bg-cream-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>

        {created ? (
          <div className="p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-white"><Check className="h-7 w-7" /></span>
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
              <Input label="Full name" value={f.name} onChange={set('name')} placeholder="Dr. Jane Doe" required />
              <Input label="Login email" type="email" value={f.email} onChange={set('email')} placeholder="jane@auravia.health" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Select label="Specialty" value={f.specialty} onChange={set('specialty')} options={SPECIALTIES} />
              <Select label="Gender" value={f.gender} onChange={set('gender')} options={['female', 'male']} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Experience (years)" type="number" value={f.experience_years} onChange={set('experience_years')} />
              <Input label="Phone" value={f.phone} onChange={set('phone')} placeholder="555-0100" />
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
