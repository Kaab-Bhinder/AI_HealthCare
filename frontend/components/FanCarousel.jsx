"use client"
import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight, Stethoscope, HeartPulse, Brain, Baby, Bone, Wind, Sparkles } from 'lucide-react'
import SmartImage from './SmartImage'

const U = 'https://images.unsplash.com/photo-'
const CARDS = [
  { name: 'General Medicine', tag: 'Everyday health, handled with care', icon: Stethoscope,
    img: `${U}1584982751601-97dcc096659c?w=700&q=65&auto=format&fit=crop`, fb: 'from-brand-500 to-brand-800' },
  { name: 'Cardiology', tag: 'For every beat of your heart', icon: HeartPulse,
    img: `${U}1628348068343-c6a848d2b6dd?w=700&q=65&auto=format&fit=crop`, fb: 'from-coral-400 to-coral-600' },
  { name: 'Neurology', tag: 'Headaches, migraines & nerve care', icon: Brain,
    img: `${U}1559757148-5c350d0d3c56?w=700&q=65&auto=format&fit=crop`, fb: 'from-brand-600 to-ink-900' },
  { name: 'Pediatrics', tag: 'Gentle care for little ones', icon: Baby,
    img: `${U}1503454537195-1dcabb73ffb9?w=700&q=65&auto=format&fit=crop`, fb: 'from-brand-400 to-brand-700' },
  { name: 'Orthopedics', tag: 'Joints, bones & movement', icon: Bone,
    img: `${U}1571019613454-1cb2f99b2d8b?w=700&q=65&auto=format&fit=crop`, fb: 'from-ink-700 to-ink-950' },
  { name: 'Pulmonology', tag: 'Breathe easier, live fuller', icon: Wind,
    img: `${U}1506126613408-eca07ce68773?w=700&q=65&auto=format&fit=crop`, fb: 'from-brand-700 to-brand-900' },
]

/** Voyage-style fanned deck: receding overlapping cards with a big title overlay. */
export default function FanCarousel() {
  const [active, setActive] = useState(0)
  const n = CARDS.length
  const prev = () => setActive((a) => (a - 1 + n) % n)
  const next = () => setActive((a) => (a + 1) % n)
  const card = CARDS[active]

  return (
    <section id="specialties" className="relative overflow-hidden bg-ink-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.14),transparent_65%)]" />
      <div className="relative mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-brand-300" /> Explore specialties
          </span>
        </div>

        {/* Deck */}
        <div className="relative mt-10 h-[440px] sm:h-[480px]">
          <div className="absolute inset-0 flex items-center justify-center">
            {CARDS.map((c, i) => {
              let rel = i - active
              if (rel > n / 2) rel -= n
              if (rel < -n / 2) rel += n
              const abs = Math.abs(rel)
              const visible = abs <= 2
              return (
                <button
                  key={c.name}
                  onClick={() => setActive(i)}
                  aria-label={c.name}
                  className="absolute rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ease-out will-change-transform"
                  style={{
                    width: 250, height: 380,
                    transform: `translateX(${rel * 200}px) scale(${1 - abs * 0.13})`,
                    zIndex: 20 - abs,
                    opacity: visible ? (abs === 0 ? 1 : 0.55) : 0,
                    pointerEvents: visible ? 'auto' : 'none',
                    filter: abs === 0 ? 'none' : 'brightness(0.7) saturate(0.85)',
                  }}
                >
                  <SmartImage src={c.img} className="absolute inset-0 h-full w-full object-cover" fallbackClassName={`bg-gradient-to-br ${c.fb}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-ink-950/20" />
                  <span className="absolute top-4 left-4 grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur text-white">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <span className="absolute bottom-4 left-4 right-4 text-left text-sm font-semibold text-white/95">{c.name}</span>
                </button>
              )
            })}
          </div>

          {/* Big title overlay */}
          <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6">
            <h2 key={card.name} className="font-display text-4xl sm:text-6xl font-bold uppercase tracking-wide text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] animate-fade-up">
              {card.name}
            </h2>
            <p className="mt-3 text-white/85 drop-shadow-md animate-fade-in">{card.tag}</p>
          </div>

          {/* Arrows */}
          <button onClick={prev} aria-label="Previous specialty"
            className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur text-white hover:bg-white/25 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} aria-label="Next specialty"
            className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur text-white hover:bg-white/25 transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 text-center">
          <Link href="/consult" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-ink-900 shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all">
            Consult a {card.name.toLowerCase().includes('general') ? 'doctor' : `${card.name} specialist`} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
