import './globals.css'
import Link from 'next/link'
import { Inter, Fraunces } from 'next/font/google'
import { Activity, Stethoscope, ShieldCheck, ArrowRight, Phone } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz'],
})

export const metadata = {
  title: 'Auravia — AI Healthcare Assistant',
  description: 'Calm, trustworthy AI health guidance, symptom insight, and doctor appointments.',
}

// Runs before hydration so the correct theme is applied with no flash.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-sans text-ink-800 dark:text-ink-100 antialiased selection:bg-brand-200/60 selection:text-brand-900">
        <div className="flex min-h-screen flex-col">
          {/* Header — translucent, sticky, airy */}
          <header className="sticky top-0 z-40 border-b border-ink-200/70 dark:border-white/10 bg-white/70 dark:bg-ink-950/70 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift">
                  <Activity className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="font-display text-lg font-semibold tracking-tight text-ink-900 dark:text-white">Auravia</span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-ink-400">Health Assistant</span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-ink-500 dark:text-ink-300">
                <Link href="/" className="px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-white/5 transition-colors">Home</Link>
                <Link href="/consult" className="px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-white/5 transition-colors">Consult</Link>
                <Link href="/admin" className="px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-white/5 transition-colors">Admin</Link>
              </nav>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/consult"
                  className="group inline-flex items-center gap-1.5 rounded-full bg-ink-900 dark:bg-white text-white dark:text-ink-900 px-4 py-2 text-sm font-semibold shadow-soft hover:shadow-lift transition-all"
                >
                  Start
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-grow">{children}</main>

          {/* Footer */}
          <footer className="border-t border-ink-200/70 dark:border-white/10 bg-ink-50/60 dark:bg-ink-950">
            <div className="mx-auto max-w-6xl px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div className="md:col-span-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                      <Activity className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <span className="font-display text-base font-semibold text-ink-900 dark:text-white">Auravia</span>
                  </div>
                  <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                    Calm, trustworthy AI health guidance and easy doctor appointments.
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">Product</h3>
                  <div className="space-y-2 text-sm">
                    <Link href="/" className="block text-ink-500 dark:text-ink-400 hover:text-brand-600 transition-colors">Home</Link>
                    <Link href="/consult" className="block text-ink-500 dark:text-ink-400 hover:text-brand-600 transition-colors">Consultation</Link>
                    <Link href="/admin" className="block text-ink-500 dark:text-ink-400 hover:text-brand-600 transition-colors">Admin</Link>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">Assurance</h3>
                  <div className="space-y-2 text-sm text-ink-500 dark:text-ink-400">
                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-500" /> Privacy-first</div>
                    <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-brand-500" /> Evidence-guided</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">Emergency</h3>
                  <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed flex items-start gap-2">
                    <Phone className="h-4 w-4 text-accent-500 mt-0.5 shrink-0" />
                    For emergencies, call your local emergency number immediately.
                  </p>
                </div>
              </div>
              <div className="border-t border-ink-200/70 dark:border-white/10 pt-6 text-xs text-ink-400 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>© 2026 Auravia. Not a replacement for professional medical advice.</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Your data stays private</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
