"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CalendarClock, Stethoscope, MessageCircle, Phone, ChevronRight, CalendarX, History, ChevronDown, BookOpen, User as UserIcon } from 'lucide-react'
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
  const [convos, setConvos] = useState(null)

  useEffect(() => {
    apiFetch('/api/me/appointments').then((r) => r.json()).then((d) => setAppts(d.appointments || [])).catch(() => setAppts([]))
    apiFetch('/api/me/chats').then((r) => r.json()).then((d) => setConvos(d.conversations || [])).catch(() => setConvos([]))
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
        <a href="tel:1122" className="group rounded-3xl p-6 bg-gradient-to-br from-coral-500 to-coral-600 text-white shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all">
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

      {/* Chat history */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-white flex items-center gap-2">
          <History className="h-5 w-5 text-brand-500" /> Your conversations
        </h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Every consultation you have while signed in is saved here.</p>
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
