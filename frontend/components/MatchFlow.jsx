"use client"
import { useState } from 'react'
import Link from 'next/link'
import {
  Search, Loader2, Star, Clock, CalendarCheck, ChevronLeft, ChevronRight, AlertTriangle,
  Phone, ArrowRight, Check, User, Mail, Sparkles, ShieldCheck, Stethoscope,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { DoctorAvatar } from './Organic'
import VoiceChat from './VoiceChat'

const GENDERS = [{ k: '', label: 'Any' }, { k: 'female', label: 'Female' }, { k: 'male', label: 'Male' }]
const TIMES = [{ k: '', label: 'Any time' }, { k: 'morning', label: 'Morning' }, { k: 'afternoon', label: 'Afternoon' }, { k: 'evening', label: 'Evening' }]

function fmtSlot(iso) {
  try {
    const d = new Date(iso)
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      dayLong: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }
  } catch { return { day: '', dayLong: '', time: '' } }
}

const URGENCY = {
  routine: { label: 'Routine', cls: 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-500/20' },
  urgent: { label: 'Urgent', cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20' },
  emergency: { label: 'Emergency', cls: 'bg-coral-50 dark:bg-coral-500/10 text-coral-700 dark:text-coral-300 border-coral-200 dark:border-coral-500/20' },
}

export default function MatchFlow() {
  const { user, apiFetch } = useAuth()
  const [stage, setStage] = useState('input') // input | results | booking | done
  const [symptoms, setSymptoms] = useState('')
  const [gender, setGender] = useState('')
  const [ptime, setPtime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [doctor, setDoctor] = useState(null)
  const [slots, setSlots] = useState([])
  const [slot, setSlot] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [booked, setBooked] = useState(null)

  async function findDoctors() {
    if (!symptoms.trim()) return
    setLoading(true); setError('')
    try {
      const r = await apiFetch('/api/match', {
        method: 'POST',
        body: JSON.stringify({ symptoms: symptoms.trim(), gender: gender || null, preferred_time: ptime || null }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Matching failed')
      setResult(d); setStage('results')
    } catch (e) {
      setError(e.message === 'Failed to fetch' ? 'Could not reach the service — is the backend running?' : (e.message || 'Something went wrong'))
    } finally { setLoading(false) }
  }

  async function chooseDoctor(doc) {
    setDoctor(doc)
    setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
    setFormError('')
    try {
      const r = await apiFetch(`/api/doctors/${doc._id}/slots?days=7`)
      const d = await r.json()
      const s = d.slots || []
      setSlots(s)
      setSlot(doc.earliest_slot || s[0] || null)
    } catch {
      setSlots([]); setSlot(doc.earliest_slot || null)
    }
    setStage('booking')
  }

  async function confirmBooking() {
    setFormError('')
    if (!form.email.includes('@')) { setFormError('Please enter a valid email.'); return }
    if (form.phone.replace(/\D/g, '').length < 7) { setFormError('Please enter a valid phone number.'); return }
    if (!slot) { setFormError('Please pick a time.'); return }
    setSubmitting(true)
    try {
      const r = await apiFetch('/api/appointments/book', {
        method: 'POST',
        body: JSON.stringify({ slot_id: slot._id, email: form.email, phone: form.phone, name: form.name }),
      })
      const d = await r.json()
      if (!r.ok || !d.success) throw new Error(d.error || 'That slot is no longer available.')
      setBooked({ doctor, slot }); setStage('done')
    } catch (e) { setFormError(e.message) } finally { setSubmitting(false) }
  }

  // ---------- INPUT ----------
  if (stage === 'input') {
    return (
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift"><Sparkles className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">Describe how you feel</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400">We&apos;ll match you to the right doctor.</p>
          </div>
        </div>

        {error && <div className="mt-5 rounded-xl border border-coral-200 bg-coral-50 dark:bg-coral-500/10 px-4 py-3 text-sm text-coral-600 dark:text-coral-300">{error}</div>}

        <div className="mt-5 relative">
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={4}
            placeholder="e.g. I've had a pounding headache and blurry vision since this morning…"
            className="w-full rounded-2xl border border-cream-300 dark:border-white/15 bg-white dark:bg-white/5 text-ink-800 dark:text-ink-100 px-4 py-3 pr-14 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 placeholder-ink-400 transition-all resize-none"
          />
          <div className="absolute right-3 bottom-3">
            <VoiceChat onVoiceInput={(t) => setSymptoms((s) => (s ? s + ' ' : '') + t)} />
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-5">
          <Pref label="Doctor preference" options={GENDERS} value={gender} onChange={setGender} />
          <Pref label="Preferred time" options={TIMES} value={ptime} onChange={setPtime} />
        </div>

        <button
          onClick={findDoctors}
          disabled={!symptoms.trim() || loading}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 text-white font-semibold py-3.5 shadow-soft hover:shadow-lift transition-all disabled:opacity-40"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Finding your doctors…</> : <><Search className="h-4 w-4" /> Find my doctor</>}
        </button>
      </div>
    )
  }

  // ---------- RESULTS ----------
  if (stage === 'results' && result) {
    const tri = result.triage
    const u = URGENCY[tri.urgency] || URGENCY.routine
    return (
      <div className="space-y-5 animate-fade-up">
        {result.emergency && <EmergencyBanner reason={tri.reason} />}

        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">This looks like</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900 dark:text-white">{tri.specialty}</h2>
              {tri.reason && <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 max-w-md">{tri.reason}</p>}
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${u.cls}`}>{u.label}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink-900 dark:text-white">{result.doctors.length} matched {result.doctors.length === 1 ? 'doctor' : 'doctors'}</h3>
          <button onClick={() => setStage('input')} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600"><ChevronLeft className="h-4 w-4" /> Edit symptoms</button>
        </div>

        <div className="space-y-3">
          {result.doctors.map((d, i) => (
            <DoctorResult key={d._id} doctor={d} best={i === 0 && !!d.earliest_slot} onChoose={() => chooseDoctor(d)} />
          ))}
          {result.doctors.length === 0 && (
            <div className="card p-8 text-center text-ink-500 dark:text-ink-400">No doctors available right now. Please try again shortly.</div>
          )}
        </div>
      </div>
    )
  }

  // ---------- BOOKING ----------
  if (stage === 'booking' && doctor) {
    const byDay = {}
    slots.forEach((s) => { const k = fmtSlot(s.slot_time).dayLong; (byDay[k] = byDay[k] || []).push(s) })
    return (
      <div className="card p-6 sm:p-8 animate-fade-up">
        <button onClick={() => setStage('results')} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600"><ChevronLeft className="h-4 w-4" /> Back to matches</button>

        <div className="mt-4 flex items-center gap-4">
          <DoctorAvatar name={doctor.name} photo={doctor.photo} className="h-14 w-14 rounded-2xl text-sm" />
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white">{doctor.name}</h2>
            <p className="text-sm text-brand-600 dark:text-brand-300">{doctor.specialty}</p>
          </div>
        </div>

        {/* Slots */}
        <div className="mt-6">
          <p className="text-sm font-medium text-ink-700 dark:text-ink-200">Choose a time</p>
          <div className="mt-3 space-y-4 max-h-64 overflow-y-auto pr-1">
            {Object.keys(byDay).length === 0 && <p className="text-sm text-ink-400">No open times in the next week.</p>}
            {Object.entries(byDay).map(([day, daySlots]) => (
              <div key={day}>
                <p className="text-xs font-semibold text-ink-400 mb-2">{day}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {daySlots.map((s) => {
                    const active = slot && slot._id === s._id
                    return (
                      <button key={s._id} onClick={() => setSlot(s)}
                        className={`rounded-xl px-2 py-2 text-sm font-medium border transition-all ${active ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-200 ring-2 ring-brand-500/20' : 'border-cream-300 dark:border-white/10 text-ink-600 dark:text-ink-300 hover:border-brand-300'}`}>
                        {fmtSlot(s.slot_time).time}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <FormField icon={User} placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <FormField icon={Mail} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <FormField icon={Phone} placeholder="Phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="sm:col-span-2" />
        </div>
        {formError && <p className="mt-3 text-sm text-coral-600 dark:text-coral-300">{formError}</p>}

        <button onClick={confirmBooking} disabled={submitting}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 text-white font-semibold py-3.5 shadow-soft hover:shadow-lift transition-all disabled:opacity-50">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Booking…</> : <>Confirm appointment {slot && `· ${fmtSlot(slot.slot_time).day} ${fmtSlot(slot.slot_time).time}`}</>}
        </button>
      </div>
    )
  }

  // ---------- DONE ----------
  if (stage === 'done' && booked) {
    const s = fmtSlot(booked.slot.slot_time)
    return (
      <div className="card p-8 text-center animate-fade-up">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-500 text-white shadow-lift"><Check className="h-8 w-8" /></span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-ink-900 dark:text-white">You&apos;re booked!</h2>
        <p className="mt-2 text-ink-500 dark:text-ink-400">A confirmation has been sent to {form.email}.</p>
        <div className="mt-6 mx-auto max-w-sm rounded-2xl border border-cream-300 dark:border-white/10 bg-cream-100/60 dark:bg-white/5 p-4 flex items-center gap-4 text-left">
          <DoctorAvatar name={booked.doctor.name} photo={booked.doctor.photo} className="h-12 w-12 rounded-xl text-xs" />
          <div>
            <p className="font-semibold text-ink-900 dark:text-white">{booked.doctor.name}</p>
            <p className="text-sm text-brand-600 dark:text-brand-300">{booked.doctor.specialty}</p>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 flex items-center gap-1.5"><CalendarCheck className="h-4 w-4" /> {s.dayLong} · {s.time}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {user
            ? <Link href="/dashboard" className="btn-primary">Go to my dashboard <ArrowRight className="h-4 w-4" /></Link>
            : <Link href="/register" className="btn-primary">Create an account to manage it <ArrowRight className="h-4 w-4" /></Link>}
          <button onClick={() => { setStage('input'); setSymptoms(''); setResult(null); setBooked(null) }} className="btn-ghost">New consultation</button>
        </div>
      </div>
    )
  }

  return null
}

function Pref({ label, options, value, onChange }) {
  return (
    <div>
      <p className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.k} onClick={() => onChange(o.k)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${value === o.k ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300' : 'border-cream-300 dark:border-white/10 text-ink-500 dark:text-ink-400 hover:border-brand-300'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function DoctorResult({ doctor, best, onChoose }) {
  const slot = doctor.earliest_slot ? fmtSlot(doctor.earliest_slot.slot_time) : null
  return (
    <button onClick={onChoose} className="w-full text-left rounded-2xl border border-cream-300 dark:border-white/10 bg-white dark:bg-ink-900 p-4 hover:border-brand-400 hover:shadow-card transition-all group relative">
      {best && <span className="absolute -top-2.5 left-4 rounded-full bg-brand-500 text-white text-[11px] font-semibold px-2.5 py-0.5 shadow-soft">Best match</span>}
      <div className="flex items-center gap-4">
        <DoctorAvatar name={doctor.name} photo={doctor.photo} className="h-14 w-14 rounded-2xl text-sm shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-ink-900 dark:text-white truncate group-hover:text-brand-700 dark:group-hover:text-brand-300">{doctor.name}</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 shrink-0"><Star className="h-3.5 w-3.5 fill-current" /> {doctor.rating}</span>
          </div>
          <p className="text-xs text-brand-600 dark:text-brand-300 font-medium">{doctor.specialty}</p>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-400">
            {slot
              ? <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-300 font-medium"><Clock className="h-3 w-3" /> Earliest: {slot.day} · {slot.time}</span>
              : <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Check availability</span>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}

function EmergencyBanner({ reason }) {
  return (
    <div className="rounded-2xl border border-coral-300 dark:border-coral-500/30 bg-gradient-to-br from-coral-500 to-coral-600 text-white p-5 shadow-lift">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20"><AlertTriangle className="h-5 w-5" /></span>
        <div className="flex-1">
          <p className="font-semibold">This may be an emergency</p>
          <p className="text-sm text-white/90 mt-0.5">{reason || 'Your symptoms may need urgent care. Please don’t wait.'}</p>
          <a href="tel:112" className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-coral-600 hover:shadow-lg transition-all">
            <Phone className="h-4 w-4" /> Call an ambulance now
          </a>
        </div>
      </div>
    </div>
  )
}

function FormField({ icon: Icon, className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
      <input {...props}
        className="w-full rounded-xl border border-cream-300 dark:border-white/15 bg-white dark:bg-white/5 text-ink-800 dark:text-ink-100 pl-10 pr-4 py-3 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 placeholder-ink-400 transition-all" />
    </div>
  )
}
