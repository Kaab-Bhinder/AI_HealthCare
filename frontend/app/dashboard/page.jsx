"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  CalendarClock, Stethoscope, MessageCircle, Phone, ChevronRight, CalendarX,
  History, ChevronDown, BookOpen, HeartPulse, Droplets, Moon, Footprints,
  Sparkles, CalendarCheck, ArrowRight, Sun, Clock,
} from 'lucide-react'
import { useAuth, RequireRole } from '../../lib/auth'
import { Blob, Leaf } from '../../components/Organic'

function fmt(iso) {
  try {
    const d = new Date(iso)
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      dayLong: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }
  } catch { return { day: '', dayLong: '', time: '' } }
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function daysUntil(iso) {
  const diff = new Date(iso) - new Date()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

const TIPS = [
  { icon: Droplets, title: 'Stay hydrated', desc: '8–10 glasses of water a day keeps energy and focus up.' },
  { icon: Footprints, title: 'Move a little', desc: 'A 30-minute walk most days protects your heart.' },
  { icon: Moon, title: 'Sleep well', desc: '7–9 hours of sleep helps your body repair and recover.' },
]

function PatientDashboard() {
  const { user, apiFetch } = useAuth()
  const [appts, setAppts] = useState(null)
  const [convos, setConvos] = useState(null)

  useEffect(() => {
    apiFetch('/api/me/appointments').then((r) => r.json()).then((d) => setAppts(d.appointments || [])).catch(() => setAppts([]))
    apiFetch('/api/me/chats').then((r) => r.json()).then((d) => setConvos(d.conversations || [])).catch(() => setConvos([]))
  }, [apiFetch])

  const firstName = user?.name?.split(' ')[0] || 'there'
  const upcoming = (appts || []).filter((a) => new Date(a.slot_time) > new Date())
  const next = upcoming[0]

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Blob className="absolute -top-28 -right-28 w-[28rem] h-[28rem] text-brand-200/40 dark:text-brand-500/10" />
      <Blob className="absolute bottom-0 -left-32 w-96 h-96 text-coral-200/30 dark:text-coral-500/10" />
      <Leaf className="absolute top-24 right-[16%] w-10 text-brand-300/40 rotate-12 hidden lg:block" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* Hero greeting */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-500 to-brand-700 p-8 sm:p-10 text-white shadow-lift animate-fade-up">
          <Blob className="absolute -top-16 -right-12 w-64 h-64 text-white/10" />
          <Leaf className="absolute bottom-3 right-24 w-12 text-white/10 -rotate-12 hidden sm:block" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-2 text-sm text-brand-50/90"><Sun className="h-4 w-4" /> {greeting()}</p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold">Hello, {firstName}.</h1>
              <p className="mt-2 text-brand-50/90 max-w-md">
                {next
                  ? <>Your next visit with <span className="font-semibold">{next.doctor_name}</span> is {daysUntil(next.slot_time) || 'soon'} — {fmt(next.slot_time).dayLong} at {fmt(next.slot_time).time}.</>
                  : 'How are you feeling today? Describe your symptoms and we’ll take care of the rest.'}
              </p>
            </div>
            <Link href="/consult" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-brand-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Start consultation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={CalendarCheck} label="Upcoming visits" value={appts === null ? '–' : upcoming.length} />
          <Stat icon={MessageCircle} label="Conversations" value={convos === null ? '–' : convos.length} />
          <Stat icon={Clock} label="Next visit" value={next ? fmt(next.slot_time).day : '—'} small />
          <a href="tel:1122" className="group rounded-3xl p-5 bg-gradient-to-br from-coral-500 to-coral-600 text-white shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-2 text-white/85"><Phone className="h-4 w-4" /> <span className="text-xs font-medium uppercase tracking-wide">Emergency</span></div>
            <p className="mt-2 font-display text-xl font-semibold">Call 1122</p>
          </a>
        </div>

        {/* Main grid */}
        <div className="mt-8 grid lg:grid-cols-3 gap-6 items-start">
          {/* Left: appointments + conversations */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-brand-500" /> Your appointments
              </h2>
              <div className="mt-4 space-y-3">
                {appts === null && <div className="card p-6 animate-pulse h-20" />}
                {appts && appts.length === 0 && (
                  <div className="card p-10 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream-200 dark:bg-white/5 text-ink-400"><CalendarX className="h-6 w-6" /></span>
                    <p className="mt-3 text-ink-500 dark:text-ink-400">No appointments yet.</p>
                    <Link href="/consult" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">Book your first visit <ChevronRight className="h-4 w-4" /></Link>
                  </div>
                )}
                {appts && appts.map((a) => {
                  const t = fmt(a.slot_time)
                  const past = new Date(a.slot_time) < new Date()
                  return (
                    <div key={a._id} className={`card p-4 flex items-center gap-4 ${past ? 'opacity-60' : 'hover:shadow-card transition-shadow'}`}>
                      <div className="grid place-items-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 w-16 h-16 shrink-0">
                        <span className="text-[11px] font-medium">{t.day.split(' ').slice(0, 2).join(' ')}</span>
                        <span className="text-sm font-semibold">{t.time}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-900 dark:text-white truncate">{a.doctor_name || 'Doctor'}</p>
                        <p className="text-sm text-brand-600 dark:text-brand-300">{a.doctor_specialty || ''}</p>
                      </div>
                      <span className="chip">{past ? 'Completed' : 'Confirmed'}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white flex items-center gap-2">
                <History className="h-5 w-5 text-brand-500" /> Your conversations
              </h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Continue any of them from the Assistant tab in Consult.</p>
              <div className="mt-4 space-y-3">
                {convos === null && <div className="card p-6 animate-pulse h-20" />}
                {convos && convos.length === 0 && (
                  <div className="card p-10 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream-200 dark:bg-white/5 text-ink-400"><MessageCircle className="h-6 w-6" /></span>
                    <p className="mt-3 text-ink-500 dark:text-ink-400">No conversations yet.</p>
                    <Link href="/consult" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">Ask the assistant something <ChevronRight className="h-4 w-4" /></Link>
                  </div>
                )}
                {convos && convos.map((c) => <Conversation key={c.conversationId} convo={c} />)}
              </div>
            </section>
          </div>

          {/* Right: wellbeing panel */}
          <aside className="space-y-5">
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-ink-900 dark:text-white">
                <HeartPulse className="h-5 w-5 text-brand-500" /> Daily wellbeing
              </h3>
              <ul className="mt-4 space-y-4">
                {TIPS.map((t) => (
                  <li key={t.title} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600"><t.icon className="h-4 w-4" /></span>
                    <div>
                      <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{t.title}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">{t.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-brand-200 dark:border-brand-500/20 bg-brand-50/80 dark:bg-brand-500/5 p-6">
              <h3 className="flex items-center gap-2 font-semibold text-brand-700 dark:text-brand-300">
                <Sparkles className="h-5 w-5" /> Not feeling well?
              </h3>
              <p className="mt-2 text-sm text-ink-600 dark:text-ink-300 leading-relaxed">
                Describe your symptoms and our AI will find you the right specialist with the earliest opening.
              </p>
              <Link href="/consult" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                Find my doctor <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-ink-900 dark:text-white">
                <Stethoscope className="h-5 w-5 text-brand-500" /> Care team
              </h3>
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
                12 specialists across 11 fields — General, Cardiology, Neurology, Paediatrics and more — ready when you need them.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

const mdComponents = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
}

function Stat({ icon: Icon, label, value, small }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-ink-400"><Icon className="h-4 w-4" /> <span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className={`mt-2 font-display font-semibold text-ink-900 dark:text-white ${small ? 'text-xl' : 'text-3xl'}`}>{value}</p>
    </div>
  )
}

function Conversation({ convo }) {
  const [open, setOpen] = useState(false)
  const when = convo.last ? new Date(convo.last).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-cream-100/50 dark:hover:bg-white/[0.03] transition-colors">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600"><MessageCircle className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-900 dark:text-white truncate">{convo.title}</p>
          <p className="text-xs text-ink-400">{when} · {Math.ceil(convo.messages.length / 2)} exchange{convo.messages.length > 2 ? 's' : ''}</p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-cream-200 dark:border-white/10 p-4 space-y-3 max-h-96 overflow-y-auto bg-cream-50/50 dark:bg-transparent">
          {convo.messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-br-md' : 'bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-200 border border-cream-200 dark:border-white/10 rounded-bl-md'}`}>
                {m.role === 'assistant'
                  ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{m.content}</ReactMarkdown>
                  : m.content}
                {m.role === 'assistant' && m.sources?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-cream-200 dark:border-white/10 flex items-center gap-1.5 flex-wrap">
                    <BookOpen className="h-3 w-3 text-ink-400" />
                    {m.sources.map((s, si) => (
                      <span key={si} className="text-[10px] font-medium bg-cream-100 dark:bg-white/5 text-ink-500 dark:text-ink-400 rounded-full px-2 py-0.5">{s.title}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return <RequireRole role="patient"><PatientDashboard /></RequireRole>
}
