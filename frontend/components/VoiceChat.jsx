"use client"
import { useState, useRef, useEffect } from 'react'

export default function VoiceChat({ onVoiceInput, isListening, isProcessing }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [lastTranscript, setLastTranscript] = useState('')
  const recognitionRef = useRef(null)
  const synthesisRef = useRef(null)
  const transcriptTimeoutRef = useRef(null)

  useEffect(() => {
    // Check for browser support - try multiple APIs
    const SpeechRecognition = 
      window.SpeechRecognition || 
      window.webkitSpeechRecognition || 
      window.mozSpeechRecognition ||
      window.msSpeechRecognition
    
    const SpeechSynthesis = window.speechSynthesis

    // If neither API is available, disable voice
    if (!SpeechRecognition || !SpeechSynthesis) {
      console.log('Speech APIs not available:', {
        recognition: !!SpeechRecognition,
        synthesis: !!SpeechSynthesis,
        userAgent: navigator.userAgent
      })
      setVoiceSupported(false)
      return
    }

    try {
      recognitionRef.current = new SpeechRecognition()
      synthesisRef.current = SpeechSynthesis

      // Configure speech recognition
      recognitionRef.current.continuous = true  // Keep listening for multiple words
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'  // English only

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started')
        setIsRecording(true)
      }

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        console.log('Result event:', { resultIndex: event.resultIndex, resultsLength: event.results.length })
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          console.log(`Result ${i}:`, transcript, 'isFinal:', event.results[i].isFinal)
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript.trim()) {
          console.log('✓ Final transcript:', finalTranscript.trim())
          // Backend will auto-detect language (Urdu/English) and respond in same language
          setLastTranscript(finalTranscript.trim())
          onVoiceInput(finalTranscript.trim())
          
          // Clear the transcript display after 2 seconds
          if (transcriptTimeoutRef.current) {
            clearTimeout(transcriptTimeoutRef.current)
          }
          transcriptTimeoutRef.current = setTimeout(() => {
            setLastTranscript('')
          }, 2000)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended')
        setIsRecording(false)
      }

      // Expose globally for text-to-speech
      window.assistantVoice = {
        speak: (text) => playAudio(text),
        stop: () => stopAudio()
      }
    } catch (error) {
      console.error('Error initializing speech recognition:', error)
      setVoiceSupported(false)
    }
  }, [onVoiceInput])

  const startListening = () => {
    if (!recognitionRef.current) return
    try {
      console.log('Starting recognition...')
      recognitionRef.current.start()
      setIsRecording(true)
    } catch (e) {
      if (e.name !== 'InvalidStateError') {
        console.error('❌ Recognition start error:', e)
      } else {
        // Already listening, that's ok
        console.log('Already listening')
      }
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current) return
    try {
      console.log('Stopping recognition...')
      // Use stop() instead of abort() to allow final result to be processed
      recognitionRef.current.stop()
    } catch (e) {
      console.error('Stop error:', e)
    }
    // Don't immediately set to false, let onend handler do it
  }

  const playAudio = (text) => {
    if (!synthesisRef.current || !voiceSupported) return

    // Cancel any ongoing speech
    synthesisRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0  // Normal speed for clarity
    utterance.pitch = 1.2  // Slightly higher pitch for clarity
    utterance.volume = 1  // Max volume

    // Select best available voice (prefer female, natural voices)
    const voices = synthesisRef.current.getVoices()
    if (voices.length > 0) {
      // Try to find a good English voice
      const preferredVoice = voices.find(v => v.lang === 'en-US' || v.lang.startsWith('en')) || voices[0]
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthesisRef.current.speak(utterance)
  }

  const stopAudio = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  if (!voiceSupported) {
    return (
      <div className="text-xs text-gray-500 text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
        🎤 Voice chat not supported in your browser
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-center">
      {/* Microphone Button */}
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          startListening()
        }}
        onMouseUp={(e) => {
          e.preventDefault()
          stopListening()
        }}
        onMouseLeave={stopListening}
        onTouchStart={(e) => {
          e.preventDefault()
          startListening()
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          stopListening()
        }}
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        className={`relative p-3 rounded-full transition-all transform hover:scale-110 active:scale-95 flex-shrink-0 cursor-pointer ${
          isRecording
            ? 'bg-red-500 text-white shadow-lg animate-pulse ring-4 ring-red-300'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="Hold to record voice"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a4 4 0 100 8 4 4 0 000-8zM3.172 5.172a6 6 0 018.364 0M9 11a3 3 0 110 6 3 3 0 010-6z" />
        </svg>
        {isRecording && (
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-75"></span>
        )}
      </button>

      {/* Status Text */}
      {isRecording && (
        <span className="text-xs font-bold text-red-500 animate-pulse">
          🎙️ Recording...
        </span>
      )}
      {lastTranscript && !isRecording && (
        <span className="text-xs font-bold text-green-500 animate-pulse">
          ✓ "{lastTranscript.substring(0, 30)}{lastTranscript.length > 30 ? '...' : ''}"
        </span>
      )}
      {isSpeaking && (
        <span className="text-xs font-bold text-blue-500 animate-pulse">
          🔊 Playing...
        </span>
      )}
    </div>
  )
}
