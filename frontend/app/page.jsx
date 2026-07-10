import Link from 'next/link'
import {
  ArrowRight, Sparkles, Stethoscope, CalendarClock, ShieldCheck, Mic,
  BookOpen, Zap, MessageCircle, Search, HeartPulse, Clock, Quote, ChevronRight,
} from 'lucide-react'

const features = [
  { icon: Stethoscope, title: 'AI Symptom Insight', desc: 'Describe how you feel and get calm, structured guidance grounded in a medical knowledge base.' },
  { icon: Search, title: 'Semantic Retrieval', desc: 'Answers are backed by real documents found through meaning — not keywords — and cited for trust.' },
  { icon: Mic, title: 'Voice in Any Browser', desc: 'Speak your symptoms and hear responses back. Works everywhere, not just Chrome.' },
  { icon: CalendarClock, title: 'Doctor Appointments', desc: 'Find the right specialist and book a time slot that works for you in a few taps.' },
  { icon: ShieldCheck, title: 'Privacy First', desc: 'No personal health data is stored. Your conversation stays yours.' },
  { icon: Zap, title: 'Instant & 24/7', desc: 'Thoughtful guidance in seconds, any time of day, powered by Google Gemini.' },
]

const steps = [
  { icon: MessageCircle, title: 'Describe', desc: 'Tell us your symptoms in your own words — or just speak.' },
  { icon: Sparkles, title: 'Understand', desc: 'The assistant retrieves relevant knowledge and explains clearly.' },
  { icon: BookOpen, title: 'Learn', desc: 'See cited sources and practical, evidence-guided next steps.' },
  { icon: CalendarClock, title: 'Book', desc: 'Connect with a qualified doctor when you need one.' },
]

const stats = [
  { value: '117', label: 'Conditions in knowledge base' },
  { value: '< 2s', label: 'Typical response time' },
  { value: '100%', label: 'Browsers voice-enabled' },
  { value: '24/7', label: 'Always available' },
]

const faqs = [
  { q: 'Is this a replacement for a real doctor?', a: 'No. Auravia offers initial guidance and triage only. Always consult a qualified professional for diagnosis and treatment.' },
  { q: 'How does it stay accurate?', a: 'Answers are grounded in a curated medical knowledge base using semantic retrieval, and every response shows the sources it drew from.' },
  { q: 'Is my health information safe?', a: 'Yes. This build stores no personal health data. For production use, HIPAA-grade controls would be added.' },
  { q: 'Can I really book appointments?', a: 'Yes — search by symptom, pick a specialist, choose a slot, and confirm. Bookings appear in the admin dashboard.' },
]

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ===== Hero ===== */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-24 right-0 -z-10 h-96 w-96 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-500/20" />
        <div className="absolute top-40 -left-20 -z-10 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-500/10" />

        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 lg:pt-28">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="animate-fade-up">
              <span className="chip">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                AI-guided care, made calm
              </span>
              <h1 className="mt-6 font-display text-5xl sm:text-6xl font-semibold leading-[1.05] tracking-tight text-ink-900 dark:text-white">
                Understand your health,{' '}
                <span className="text-gradient">without the worry</span>.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-500 dark:text-ink-300">
                Auravia listens to your symptoms, explains what they might mean in clear language,
                and helps you book a doctor — grounded in real medical knowledge, available any time.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/consult" className="btn-primary text-base">
                  Start free consultation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#how" className="btn-ghost text-base">
                  See how it works
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-500 dark:text-ink-400">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-500" /> Privacy-first</span>
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-500" /> 24/7 available</span>
                <span className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-brand-500" /> Evidence-guided</span>
              </div>
            </div>

            {/* Product preview card */}
            <div className="relative animate-fade-up [animation-delay:120ms]">
              <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-200/50 to-teal-100/40 blur-2xl dark:from-brand-500/20 dark:to-teal-500/10" />
              <div className="card p-5 sm:p-6">
                <div className="flex items-center gap-2 pb-4 border-b border-ink-100 dark:border-white/10">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                    <Stethoscope className="h-4 w-4" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-ink-900 dark:text-white">Auravia Assistant</div>
                    <div className="text-[11px] text-brand-500 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" /> Online
                    </div>
                  </div>
                </div>
                <div className="space-y-3 pt-4">
                  <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-2.5 text-sm text-white shadow-soft">
                    I&apos;ve had a pounding headache since morning.
                  </div>
                  <div className="w-fit max-w-[88%] rounded-2xl rounded-bl-md bg-ink-50 dark:bg-white/5 px-4 py-3 text-sm text-ink-700 dark:text-ink-200">
                    That sounds draining. A few things often help: rest in a quiet, dim room, hydrate
                    steadily, and consider an over-the-counter pain reliever.
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-medium text-ink-400 flex items-center gap-1"><BookOpen className="h-3 w-3" /> Based on</span>
                      <span className="chip !py-0.5 !text-[10px]">Headache</span>
                      <span className="chip !py-0.5 !text-[10px]">Migraine relief</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 dark:bg-white/5 text-brand-500">
                      <Mic className="h-4 w-4" />
                    </span>
                    <div className="flex-1 h-9 rounded-full bg-ink-50 dark:bg-white/5 border border-ink-100 dark:border-white/10 flex items-center px-4 text-xs text-ink-400">
                      Describe your symptoms…
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats strip ===== */}
      <section className="border-y border-ink-200/70 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-semibold text-gradient">{s.value}</div>
              <div className="mt-1 text-xs sm:text-sm text-ink-500 dark:text-ink-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <span className="chip"><Sparkles className="h-3.5 w-3.5 text-brand-500" /> Why Auravia</span>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink-900 dark:text-white">
            Care that feels considered
          </h2>
          <p className="mt-4 text-lg text-ink-500 dark:text-ink-300">
            Every detail is designed to be calm, clear, and trustworthy — from grounded answers to gentle guidance.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300 ring-1 ring-brand-100 dark:ring-white/10 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                <f.icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="relative border-y border-ink-200/70 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center max-w-2xl mx-auto">
            <span className="chip"><Zap className="h-3.5 w-3.5 text-brand-500" /> How it works</span>
            <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink-900 dark:text-white">
              From worry to clarity in four steps
            </h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-6 -right-4 h-6 w-6 text-ink-300 dark:text-white/20" />
                )}
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand-500">0{i + 1}</span>
                  <h3 className="text-lg font-semibold text-ink-900 dark:text-white">{s.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Quote / reassurance ===== */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Quote className="mx-auto h-10 w-10 text-brand-300" />
        <p className="mt-6 font-display text-2xl sm:text-3xl font-medium leading-snug text-ink-800 dark:text-ink-100">
          &ldquo;Health questions can be frightening. Auravia answers them the way a calm, careful
          friend would — clearly, kindly, and with sources you can trust.&rdquo;
        </p>
        <p className="mt-6 text-sm text-ink-400">Designed for reassurance, built for trust.</p>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-600 to-brand-700 px-8 py-16 text-center shadow-lift">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -top-16 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <h2 className="font-display text-4xl font-semibold text-white">Ready when you are</h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-50/90">
              Start a free consultation now — no sign-up, no cost. Just calm, clear health guidance.
            </p>
            <Link
              href="/consult"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-brand-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Start free consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="mx-auto max-w-3xl px-6 pb-28">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink-900 dark:text-white">
            Questions, answered
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="group card p-6 [&_summary]:cursor-pointer">
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
