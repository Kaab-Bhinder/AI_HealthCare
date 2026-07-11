import Link from 'next/link'
import {
  ArrowRight, Sparkles, Stethoscope, HeartPulse, Brain, Baby, Bone, Wind, Ear, Pill,
  Mic, ShieldCheck, Clock, Star, CalendarCheck, ChevronRight, Quote, MessageCircle, Search, BookOpen,
} from 'lucide-react'
import { Blob, Leaf, Wave, DoctorAvatar } from '../components/Organic'

const specialties = [
  { icon: Stethoscope, name: 'General', tint: 'from-brand-400 to-brand-600' },
  { icon: Brain, name: 'Neurology', tint: 'from-brand-400 to-brand-600' },
  { icon: HeartPulse, name: 'Cardiology', tint: 'from-coral-400 to-coral-500' },
  { icon: Baby, name: 'Pediatrics', tint: 'from-brand-400 to-brand-600' },
  { icon: Bone, name: 'Orthopedics', tint: 'from-brand-400 to-brand-600' },
  { icon: Wind, name: 'Pulmonology', tint: 'from-brand-400 to-brand-600' },
  { icon: Ear, name: 'ENT', tint: 'from-coral-400 to-coral-500' },
  { icon: Pill, name: 'Dermatology', tint: 'from-brand-400 to-brand-600' },
]

const steps = [
  { icon: MessageCircle, title: 'Describe', desc: 'Tell us how you feel — type or just speak.' },
  { icon: Search, title: 'We match', desc: 'AI finds the right specialty and the best-fit doctor.' },
  { icon: CalendarCheck, title: 'Book', desc: 'Pick the earliest or preferred slot in seconds.' },
]

