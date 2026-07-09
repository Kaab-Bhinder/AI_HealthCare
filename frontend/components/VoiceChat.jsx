"use client"
import { useState, useRef, useEffect } from 'react'

/**
 * Cross-browser voice input.
 *
 * The old version used the Web Speech API (webkitSpeechRecognition), which only
 * exists in Chrome/Edge/Safari and is completely absent in Firefox. This version
 * records the microphone with MediaRecorder (supported in every modern browser),
 * re-encodes the audio to 16 kHz mono WAV in the browser, and sends it to the
 * backend which transcribes it with Gemini. That makes voice input work
 * everywhere, not just in webkit browsers.
 *
 * Text-to-speech still uses speechSynthesis (that half already works broadly).
 */
export default function VoiceChat({ onVoiceInput }) {
  const [status, setStatus] = useState('idle') // idle | recording | transcribing | error
  const [errorMsg, setErrorMsg] = useState('')
  const [supported, setSupported] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const synthesisRef = useRef(null)

  useEffect(() => {
    const hasRecorder =
      typeof window !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window.MediaRecorder !== 'undefined' &&
      (window.AudioContext || window.webkitAudioContext)

    if (!hasRecorder) {
      setSupported(false)
    }

    // Text-to-speech setup (unchanged, broadly supported incl. Firefox)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis
      window.assistantVoice = {
        speak: (text) => playAudio(text),
        stop: () => stopAudio(),
      }
    }

    return () => stopStream()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- recording --------------------------------------------------------
  const startRecording = async () => {
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = handleRecordingStop
      recorder.start()
      setStatus('recording')
    } catch (err) {
      console.error('Microphone error:', err)
      if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        setErrorMsg('Microphone access denied. Please allow it in your browser.')
      } else {
        setErrorMsg('Could not access microphone.')
      }
      setStatus('error')
      stopStream()
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop() // fires onstop -> handleRecordingStop
    }
  }

  const handleRecordingStop = async () => {
    stopStream()
    const blob = new Blob(chunksRef.current, {
      type: chunksRef.current[0]?.type || 'audio/webm',
    })
    if (!blob.size) {
      setStatus('idle')
      return
    }

    setStatus('transcribing')
    try {
      const wavBase64 = await blobToWavBase64(blob)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const res = await fetch(`${backendUrl}/api/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: wavBase64, mime_type: 'audio/wav' }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(j.error || 'Transcription failed. Please try again.')
        setStatus('error')
        return
      }
      const text = (j.text || '').trim()
      if (!text) {
        setErrorMsg("Didn't catch that — please try speaking again.")
        setStatus('error')
        return
      }
      setStatus('idle')
      onVoiceInput(text)
    } catch (err) {
      console.error('Transcription error:', err)
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const toggleRecording = () => {
    if (status === 'recording') stopRecording()
    else if (status !== 'transcribing') startRecording()
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  // ---- WAV encoding (16 kHz mono) --------------------------------------
  const blobToWavBase64 = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer()
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    const audioCtx = new AudioCtx()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    audioCtx.close()

    const targetRate = 16000
    const mono = downmixToMono(audioBuffer)
    const resampled = resample(mono, audioBuffer.sampleRate, targetRate)
    const wavBuffer = encodeWav(resampled, targetRate)

    // Convert to base64 without blowing the call stack on large arrays.
    const bytes = new Uint8Array(wavBuffer)
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
    }
    return btoa(binary)
  }

  const downmixToMono = (audioBuffer) => {
    const n = audioBuffer.length
    const channels = audioBuffer.numberOfChannels
    const out = new Float32Array(n)
    for (let c = 0; c < channels; c++) {
      const data = audioBuffer.getChannelData(c)
      for (let i = 0; i < n; i++) out[i] += data[i] / channels
    }
    return out
  }

  const resample = (samples, srcRate, targetRate) => {
    if (srcRate === targetRate) return samples
    const ratio = srcRate / targetRate
    const newLen = Math.round(samples.length / ratio)
    const out = new Float32Array(newLen)
    for (let i = 0; i < newLen; i++) {
      const idx = i * ratio
      const i0 = Math.floor(idx)
      const i1 = Math.min(i0 + 1, samples.length - 1)
      const frac = idx - i0
      out[i] = samples[i0] * (1 - frac) + samples[i1] * frac
    }
    return out
  }

  const encodeWav = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
    }
    writeStr(0, 'RIFF')
    view.setUint32(4, 36 + samples.length * 2, true)
    writeStr(8, 'WAVE')
    writeStr(12, 'fmt ')
    view.setUint32(16, 16, true)          // subchunk size
    view.setUint16(20, 1, true)           // PCM
    view.setUint16(22, 1, true)           // mono
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true) // byte rate
    view.setUint16(32, 2, true)           // block align
    view.setUint16(34, 16, true)          // bits per sample
    writeStr(36, 'data')
    view.setUint32(40, samples.length * 2, true)
    let offset = 44
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }
    return buffer
  }

  // ---- text-to-speech ---------------------------------------------------
  const playAudio = (text) => {
    if (!synthesisRef.current) return
    synthesisRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.1
    utterance.volume = 1
    const voices = synthesisRef.current.getVoices()
    if (voices.length > 0) {
      utterance.voice =
        voices.find((v) => v.lang === 'en-US' || v.lang.startsWith('en')) || voices[0]
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

  // ---- UI ---------------------------------------------------------------
  if (!supported) {
    return (
      <div className="text-xs text-gray-500 text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
        🎤 Voice recording isn't available in this browser
      </div>
    )
  }

  const isRecording = status === 'recording'
  const isTranscribing = status === 'transcribing'

  return (
    <div className="flex gap-2 items-center">
      <button
        type="button"
        onClick={toggleRecording}
        disabled={isTranscribing}
        aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
        className={`relative p-3 rounded-full transition-all transform hover:scale-110 active:scale-95 flex-shrink-0 ${
          isRecording
            ? 'bg-red-500 text-white shadow-lg ring-4 ring-red-300'
            : isTranscribing
            ? 'bg-blue-100 text-blue-500 cursor-wait'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title={isRecording ? 'Click to stop' : 'Click to speak'}
      >
        {isTranscribing ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a4 4 0 100 8 4 4 0 000-8zM3.172 5.172a6 6 0 018.364 0M9 11a3 3 0 110 6 3 3 0 010-6z" />
          </svg>
        )}
        {isRecording && (
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-75"></span>
        )}
      </button>

      {isRecording && (
        <span className="text-xs font-bold text-red-500 animate-pulse">🎙️ Recording… click to stop</span>
      )}
      {isTranscribing && (
        <span className="text-xs font-bold text-blue-500 animate-pulse">✍️ Transcribing…</span>
      )}
      {status === 'error' && errorMsg && (
        <span className="text-xs font-medium text-amber-600">{errorMsg}</span>
      )}
      {isSpeaking && !isRecording && !isTranscribing && (
        <span className="text-xs font-bold text-blue-500 animate-pulse">🔊 Playing…</span>
      )}
    </div>
  )
}
