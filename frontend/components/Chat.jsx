"use client"
import { useState, useRef, useEffect } from 'react'
import VoiceChat from './VoiceChat'
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
  const [bookingStep, setBookingStep] = useState(1)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [playingId, setPlayingId] = useState(null)  // Track which message is playing
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
  function parseAndFormatResponse(text) {
    const lines = text.split('\n')
    const elements = []
    let currentSection = []
    for (let line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (/^[A-Z][A-Z\s]+:/.test(trimmed)) {
        if (currentSection.length > 0) {
          elements.push(currentSection)
          currentSection = []
        }
        elements.push({ type: 'heading', text: trimmed })
      }
      else if (trimmed.startsWith('-')) {
        currentSection.push({ type: 'bullet', text: trimmed.substring(1).trim() })
      }
      else {
        currentSection.push({ type: 'paragraph', text: trimmed })
      }
    }
    if (currentSection.length > 0) {
      elements.push(currentSection)
    }
    return elements
  }
  function renderFormattedText(text) {
    const elements = parseAndFormatResponse(text)
    return (
      <div className="space-y-3">
        {elements.map((el, idx) => {
          if (el.type === 'heading') {
            return (
              <div key={idx} className="font-bold text-healthcare-700 text-sm mt-2">
                {el.text}
              </div>
            )
          } else if (Array.isArray(el)) {
            return (
              <div key={idx} className="space-y-1">
                {el.map((item, itemIdx) => {
                  if (item.type === 'bullet') {
                    return (
                      <div key={itemIdx} className="flex gap-2 text-sm">
                        <span className="text-healthcare-600">•</span>
                        <span>{item.text}</span>
                      </div>
                    )
                  } else if (item.type === 'paragraph') {
                    return (
                      <div key={itemIdx} className="text-sm leading-relaxed">
                        {item.text}
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            )
          }
          return null
        })}
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
      headers: { 'Content-Type': 'application/json' },
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
  function searchDoctors(symptom) {
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
      alert('Failed to search doctors')
    })
  }
  function loadDoctorSlots(doctorId) {
    setSelectedDoctor(doctorId)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    fetch(`${backendUrl}/api/doctors/${doctorId}/slots?days=7`, {
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()).then(data => {
      setSlots(data.slots || [])
      setBookingStep(3)
    }).catch(err => {
      console.error('Slots error:', err)
      alert('Failed to load slots')
    })
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
    <div className="flex max-w-4xl mx-auto flex-col gap-4 h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-healthcare-600 to-healthcare-700 text-white p-6 rounded-b-2xl shadow-lg">
        <h1 className="text-2xl font-bold">🏥 AI Healthcare Assistant</h1>
        <p className="text-healthcare-100 text-sm mt-1">Get instant health guidance & book appointments</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 rounded-xl border border-healthcare-200 bg-gradient-to-b from-healthcare-50 to-white p-6 overflow-y-auto shadow-inner" ref={listRef}>
        {!loaded && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin text-4xl mb-3">⌛</div>
              <p className="text-gray-500 font-semibold">Loading conversation...</p>
            </div>
          </div>
        )}
        {loaded && messages.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl">👋</div>
            <h2 className="text-xl font-bold text-healthcare-700">Welcome!</h2>
            <p className="text-gray-600 max-w-sm mx-auto">Tell me about your symptoms and I'll provide guidance. You can also book appointments with doctors.</p>
            <div className="flex gap-2 justify-center flex-wrap mt-6">
              <span className="text-xs bg-healthcare-100 text-healthcare-700 px-3 py-1 rounded-full">💡 Try: "I have a headache"</span>
              <span className="text-xs bg-healthcare-100 text-healthcare-700 px-3 py-1 rounded-full">💡 Try: "What helps with fever?"</span>
              <span className="text-xs bg-healthcare-100 text-healthcare-700 px-3 py-1 rounded-full">💡 Try: "I'm feeling dizzy"</span>
            </div>
          </div>
        )}
        {loaded && messages.map((m, idx) => (
          <div key={m.id} className={`mb-5 flex ${m.from === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
            {m.from === 'assistant' && (
              <div className="mr-4 flex items-start flex-shrink-0 gap-2 pt-1">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-healthcare-400 to-healthcare-600 flex items-center justify-center text-white font-bold shadow-md">🤖</div>
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
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-5 py-4 shadow-md ${m.from === 'user' ? 'bg-gradient-to-br from-healthcare-500 to-healthcare-600 text-white rounded-br-none' : 'bg-white text-healthcare-800 border border-healthcare-200 rounded-bl-none'}`}>
              {m.from === 'assistant' ? renderFormattedText(m.text) : <div className="text-sm leading-relaxed">{m.text}</div>}
              {m.from === 'assistant' && Array.isArray(m.sources) && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-healthcare-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                      Based on
                    </span>
                    {m.sources.map((s, si) => (
                      <span
                        key={si}
                        title={s.score != null ? `Relevance: ${Math.round(s.score * 100)}%` : undefined}
                        className="text-[11px] font-medium bg-healthcare-50 text-healthcare-700 border border-healthcare-200 rounded-full px-2.5 py-0.5"
                      >
                        {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {m.from === 'user' && (
              <div className="ml-4 flex items-end flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">👤</div>
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-3 mb-5 animate-fade-in">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-healthcare-400 to-healthcare-600 flex items-center justify-center text-white font-bold shadow-md">🤖</div>
            <div className="bg-white border border-healthcare-200 rounded-2xl rounded-bl-none px-5 py-3 shadow-md">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-healthcare-400 animate-bounce"></div>
                <div className="h-3 w-3 rounded-full bg-healthcare-400 animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="h-3 w-3 rounded-full bg-healthcare-400 animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-healthcare-200 p-6 rounded-t-2xl shadow-lg">
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
                  headers: { 'Content-Type': 'application/json' },
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
            className="flex-1 rounded-full border-2 border-healthcare-200 px-5 py-3 focus:outline-none focus:border-healthcare-500 focus:ring-2 focus:ring-healthcare-200 text-sm placeholder-gray-400 transition-all" 
            placeholder="Describe your symptoms or ask a question..." 
          />
          <button 
            onClick={send} 
            className="rounded-full bg-healthcare-500 px-6 py-3 text-white hover:bg-healthcare-600 font-bold transition-all hover:shadow-lg transform hover:scale-105 active:scale-95"
            title="Send message (Shift+Enter for new line)"
          >
            ➤ Send
          </button>
          <button 
            onClick={() => { setShowBooking(true); setBookingStep(1) }} 
            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-white hover:shadow-lg font-bold transition-all transform hover:scale-105 active:scale-95"
          >
            📅 Book
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          🎤 <strong>Hold microphone</strong> to speak • 💬 <strong>Type</strong> to chat • 🔊 <strong>Hover & click speaker</strong> on AI messages to hear responses
        </p>
      </div>
      {showBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-healthcare-600 to-healthcare-700 text-white p-8 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">📅 Book an Appointment</h2>
                  <p className="text-healthcare-100 text-sm mt-2">Find the perfect doctor for your needs</p>
                </div>
                <button onClick={() => setShowBooking(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all text-2xl w-12 h-12 flex items-center justify-center">✕</button>
              </div>
            </div>

            <div className="p-8">
              {/* Progress Indicator */}
              <div className="flex gap-3 mb-8">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${bookingStep >= step ? 'bg-healthcare-500 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>
                      {step === 1 ? '🔍' : step === 2 ? '👨‍⚕️' : '🕒'}
                    </div>
                    <div className={`text-xs mt-2 font-semibold ${bookingStep >= step ? 'text-healthcare-600' : 'text-gray-500'}`}>
                      {step === 1 ? 'Symptom' : step === 2 ? 'Doctor' : 'Time'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Step 1: Symptom Input */}
              {bookingStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-gradient-to-br from-healthcare-50 to-blue-50 p-6 rounded-2xl border-2 border-healthcare-200">
                    <label className="block text-lg font-bold text-healthcare-700 mb-3">
                      What symptom or condition do you need help with?
                    </label>
                    <input
                      id="symptom-input"
                      type="text"
                      placeholder="e.g., headache, fever, cold, chest pain, sore throat..."
                      className="w-full px-5 py-4 border-2 border-healthcare-300 rounded-xl focus:outline-none focus:border-healthcare-500 focus:ring-2 focus:ring-healthcare-200 text-base transition-all placeholder-gray-400"
                      autoFocus
                    />
                    <p className="text-xs text-gray-600 mt-3 flex items-center gap-2">
                      <span>💡</span> We'll find specialized doctors for your condition
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const symptom = document.getElementById('symptom-input').value
                      if (symptom.trim()) searchDoctors(symptom)
                      else alert('Please enter a symptom')
                    }}
                    className="w-full bg-gradient-to-r from-healthcare-500 to-healthcare-600 text-white py-4 rounded-xl hover:shadow-xl font-bold transition-all transform hover:scale-105 active:scale-95 text-lg"
                  >
                    🔍 Search Doctors
                  </button>
                </div>
              )}

            {/* Step 2: Doctor Selection */}
            {bookingStep === 2 && doctors.length > 0 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-gradient-to-r from-healthcare-100 to-green-100 p-5 rounded-2xl border-2 border-green-400 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-900 font-bold">✓ Success!</p>
                    <p className="text-lg font-black text-green-900">{doctors.length} Specialist{doctors.length !== 1 ? 's' : ''} Found</p>
                  </div>
                  <div className="text-4xl">👨‍⚕️</div>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {doctors.map((doc, idx) => (
                    <div
                      key={doc._id}
                      onClick={() => loadDoctorSlots(doc._id)}
                      className="border-2 border-healthcare-200 rounded-2xl p-6 hover:border-healthcare-500 hover:bg-gradient-to-br hover:from-healthcare-50 hover:to-white cursor-pointer transition-all transform hover:scale-102 hover:shadow-xl bg-white group"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-healthcare-400 to-healthcare-600 flex items-center justify-center text-white font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-lg text-healthcare-700 group-hover:text-healthcare-800">{doc.name}</p>
                              <p className="text-xs text-gray-500">{doc.specialty}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">{doc.qualifications}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-2xl">⭐</span>
                            <span className="font-black text-lg text-yellow-600">{doc.rating}</span>
                          </div>
                          <p className="text-xs text-gray-600 font-semibold">{doc.experience_years}y exp</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-4 text-xs text-gray-600 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">📱 {doc.phone}</span>
                        <span className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">🕒 {doc.availability}</span>
                      </div>
                      <div className="mt-4 text-right">
                        <span className="inline-block bg-healthcare-500 text-white px-5 py-2 rounded-full text-xs font-bold group-hover:bg-healthcare-600 transition-all">
                          View Available Times →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setBookingStep(1)}
                  className="w-full border-2 border-healthcare-500 text-healthcare-600 py-4 rounded-xl hover:bg-healthcare-50 font-bold transition-all flex items-center justify-center gap-2"
                >
                  ← Change Symptom
                </button>
              </div>
            )}

              {/* Step 3: Time Slot Selection */}
              {bookingStep === 3 && slots.length > 0 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl border-2 border-purple-300">
                    {selectedDoctor && doctors.find(d => d._id === selectedDoctor) && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">👨‍⚕️</span>
                          <div>
                            <p className="text-xs text-purple-900 font-bold">BOOKING WITH</p>
                            <p className="text-2xl font-black text-purple-900">{doctors.find(d => d._id === selectedDoctor).name}</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg px-4 py-2 inline-block">
                          <p className="text-xs text-purple-700 font-semibold">{doctors.find(d => d._id === selectedDoctor).specialty}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-2xl">🕒</div>
                      <h3 className="text-xl font-black text-healthcare-700">Choose Your Time</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 font-semibold">Select the slot that works best for you:</p>
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
                          className="p-4 border-2 border-healthcare-200 rounded-xl hover:border-healthcare-500 hover:bg-healthcare-100 text-center transition-all group hover:shadow-lg transform hover:scale-105 active:scale-95 bg-white"
                        >
                          <div className="text-sm font-bold text-healthcare-700 group-hover:text-healthcare-800 mb-2">
                            {new Date(slot.slot_time).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
                          </div>
                          <div className="text-3xl font-black text-healthcare-600 group-hover:text-healthcare-700">
                            {new Date(slot.slot_time).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: true})}
                          </div>
                          <div className="text-xs text-gray-500 mt-2 group-hover:text-gray-700">Available</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setBookingStep(2)}
                    className="w-full border-2 border-healthcare-500 text-healthcare-600 py-4 rounded-xl hover:bg-healthcare-50 font-bold transition-all flex items-center justify-center gap-2"
                  >
                    ← Select Different Doctor
                  </button>
                </div>
              )}

              {/* Empty States */}
              {bookingStep === 3 && slots.length === 0 && (
                <div className="text-center py-12 animate-fade-in">
                  <div className="text-5xl mb-4">⏳</div>
                  <p className="text-gray-600 text-lg font-semibold mb-6">No available slots found</p>
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
                  <p className="text-gray-600 text-lg font-semibold mb-6">No doctors found for that symptom</p>
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
        <div className={`fixed bottom-8 right-8 px-8 py-5 rounded-full shadow-2xl text-white font-bold animate-bounce-gentle transition-all transform scale-110 flex items-center gap-3 ${notification.type === 'success' ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}>
          <span className="text-2xl">{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  )
}