const faqs = [
  { q: 'Is this a replacement for a real doctor?', a: 'No. Auravia offers initial guidance and triage, then connects you to a qualified professional for diagnosis and care.' },
  { q: 'How does the doctor matching work?', a: 'You describe your symptoms; our AI identifies the right specialty and ranks doctors by fit, rating, and earliest availability — honouring your gender and time preferences.' },
  { q: 'Is my information private?', a: 'Yes. Your data stays yours, and every request is protected. No personal health data is sold or shared.' },
  { q: 'What if it is an emergency?', a: 'If we detect emergency signs, we surface an immediate ambulance call. For emergencies always call your local number right away.' },
]

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ===================== HERO ===================== */}
      <section className="relative">
        <Blob className="absolute -top-24 -right-24 w-[34rem] h-[34rem] text-brand-200/50 dark:text-brand-500/15" />
        <Blob className="absolute top-40 -left-40 w-[28rem] h-[28rem] text-coral-200/50 dark:text-coral-500/10" />
        <Leaf className="absolute top-24 right-[42%] w-16 text-brand-300/50 rotate-12 hidden lg:block" />
        <Leaf className="absolute bottom-10 left-[8%] w-14 text-brand-300/40 -rotate-45 hidden lg:block" />

        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-28 lg:pt-24">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
            {/* Copy */}
            <div className="animate-fade-up">
              <span className="chip"><Sparkles className="h-3.5 w-3.5 text-brand-500" /> AI-guided care, made calm</span>
              <h1 className="mt-6 font-display text-5xl sm:text-6xl font-semibold leading-[1.03] tracking-tight text-ink-900 dark:text-white">
                Feel unwell?{' '}
                <span className="relative whitespace-nowrap">
                  <span className="text-gradient">Meet the right</span>
                </span>{' '}
                <br className="hidden sm:block" />doctor in minutes.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-500 dark:text-ink-300">
                Describe your symptoms in your own words. Auravia understands them, matches you to
                the right specialist, and books your visit — calmly and clearly.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/consult" className="btn-primary text-base">Start free consultation <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/register" className="btn-ghost text-base">Create account</Link>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-500 dark:text-ink-400">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-500" /> Privacy-first</span>
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-500" /> 24/7 available</span>
                <span className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-brand-500" /> 12 specialists, 11 fields</span>
              </div>
            </div>

            {/* Overlapping floating cards */}
            <div className="relative animate-fade-up [animation-delay:120ms] min-h-[26rem]">
              {/* main consult card */}
              <div className="relative z-10 rounded-[2rem] bg-white dark:bg-ink-900 border border-cream-300/70 dark:border-white/10 shadow-card p-5 sm:p-6 rotate-[-2deg]">
                <div className="flex items-center gap-2 pb-4 border-b border-cream-200 dark:border-white/10">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white"><Stethoscope className="h-4 w-4" /></span>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-ink-900 dark:text-white">Auravia Assistant</div>
                    <div className="text-[11px] text-brand-500 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Online</div>
                  </div>
                </div>
                <div className="space-y-3 pt-4">
                  <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-2.5 text-sm text-white">I&apos;ve had a pounding headache and blurry vision.</div>
                  <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-cream-100 dark:bg-white/5 px-4 py-3 text-sm text-ink-700 dark:text-ink-200">
                    That deserves a proper look. This points toward <span className="font-medium text-brand-700 dark:text-brand-300">Neurology</span> — I found a great match with an opening today.
                  </div>
                </div>
              </div>

              {/* floating: matched doctor */}
              <div className="absolute -top-6 -right-2 sm:right-2 z-20 rounded-2xl bg-white dark:bg-ink-900 border border-cream-300/70 dark:border-white/10 shadow-lift p-3 pr-4 rotate-[4deg] flex items-center gap-3">
                <DoctorAvatar name="Dr. Emily Rodriguez" className="h-11 w-11 rounded-xl text-xs" />
                <div className="leading-tight">
                  <div className="text-[11px] text-ink-400">Best match</div>
                  <div className="text-sm font-semibold text-ink-900 dark:text-white">Dr. Emily Rodriguez</div>
                  <div className="text-[11px] text-brand-600 dark:text-brand-300 flex items-center gap-1"><Star className="h-3 w-3 fill-current" /> 4.7 · Neurology</div>
                </div>
              </div>

              {/* floating: booked */}
              <div className="absolute -bottom-5 left-2 sm:-left-6 z-20 rounded-2xl bg-white dark:bg-ink-900 border border-cream-300/70 dark:border-white/10 shadow-lift p-3 pr-4 rotate-[-5deg] flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600"><CalendarCheck className="h-5 w-5" /></span>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-ink-900 dark:text-white">Appointment booked</div>
                  <div className="text-[11px] text-ink-400">Today · 4:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Wave className="text-sage-50 dark:text-white/[0.02]" />
      </section>

      {/* ===================== SPECIALTIES ===================== */}
      <section className="relative bg-sage-50 dark:bg-white/[0.02]">
        <Leaf className="absolute top-10 right-[6%] w-12 text-brand-300/40 rotate-45 hidden md:block" />
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-xl">
            <span className="chip"><HeartPulse className="h-3.5 w-3.5 text-brand-500" /> Care for every concern</span>
            <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink-900 dark:text-white">Specialists for whatever you&apos;re feeling</h2>
          </div>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-10">
            {specialties.map((s, i) => (
              <div key={s.name} className={`group flex flex-col items-center text-center ${i % 2 === 1 ? 'sm:mt-8' : ''}`}>
                <span className={`grid h-16 w-16 place-items-center rounded-[1.4rem] bg-gradient-to-br ${s.tint} text-white shadow-lift transition-transform group-hover:-translate-y-1 group-hover:rotate-3`}>
                  <s.icon className="h-7 w-7" />
                </span>
                <p className="mt-4 font-semibold text-ink-800 dark:text-white">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
        <Wave flip className="text-cream-50 dark:text-[#17140f]" />
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="relative bg-gradient-to-b from-cream-100/60 to-sage-50 dark:from-white/[0.02] dark:to-white/[0.02]">
        <Wave className="text-cream-50 dark:text-[#17140f] -mt-px" />
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <span className="chip mx-auto"><Sparkles className="h-3.5 w-3.5 text-brand-500" /> How it works</span>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink-900 dark:text-white">From worry to booked in three steps</h2>
          <div className="relative mt-16 grid md:grid-cols-3 gap-10">
            <svg className="hidden md:block absolute top-8 left-[16%] right-[16%] w-[68%] h-8 text-brand-300" viewBox="0 0 600 40" fill="none" preserveAspectRatio="none" aria-hidden="true">
              <path d="M10 30 C 160 -10, 260 50, 300 20 S 470 -10, 590 24" stroke="currentColor" strokeWidth="2" strokeDasharray="3 8" strokeLinecap="round" />
            </svg>
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-[1.4rem] bg-white dark:bg-ink-900 border border-cream-300 dark:border-white/10 text-brand-600 shadow-lift">
                  <s.icon className="h-7 w-7" />
                </span>
                <div className="mt-5 flex items-center justify-center gap-2">
                  <span className="text-xs font-semibold text-brand-500">0{i + 1}</span>
                  <h3 className="text-lg font-semibold text-ink-900 dark:text-white">{s.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400 max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIAL ===================== */}
      <section className="relative mx-auto max-w-4xl px-6 py-24 text-center">
        <Leaf className="absolute top-6 left-[12%] w-12 text-brand-300/40 -rotate-12 hidden sm:block" />
        <Leaf className="absolute bottom-8 right-[12%] w-12 text-coral-300/40 rotate-45 hidden sm:block" />
        <Quote className="mx-auto h-10 w-10 text-brand-300" />
        <p className="mt-6 font-display text-2xl sm:text-[2rem] font-medium leading-snug text-ink-800 dark:text-ink-100">
          &ldquo;It felt like texting a calm friend who happens to be a doctor — I described how I felt,
          and minutes later I was booked with the right specialist.&rdquo;
        </p>
        <p className="mt-6 text-sm text-ink-400">A calmer way to find care.</p>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-brand-700 px-8 py-16 text-center shadow-lift">
          <Blob className="absolute -top-16 -right-10 w-72 h-72 text-white/10" />
          <Leaf className="absolute bottom-4 left-8 w-16 text-white/10 -rotate-12" />
          <div className="relative">
            <h2 className="font-display text-4xl font-semibold text-white">Ready when you are</h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-50/90">Start a free consultation now — no cost, no waiting rooms. Just calm, clear guidance.</p>
            <Link href="/consult" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-brand-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Start free consultation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="mx-auto max-w-3xl px-6 pb-28">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink-900 dark:text-white">Questions, answered</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-3xl bg-white dark:bg-ink-900 border border-cream-300/70 dark:border-white/10 shadow-soft p-6 [&_summary]:cursor-pointer">
              <summary className="flex items-center justify-between gap-4 list-none">
                <span className="font-semibold text-ink-900 dark:text-white">{f.q}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-brand-500 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
