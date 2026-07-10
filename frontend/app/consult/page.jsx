import Link from 'next/link'
import Chat from '../../components/Chat'
import { ArrowLeft, Lightbulb, Activity, ShieldAlert, Sparkles } from 'lucide-react'

const tips = [
  'Describe symptoms clearly, with when they started and how severe they feel.',
  'Mention your age and any chronic conditions if relevant.',
  'For emergencies, call your local emergency number immediately.',
  'Book an appointment for an in-depth, in-person consultation.',
]

const common = ['Headache', 'Fever', 'Cough', 'Sore throat', 'Nausea', 'Fatigue']

export default function Consult() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 dark:text-white">
                AI Consultation
              </h1>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Calm health guidance & doctor appointments
              </p>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-5">
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-ink-900 dark:text-white">
                <Lightbulb className="h-5 w-5 text-brand-500" /> Quick tips
              </h3>
              <ul className="mt-4 space-y-3">
                {tips.map((t, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-ink-600 dark:text-ink-300">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 dark:bg-brand-500/15 text-[11px] font-semibold text-brand-600 dark:text-brand-300">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-ink-900 dark:text-white">
                <Activity className="h-5 w-5 text-brand-500" /> Common symptoms
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {common.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-ink-200 dark:border-white/10 bg-ink-50 dark:bg-white/5 px-3 py-1 text-xs font-medium text-ink-600 dark:text-ink-300"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-accent-300/60 dark:border-accent-500/30 bg-accent-50/80 dark:bg-accent-500/5 p-6">
              <h3 className="flex items-center gap-2 font-semibold text-accent-600 dark:text-accent-400">
                <ShieldAlert className="h-5 w-5" /> Important
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                Auravia provides general guidance only — not a substitute for professional medical
                advice, diagnosis, or treatment. Always consult a healthcare provider for a proper
                evaluation.
              </p>
            </div>
          </aside>

          {/* Chat */}
          <section className="lg:col-span-3">
            <Chat />
          </section>
        </div>
      </div>
    </div>
  )
}
