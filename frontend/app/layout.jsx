import './globals.css'
import Link from 'next/link'
export const metadata = {
  title: 'AI Healthcare Assistant',
  description: 'A minimal healthcare assistant powered by AI'
}
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-800">
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="bg-gradient-to-r from-healthcare-600 to-healthcare-700 shadow-xl">
            <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-healthcare-600 font-bold text-xl shadow-md">🏥</div>
                  <div>
                    <h1 className="text-2xl font-bold text-white leading-none">AI Healthcare Assistant</h1>
                    <div className="text-xs text-healthcare-100">Fast triage, expert guidance & appointments</div>
                  </div>
                </div>
                <nav className="hidden md:flex items-center gap-6 text-sm text-white ml-8 font-semibold">
                  <Link href="/" className="hover:text-healthcare-100 transition-colors">Home</Link>
                  <Link href="/consult" className="hover:text-healthcare-100 transition-colors">Consult</Link>
                  <Link href="/admin" className="hover:text-healthcare-100 transition-colors">⚙️ Admin</Link>
                </nav>
              </div>
              <div>
                <Link href="/consult" className="rounded-full bg-white text-healthcare-600 px-6 py-3 text-sm hover:shadow-lg font-bold transition-all transform hover:scale-105 active:scale-95">
                  ➤ Start Consult
                </Link>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-grow">{children}</main>

          {/* Footer */}
          <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
            <div className="mx-auto max-w-6xl px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                <div>
                  <h3 className="font-bold mb-2">About</h3>
                  <p className="text-sm text-gray-400">AI-powered healthcare assistant for quick triage and appointment booking.</p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Quick Links</h3>
                  <div className="space-y-1 text-sm">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
                    <Link href="/consult" className="text-gray-400 hover:text-white transition-colors">Consult</Link>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Disclaimer</h3>
                  <p className="text-sm text-gray-400">For emergency cases, call 911 or visit your nearest hospital.</p>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-6 text-sm text-gray-500 text-center">
                © 2025 AI Healthcare Assistant. Not a replacement for professional medical advice.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
