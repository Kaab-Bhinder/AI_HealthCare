"use client"
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown, Sparkles, Stethoscope, HeartPulse } from 'lucide-react'
import SmartImage from './SmartImage'

const CHAPTERS = [
  {
    icon: Sparkles,
    kicker: 'AI-guided care',
    title: <>Understand your <Accent>health</Accent>,<br />without the worry.</>,
    sub: 'Describe your symptoms in your own words — no forms, no jargon. Auravia listens, understands, and guides you calmly toward the right care.',
    img: '/images/pic1.jpg',
    fallback: 'bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950',
  },
  {
    icon: Stethoscope,
    kicker: 'Smart matching',
    title: <>The right <Accent>doctor</Accent>,<br />at the right time.</>,
    sub: 'Our AI reads your symptoms, finds the specialist you need, and books the earliest slot that fits your day — with your preferences respected.',
    img: '/images/pic2.jpg',
    fallback: 'bg-gradient-to-br from-ink-900 via-brand-900 to-ink-950',
  },
  {
    icon: HeartPulse,
    kicker: 'Always with you',
    title: <>Care that <Accent>stays</Accent><br />by your side.</>,
    sub: 'Every conversation, appointment and piece of guidance is saved to your account, ready whenever you need it — and in an emergency, help is one tap away on 1122.',
    img: '/images/pic6.jpg',
    fallback: 'bg-gradient-to-br from-brand-900 via-ink-900 to-ink-950',
  },
]

/** Theme-colored highlight for the key word in each headline. */
function Accent({ children }) {
  return (
    <span className="bg-gradient-to-r from-brand-300 via-teal-300 to-brand-400 bg-clip-text text-transparent">
      {children}
    </span>
  )
}


/**
 * Scrollytelling hero: the section is N screens tall; the viewport stays
 * pinned while the background image and headline crossfade as you scroll.
 */
export default function ScrollyHero() {
  const ref = useRef(null)
  const [idx, setIdx] = useState(0)
  const [frac, setFrac] = useState(0) // 0..1 progress *within* the active chapter

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        const total = el.offsetHeight - window.innerHeight
        const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total)
        const p = total > 0 ? (scrolled / total) * CHAPTERS.length : 0
        const i = Math.min(CHAPTERS.length - 1, Math.floor(p))
        setIdx(i)
        setFrac(Math.min(1, Math.max(0, p - i)))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  // Scroll-linked text motion: the copy drifts upward as you scroll and fades
  // near the chapter boundary, where the next chapter's copy takes over.
  const isLast = idx === CHAPTERS.length - 1
  const drift = isLast ? Math.min(frac, 0.5) * 60 : frac * 120
  const fade = isLast ? 1 : (frac < 0.8 ? 1 : 1 - (frac - 0.8) / 0.2)

  return (
    <section ref={ref} style={{ height: `${CHAPTERS.length * 100}vh` }} className="relative -mt-16">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Backgrounds */}
        {CHAPTERS.map((c, i) => (
          <div key={i} aria-hidden={i !== idx}
            className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${i === idx ? 'opacity-100' : 'opacity-0'}`}>
            {/* blur-[8px] softens the close-up photos into atmosphere; scale-110
                hides the transparent edge fringe that CSS blur creates. */}
            <SmartImage src={c.img} eager={i === 0} fallbackClassName={c.fallback}
              className="absolute inset-0 h-full w-full object-cover scale-110 blur-[8px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/45 to-ink-950/40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,17,32,0.55),rgba(11,17,32,0.25)_60%,transparent)]" />
          </div>
        ))}

        {/* Copy — centered; drifts upward with the scroll, hands off at boundaries */}
        <div className="relative h-full mx-auto max-w-6xl px-6 flex items-center justify-center text-center">
          <div className="max-w-3xl pt-16" style={{ transform: `translateY(${-drift}px)`, opacity: fade }}>
            {CHAPTERS.map((c, i) => (
              <div key={i} className={`transition-opacity duration-500 ${i === idx ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                {i === idx && (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
                      <c.icon className="h-3.5 w-3.5" /> {c.kicker}
                    </span>
                    <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.02] text-white drop-shadow-lg">
                      {c.title}
                    </h1>
                    <p className="mt-6 max-w-xl mx-auto text-lg text-white/85 leading-relaxed drop-shadow">{c.sub}</p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      <Link href="/consult" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-brand-700 shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all">
                        Start free consultation <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link href="/register" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 backdrop-blur px-7 py-3.5 font-semibold text-white hover:bg-white/20 transition-all">
                        Create account
                      </Link>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Seamless handoff into the dark stats/deck sections below */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-ink-950 to-transparent" />

        {/* Chapter dots */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-3">
          {CHAPTERS.map((_, i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${i === idx ? 'bg-white scale-125' : 'bg-white/35'}`} />
          ))}
        </div>

        {/* Scroll hint */}
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/70 transition-opacity duration-500 ${idx === CHAPTERS.length - 1 ? 'opacity-0' : 'opacity-100'}`}>
          <span className="text-[10px] font-medium uppercase tracking-[0.3em]">Scroll</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </div>
      </div>
    </section>
  )
}
