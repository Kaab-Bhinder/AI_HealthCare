"use client"
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Stethoscope, User, Send, CalendarPlus, BookOpen, Sparkles, Check, X,
  Search, Clock, Star, ChevronLeft, Mail, Phone, CalendarCheck, ArrowRight,
  Loader2, ShieldCheck, AlertCircle, Award,
} from 'lucide-react'
import VoiceChat from './VoiceChat'

// Attach the signed-in user's token so the backend can link chats/bookings to
// their account (works fine for guests too — header is simply omitted).
function authHeaders() {
  try {
    const t = localStorage.getItem('auravia_token')
    return t ? { Authorization: `Bearer ${t}` } : {}
  } catch { return {} }
}

// Tailwind-styled renderers for the markdown in AI answers (dark-mode aware).
const mdComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-healthcare-800 dark:text-healthcare-200">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <h3 className="font-bold text-healthcare-700 dark:text-healthcare-300 text-base mt-3 mb-1">{children}</h3>,
  h2: ({ children }) => <h3 className="font-bold text-healthcare-700 dark:text-healthcare-300 text-base mt-3 mb-1">{children}</h3>,
  h3: ({ children }) => <h4 className="font-bold text-healthcare-700 dark:text-healthcare-300 mt-2 mb-1">{children}</h4>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-healthcare-600 dark:text-healthcare-300 underline">{children}</a>
  ),
  code: ({ children }) => (
    <code className="px-1 py-0.5 rounded bg-healthcare-50 dark:bg-slate-700 text-healthcare-700 dark:text-healthcare-200 text-[13px]">{children}</code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-healthcare-300 dark:border-healthcare-600 pl-3 italic text-gray-600 dark:text-slate-400">{children}</blockquote>
  ),
  table: ({ children }) => <table className="w-full text-left border-collapse my-2">{children}</table>,
  th: ({ children }) => <th className="border-b border-healthcare-200 dark:border-slate-600 px-2 py-1 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-healthcare-100 dark:border-slate-700 px-2 py-1">{children}</td>,
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const listRef = useRef(null)
  const [conversationId, setConversationId] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [slots, setSlots] = useState([])
  const [bookingStep, setBookingStep] = useState(1)   // 1 Symptom · 2 Doctor · 3 Time · 4 Details · 5 Success
  const [symptomQuery, setSymptomQuery] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [playingId, setPlayingId] = useState(null)  // Track which message is playing
  const [copiedId, setCopiedId] = useState(null)    // Track which message was just copied
  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  useEffect(() => {
    let id = null
    try {
      id = localStorage.getItem('healthcare_conversation_id')
      if (!id) {
        id = String(Date.now()) + '-' + Math.random().toString(36).slice(2,8)
      }
      localStorage.setItem('healthcare_conversation_id', id)
      setConversationId(id)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      fetch(`${backendUrl}/api/conversation/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).then(res => {
        if (res.ok) return res.json()
        return null
      }).then(data => {
        if (data && data.messages && data.messages.length > 0) {
          const restoredMessages = data.messages.map((msg, idx) => ({
            id: idx,
            from: msg.role === 'user' ? 'user' : 'assistant',
            text: msg.content
          }))
          setMessages(restoredMessages)
        } else {
          setMessages([{
            id: 1,
            from: 'assistant',
            text: 'Hello — I am your AI healthcare assistant. How can I help today?'
          }])
        }
        setLoaded(true)
      }).catch(err => {
        console.log('No prior conversation found, starting fresh')
        setMessages([{
          id: 1,
          from: 'assistant',
          text: 'Hello — I am your AI healthcare assistant. How can I help today?'
        }])
        setLoaded(true)
      })
    } catch (e) {
      setLoaded(true)
    }
  }, [])
  function renderFormattedText(text) {
    return (
      <div className="text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {text}
        </ReactMarkdown>
      </div>
    )
  }
  function send() {
    if (!input.trim()) return
    const userMsg = { id: Date.now(), from: 'user', text: input.trim() }
    setMessages(ms => [...ms, userMsg])
    setInput('')
    setTyping(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ message: userMsg.text, conversationId })
    }).then(async res => {
      setTyping(false)
      let j = null
      try {
        j = await res.json()
      } catch (e) {
      }
      if (!res.ok) {
        const salvage = j?.reply || j?.debug || j?.partial || (typeof j === 'string' ? j : null)
        const text = (salvage && typeof salvage === 'string' ? salvage : '') || 'AI unavailable, please try again later.'
        setMessages(ms => [...ms, { id: Date.now()+1, from: 'assistant', text }])
        return
      }
      const replyText = (j && (j.reply || j.partial || j.debug)) || 'AI unavailable, please try again later.'
      const sources = (j && Array.isArray(j.sources)) ? j.sources : []
      setMessages(ms => [...ms, { id: Date.now()+1, from: 'assistant', text: replyText, sources }])
    }).catch(err => {
      setTyping(false)
      setMessages(ms => [...ms, { id: Date.now()+1, from: 'assistant', text: 'AI unavailable, please try again later.' }])
      console.error('Chat error', err)
    })
  }
  function openBooking() {
    setBookingStep(1)
    setSymptomQuery('')
    setDoctors([])
    setSelectedDoctor(null)
    setSlots([])
    setSelectedSlot(null)
    setForm({ name: '', email: '', phone: '' })
    setFormError('')
    setShowBooking(true)
  }
  function closeBooking() {
    setShowBooking(false)
    setTimeout(() => { setBookingStep(1); setSelectedSlot(null); setFormError('') }, 200)
  }
  function searchDoctors(symptom) {
    setSearching(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    fetch(`${backendUrl}/api/doctors/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptom })
    }).then(res => res.json()).then(data => {
      setDoctors(data.doctors || [])
      setBookingStep(2)
    }).catch(err => {
      console.error('Doctor search error:', err)
      setDoctors([])
      setBookingStep(2)
    }).finally(() => setSearching(false))
  }
  function loadDoctorSlots(doctorId) {
    setSelectedDoctor(doctorId)
    setSelectedSlot(null)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    fetch(`${backendUrl}/api/doctors/${doctorId}/slots?days=7`, {
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()).then(data => {
      setSlots(data.slots || [])
      setBookingStep(3)
    }).catch(err => {
      console.error('Slots error:', err)
      setSlots([])
      setBookingStep(3)
    })
  }
  function submitBooking() {
    setFormError('')
    if (!form.email.includes('@') || form.email.length < 5) {
      setFormError('Please enter a valid email address.'); return
    }
    if (form.phone.replace(/\D/g, '').length < 7) {
      setFormError('Please enter a valid phone number.'); return
    }
    if (!selectedSlot) { setFormError('Please select a time slot.'); return }
    setSubmitting(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    fetch(`${backendUrl}/api/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: selectedSlot._id, email: form.email, phone: form.phone })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setBookingStep(5)
      } else {
        setFormError(data.error || 'That slot is no longer available. Please pick another time.')
      }
    }).catch(err => {
      console.error('Booking error:', err)
      setFormError('Something went wrong. Please try again.')
    }).finally(() => setSubmitting(false))
  }
  function bookSlot(slotId, email, phone) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    fetch(`${backendUrl}/api/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId, email, phone })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setNotification({ show: true, message: '✓ Appointment booked successfully! Check your email for confirmation.', type: 'success' })
        setTimeout(() => {
          setShowBooking(false)
          setBookingStep(1)
          setDoctors([])
          setSelectedDoctor(null)
          setSlots([])
          setNotification({ show: false, message: '', type: 'success' })
        }, 2000)
      } else {
        setNotification({ show: true, message: '❌ ' + (data.error || 'Slot unavailable. Please try another time.'), type: 'error' })
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000)
      }
    }).catch(err => {
      console.error('Booking error:', err)
      setNotification({ show: true, message: '❌ Failed to book appointment. Please try again.', type: 'error' })
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000)
    })
  }
  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] min-h-[520px] card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-ink-100 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] backdrop-blur">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift">
          <Stethoscope className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <h1 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Auravia Assistant</h1>
          <p className="text-xs text-brand-500 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" /> Online · grounded in medical knowledge
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-ink-50/40 dark:bg-transparent p-6 overflow-y-auto" ref={listRef}>
        {!loaded && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin" />
              <p className="text-ink-400 font-medium text-sm">Loading conversation…</p>
            </div>
          </div>
        )}
        {loaded && messages.length === 0 && (
          <div className="text-center py-16">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift">
              <Sparkles className="h-7 w-7" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-semibold text-ink-900 dark:text-white">How can I help today?</h2>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 max-w-sm mx-auto">
              Describe your symptoms and I&apos;ll offer calm, grounded guidance — or book an appointment with a doctor.
            </p>
            <div className="mt-6 flex gap-2 justify-center flex-wrap">
              {['I have a headache', 'What helps with a fever?', "I'm feeling dizzy"].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="chip hover:border-brand-300 hover:text-brand-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {loaded && messages.map((m, idx) => (
          <div key={m.id} className={`mb-5 flex ${m.from === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
            {m.from === 'assistant' && (
              <div className="mr-3 flex items-start flex-shrink-0 gap-1.5 pt-1">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-soft"><Stethoscope className="h-[18px] w-[18px]" /></div>
                <button
                  onClick={() => {
                    const isCurrentlyPlaying = playingId === m.id
                    
                    if (isCurrentlyPlaying) {
                      // Stop playing
                      window.speechSynthesis.cancel()
                      setPlayingId(null)
                    } else {
                      // Start playing this message
                      window.speechSynthesis.cancel()  // Stop any other playing audio
                      setPlayingId(m.id)
                      
                      const plainText = m.text.replace(/<[^>]*>/g, '').replace(/\*/g, '').replace(/#/g, '')
                      if (window.speechSynthesis) {
                        const utterance = new SpeechSynthesisUtterance(plainText)
                        utterance.rate = 1.0  // Normal speed for clarity
                        utterance.pitch = 1.2  // Higher pitch for clarity
                        utterance.volume = 1  // Max volume
                        
                        // Select best available voice (English)
                        const voices = window.speechSynthesis.getVoices()
                        if (voices.length > 0) {
                          const preferredVoice = voices.find(v => v.lang === 'en-US' || v.lang.startsWith('en')) || voices[0]
                          utterance.voice = preferredVoice
                        }
                        
                        utterance.onend = () => {
                          setPlayingId(null)
                        }
                        utterance.onerror = () => {
                          setPlayingId(null)
                        }
                        
                        window.speechSynthesis.speak(utterance)
                      }
                    }
                  }}
                  className={`p-2 rounded-full transition-all text-healthcare-600 group/btn opacity-0 group-hover:opacity-100 transform hover:scale-110 ${
                    playingId === m.id ? 'bg-red-200 text-red-600' : 'hover:bg-red-100 hover:text-red-600'
                  }`}
                  title={playingId === m.id ? "Stop audio" : "Play audio response"}
                >
                  {playingId === m.id ? (
                    // Stop icon
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v12H4V4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    // Play icon
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.172a1 1 0 011.414 0A6.972 6.972 0 0118 10a6.972 6.972 0 01-1.929 4.828 1 1 0 01-1.414-1.414A4.972 4.972 0 0016 10c0-1.713-.672-3.329-1.864-4.464a1 1 0 010-1.414zm-2.828 2.828a1 1 0 011.414 0A4.972 4.972 0 0116 10a4.972 4.972 0 01-1.464 3.536 1 1 0 01-1.414-1.414A2.972 2.972 0 0014 10c0-.784-.316-1.536-.879-2.121a1 1 0 010-1.414z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => {
                    const plain = m.text.replace(/[*_#`>]/g, '')
                    navigator.clipboard?.writeText(plain).then(() => {
                      setCopiedId(m.id)
                      setTimeout(() => setCopiedId(null), 1500)
                    }).catch(() => {})
                  }}
                  className="p-2 rounded-full transition-all text-healthcare-600 dark:text-healthcare-300 opacity-0 group-hover:opacity-100 transform hover:scale-110 hover:bg-healthcare-100 dark:hover:bg-slate-700"
                  title={copiedId === m.id ? 'Copied!' : 'Copy response'}
                >
                  {copiedId === m.id ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  )}
                </button>
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-soft ${m.from === 'user' ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-br-md' : 'bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-200 border border-ink-200 dark:border-white/10 rounded-bl-md'}`}>
              {m.from === 'assistant' ? renderFormattedText(m.text) : <div className="text-sm leading-relaxed">{m.text}</div>}
              {m.from === 'assistant' && Array.isArray(m.sources) && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-healthcare-100 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                      Based on
                    </span>
                    {m.sources.map((s, si) => (
                      <span
                        key={si}
                        title={s.score != null ? `Relevance: ${Math.round(s.score * 100)}%` : undefined}
                        className="text-[11px] font-medium bg-healthcare-50 dark:bg-slate-700 text-healthcare-700 dark:text-healthcare-300 border border-healthcare-200 dark:border-slate-600 rounded-full px-2.5 py-0.5"
                      >
                        {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {m.from === 'user' && (
              <div className="ml-3 flex items-end flex-shrink-0">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-ink-200 dark:bg-white/10 text-ink-600 dark:text-ink-300 shadow-soft"><User className="h-[18px] w-[18px]" /></div>
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-3 mb-5 animate-fade-in">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-soft"><Stethoscope className="h-[18px] w-[18px]" /></div>
            <div className="bg-white dark:bg-ink-800 border border-ink-200 dark:border-white/10 rounded-2xl rounded-bl-none px-5 py-3.5 shadow-soft">
              <div className="flex gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-brand-400 animate-bounce"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: '0.15s'}}></div>
                <div className="h-2.5 w-2.5 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-ink-100 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] backdrop-blur p-4 sm:p-5">
        <div className="flex gap-3">
          <VoiceChat 
            onVoiceInput={(text) => {
              console.log('Chat received voice input:', text)
              // Send message directly without relying on state
              if (text.trim()) {
                const userMsg = { id: Date.now(), from: 'user', text: text.trim() }
                setMessages(ms => [...ms, userMsg])
                setInput('')
                setTyping(true)
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
                fetch(`${backendUrl}/api/chat`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...authHeaders() },
                  body: JSON.stringify({ message: userMsg.text, conversationId })
                }).then(async res => {
                  setTyping(false)
                  let j = null
                  try {
                    j = await res.json()
                  } catch (e) {}
                  if (!res.ok) {
                    const salvage = j?.reply || j?.debug || j?.partial || (typeof j === 'string' ? j : null)
                    const text = (salvage && typeof salvage === 'string' ? salvage : '') || 'AI unavailable, please try again later.'
                    setMessages(ms => [...ms, { id: Date.now(), from: 'assistant', text }])
                    return
                  }
                  if (j?.reply) {
                    const sources = Array.isArray(j.sources) ? j.sources : []
                    setMessages(ms => [...ms, { id: Date.now(), from: 'assistant', text: j.reply, sources }])
                  }
                }).catch(err => {
                  setTyping(false)
                  console.error('Chat error:', err)
                  setMessages(ms => [...ms, { id: Date.now(), from: 'assistant', text: 'Error connecting to AI. Please try again.' }])
                })
              }
            }}
            isListening={typing}
            isProcessing={typing}
          />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            className="flex-1 rounded-full border border-ink-200 dark:border-white/15 bg-white dark:bg-white/5 text-ink-800 dark:text-ink-100 px-5 py-3 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 text-sm placeholder-ink-400 dark:placeholder-ink-500 transition-all"
            placeholder="Describe your symptoms or ask a question…"
          />
          <button
            onClick={send}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-brand-500 to-brand-600 px-5 py-3 text-white font-semibold shadow-soft hover:shadow-lift hover:-translate-y-0.5 active:translate-y-0 transition-all"
            title="Send message (Shift+Enter for new line)"
          >
            <Send className="h-4 w-4" /> <span className="hidden sm:inline">Send</span>
          </button>
          <button
            onClick={openBooking}
            className="inline-flex items-center gap-2 rounded-full border border-ink-200 dark:border-white/15 bg-white/60 dark:bg-white/5 px-5 py-3 text-ink-700 dark:text-ink-200 font-semibold hover:border-brand-300 hover:text-brand-600 transition-all"
            title="Book an appointment"
          >
            <CalendarPlus className="h-4 w-4" /> <span className="hidden sm:inline">Book</span>
          </button>
        </div>
        <p className="text-[11px] text-ink-400 mt-3 text-center">
          Click the mic to speak · type to chat · hover an answer to copy or hear it
        </p>
      </div>
      {showBooking && (
        <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-white/10 rounded-3xl shadow-lift w-full max-w-2xl max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-soft">
                  <CalendarPlus className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-white leading-tight">Book an appointment</h2>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{bookingStep === 5 ? 'Confirmed' : `Step ${bookingStep} of 4`}</p>
                </div>
              </div>
              <button onClick={closeBooking} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-ink-400 hover:text-ink-700 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-white/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper */}
            {bookingStep <= 4 && (
              <div className="px-6 pt-6">
                <div className="flex items-center">
                  {[{ n: 1, label: 'Symptom', Icon: Search }, { n: 2, label: 'Doctor', Icon: Stethoscope }, { n: 3, label: 'Time', Icon: Clock }, { n: 4, label: 'Details', Icon: User }].map((s, i) => (
                    <div key={s.n} className={`flex items-center ${i < 3 ? 'flex-1' : ''}`}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`grid h-9 w-9 place-items-center rounded-full transition-all ${bookingStep > s.n ? 'bg-brand-500 text-white' : bookingStep === s.n ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white ring-4 ring-brand-500/15' : 'bg-ink-100 dark:bg-white/10 text-ink-400'}`}>
                          {bookingStep > s.n ? <Check className="h-4 w-4" /> : <s.Icon className="h-4 w-4" />}
                        </div>
                        <span className={`text-[11px] font-medium ${bookingStep >= s.n ? 'text-brand-600 dark:text-brand-300' : 'text-ink-400'}`}>{s.label}</span>
                      </div>
                      {i < 3 && <div className={`h-0.5 flex-1 mx-2 mb-5 rounded-full transition-colors ${bookingStep > s.n ? 'bg-brand-400' : 'bg-ink-200 dark:bg-white/10'}`} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6">

              {/* Step 1: Symptom */}
              {bookingStep === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-2">
                      What do you need help with?
                    </label>
                    <input
                      type="text"
                      value={symptomQuery}
                      onChange={(e) => setSymptomQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && symptomQuery.trim() && searchDoctors(symptomQuery.trim())}
                      placeholder="e.g. headache, fever, sore throat…"
                      className="w-full rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-white/5 text-ink-800 dark:text-ink-100 px-4 py-3 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 placeholder-ink-400 dark:placeholder-ink-500 transition-all"
                      autoFocus
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['Headache', 'Fever', 'Cough', 'Sore throat', 'Fatigue'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSymptomQuery(s)}
                          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${symptomQuery === s ? 'border-brand-400 bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300' : 'border-ink-200 dark:border-white/10 text-ink-500 dark:text-ink-400 hover:border-brand-300 hover:text-brand-600'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => symptomQuery.trim() && searchDoctors(symptomQuery.trim())}
                    disabled={!symptomQuery.trim() || searching}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 text-white font-semibold py-3 shadow-soft hover:shadow-lift transition-all disabled:opacity-40 disabled:hover:shadow-soft"
                  >
                    {searching ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching…</> : <><Search className="h-4 w-4" /> Find doctors</>}
                  </button>
                </div>
              )}

            {/* Step 2: Doctor Selection */}
            {bookingStep === 2 && doctors.length > 0 && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  {doctors.length} {doctors.length === 1 ? 'specialist' : 'specialists'} available for <span className="font-medium text-ink-700 dark:text-ink-200">“{symptomQuery}”</span>
                </p>
                <div className="space-y-2.5 max-h-[22rem] overflow-y-auto -mx-1 px-1">
                  {doctors.map((doc) => (
                    <button
                      key={doc._id}
                      onClick={() => loadDoctorSlots(doc._id)}
                      className="w-full text-left rounded-2xl border border-ink-200 dark:border-white/10 bg-white dark:bg-ink-800 p-4 hover:border-brand-400 hover:shadow-card transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold">
                          {doc.name ? doc.name.replace(/^Dr\.?\s*/i, '').split(' ').map(w => w[0]).slice(0, 2).join('') : 'Dr'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-ink-900 dark:text-white truncate group-hover:text-brand-700 dark:group-hover:text-brand-300">{doc.name}</p>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 shrink-0">
                              <Star className="h-3.5 w-3.5 fill-current" /> {doc.rating}
                            </span>
                          </div>
                          <p className="text-xs text-brand-600 dark:text-brand-300 font-medium">{doc.specialty}</p>
                          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-400">
                            {doc.experience_years != null && <span className="inline-flex items-center gap-1"><Award className="h-3 w-3" /> {doc.experience_years}y exp</span>}
                            {doc.availability && <span className="inline-flex items-center gap-1 truncate"><Clock className="h-3 w-3" /> {doc.availability}</span>}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setBookingStep(1)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Change symptom
                </button>
              </div>
            )}

              {/* Step 3: Time Slot Selection */}
              {bookingStep === 3 && slots.length > 0 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-brand-50 dark:bg-brand-500/10 p-6 rounded-2xl border border-brand-200 dark:border-brand-500/20">
                    {selectedDoctor && doctors.find(d => d._id === selectedDoctor) && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white"><Stethoscope className="h-5 w-5" /></span>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-brand-600 dark:text-brand-300 font-semibold">Booking with</p>
                            <p className="text-xl font-semibold text-ink-900 dark:text-white">{doctors.find(d => d._id === selectedDoctor).name}</p>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-ink-900 border border-ink-100 dark:border-white/10 rounded-lg px-4 py-2 inline-block">
                          <p className="text-xs text-brand-700 dark:text-brand-300 font-medium">{doctors.find(d => d._id === selectedDoctor).specialty}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-2xl">🕒</div>
                      <h3 className="text-xl font-black text-healthcare-700 dark:text-slate-100">Choose Your Time</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 font-semibold">Select the slot that works best for you:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                      {slots.map(slot => (
                        <button
                          key={slot._id}
                          onClick={() => {
                            const email = prompt('📧 Enter your email address:')
                            const phone = prompt('📱 Enter your phone number:')
                            if (email && phone) {
                              if (!email.includes('@')) {
                                alert('Please enter a valid email')
                                return
                              }
                              if (phone.length < 7) {
                                alert('Please enter a valid phone number')
                                return
                              }
                              bookSlot(slot._id, email, phone)
                            }
                          }}
                          className="p-4 border-2 border-healthcare-200 dark:border-slate-700 rounded-xl hover:border-healthcare-500 hover:bg-healthcare-100 dark:hover:bg-slate-700 text-center transition-all group hover:shadow-lg transform hover:scale-105 active:scale-95 bg-white dark:bg-slate-900"
                        >
                          <div className="text-sm font-bold text-healthcare-700 dark:text-slate-100 group-hover:text-healthcare-800 mb-2">
                            {new Date(slot.slot_time).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
                          </div>
                          <div className="text-3xl font-black text-healthcare-600 group-hover:text-healthcare-700">
                            {new Date(slot.slot_time).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: true})}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400 mt-2 group-hover:text-gray-700">Available</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setBookingStep(2)}
                    className="w-full border-2 border-healthcare-500 text-healthcare-600 py-4 rounded-xl hover:bg-healthcare-50 dark:hover:bg-slate-700 font-bold transition-all flex items-center justify-center gap-2"
                  >
                    ← Select Different Doctor
                  </button>
                </div>
              )}

              {/* Empty States */}
              {bookingStep === 3 && slots.length === 0 && (
                <div className="text-center py-12 animate-fade-in">
                  <div className="text-5xl mb-4">⏳</div>
                  <p className="text-gray-600 dark:text-slate-400 text-lg font-semibold mb-6">No available slots found</p>
                  <button
                    onClick={() => setBookingStep(2)}
                    className="bg-healthcare-500 text-white px-8 py-3 rounded-xl hover:bg-healthcare-600 font-bold transition-all inline-block"
                  >
                    ← Try Another Doctor
                  </button>
                </div>
              )}

              {bookingStep === 2 && doctors.length === 0 && (
                <div className="text-center py-12 animate-fade-in">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-gray-600 dark:text-slate-400 text-lg font-semibold mb-6">No doctors found for that symptom</p>
                  <button
                    onClick={() => setBookingStep(1)}
                    className="bg-healthcare-500 text-white px-8 py-3 rounded-xl hover:bg-healthcare-600 font-bold transition-all inline-block"
                  >
                    ← Try Different Symptom
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed bottom-8 right-8 z-[60] pl-4 pr-6 py-4 rounded-2xl shadow-lift text-white font-semibold animate-fade-up flex items-center gap-3 ${notification.type === 'success' ? 'bg-gradient-to-r from-brand-500 to-brand-600' : 'bg-gradient-to-r from-rose-500 to-red-500'}`}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
            {notification.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </span>
          <span className="text-sm">{notification.message}</span>
        </div>
      )}
    </div>
  )
}
