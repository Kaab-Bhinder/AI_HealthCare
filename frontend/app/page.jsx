import Link from 'next/link'
import {
  ArrowRight, Sparkles, ShieldCheck, CalendarCheck, ChevronRight, Quote, MessageCircle, Search, Plus, Minus,
} from 'lucide-react'
import { Blob, Leaf } from '../components/Organic'
import ScrollyHero from '../components/ScrollyHero'
import FanCarousel from '../components/FanCarousel'
import SmartImage from '../components/SmartImage'


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
    // overflow-x-clip, NOT overflow-hidden: hidden on an ancestor breaks
    // position:sticky, which the scrolly hero depends on.
    <div className="overflow-x-clip">
      {/* ===================== SCROLLY HERO ===================== */}
      <ScrollyHero />

      {/* ===================== STATS STRIP (continues the dark act) ===================== */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.16),transparent_65%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-y-10 md:divide-x md:divide-white/10 text-center">
          {[['900+', 'Medical topics in knowledge base'], ['12', 'Specialists across 11 fields'], ['< 2s', 'Typical AI response time'], ['24/7', 'Always available']].map(([v, l]) => (
            <div key={l}>
              <div className="font-display text-4xl sm:text-5xl font-semibold text-gradient">{v}</div>
              <div className="mt-2 text-xs sm:text-sm text-white/55">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== SPECIALTY DECK ===================== */}
      <FanCarousel />

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="relative overflow-x-clip -mt-12 pt-12 bg-gradient-to-b from-cream-100/60 to-sage-50 dark:from-brand-500/[0.06] dark:to-transparent">
        {/* Atmosphere: faint grid + teal glows + organic blobs so the section
            carries the hero's cinematic vibe (especially in dark mode). */}
        <div className="absolute inset-0 bg-grid opacity-60 dark:opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.10),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.20),transparent_60%)]" />
        <Blob className="absolute -top-20 -left-28 w-96 h-96 text-brand-200/40 dark:text-brand-500/15" />
        <Blob className="absolute -bottom-24 -right-28 w-[26rem] h-[26rem] text-coral-200/40 dark:text-coral-500/10" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
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
      <section className="relative overflow-x-clip">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.16),transparent_60%)]" />
        <Blob className="absolute top-4 -right-24 w-80 h-80 text-brand-200/30 dark:text-brand-500/10" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <Leaf className="absolute top-6 left-[12%] w-12 text-brand-300/40 dark:text-brand-400/25 -rotate-12 hidden sm:block" />
          <Leaf className="absolute bottom-8 right-[12%] w-12 text-coral-300/40 dark:text-coral-400/25 rotate-45 hidden sm:block" />
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift">
            <Quote className="h-6 w-6" />
          </span>
          <p className="mt-8 font-display text-2xl sm:text-[2rem] font-medium leading-snug text-ink-800 dark:text-ink-100">
            &ldquo;It felt like texting a calm friend who happens to be a doctor — I described how I felt,
            and minutes later I was booked with the right specialist.&rdquo;
          </p>
          <p className="mt-6 text-sm text-ink-400">A calmer way to find care.</p>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 to-brand-700 px-8 py-16 text-center shadow-lift">
          <div className="absolute inset-0 bg-grid opacity-[0.15]" />
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
      <section className="relative overflow-x-clip">
        {/* Soft, light backdrop: bright photo washed out to a whisper */}
        <div className="absolute inset-0">
          <SmartImage src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600&q=55&auto=format&fit=crop"
            className="absolute inset-0 h-full w-full object-cover" fallbackClassName="bg-sage-100" />
          <div className="absolute inset-0 bg-cream-50/[0.93] dark:bg-[#17140f]/[0.95]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-24">
          <div className="rounded-[2.5rem] bg-white/80 dark:bg-white/[0.04] backdrop-blur border border-cream-200 dark:border-white/10 shadow-card p-8 sm:p-12 lg:p-16">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] items-start">
              {/* Left: label + underlined heading + blurb */}
              <div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-700 dark:text-ink-200">
                  <span className="h-2 w-2 rounded-full bg-coral-500" /> FAQs
                </span>
                <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink-900 dark:text-white leading-[1.08]">
                  Frequently asked{' '}
                  <span className="relative inline-block">
                    questions
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 140 10" fill="none" aria-hidden="true">
                      <path d="M3 7 Q 35 2, 70 6 T 137 5" stroke="#f2876a" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </span>
                </h2>
                <p className="mt-6 max-w-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                  Here are some common questions about our care to help you understand better.
                </p>
              </div>

              {/* Right: accordion cards with circular +/- buttons */}
              <div className="space-y-4">
                {faqs.map((f, i) => (
                  <details key={f.q} open={i === 0}
                    className="group rounded-2xl bg-white dark:bg-ink-900 border border-cream-200 dark:border-white/10 shadow-soft px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between gap-4 list-none cursor-pointer select-none">
                      <span className="font-semibold text-ink-900 dark:text-white">{f.q}</span>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-900 text-white dark:bg-white dark:text-ink-900 transition-transform duration-300 group-open:rotate-180">
                        <Plus className="h-4 w-4 group-open:hidden" />
                        <Minus className="h-4 w-4 hidden group-open:block" />
                      </span>
                    </summary>
                    <p className="mt-4 pr-10 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
