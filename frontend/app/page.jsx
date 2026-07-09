import Link from 'next/link'
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-healthcare-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:px-0">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block bg-healthcare-100 text-healthcare-700 px-4 py-2 rounded-full text-sm font-bold dark:bg-slate-800 dark:text-healthcare-300">
                  ✨ Powered by Advanced AI
                </div>
                <h1 className="text-5xl lg:text-6xl font-black text-healthcare-900 leading-tight dark:text-slate-100">
                  Your Personal Health Assistant
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-xl dark:text-slate-300">
                  Get instant health guidance, understand your symptoms, and book appointments with qualified doctors—all in one place.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/consult" 
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-healthcare-500 to-healthcare-600 px-8 py-4 text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 text-lg"
                >
                  🚀 Start Free Consultation
                </Link>
                <Link 
                  href="#features" 
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white border-2 border-healthcare-500 px-8 py-4 text-healthcare-600 font-bold hover:bg-healthcare-50 transition-all dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  📖 Learn More
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  <span className="text-gray-700 dark:text-slate-300"><strong>24/7</strong> Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  <span className="text-gray-700 dark:text-slate-300"><strong>100%</strong> Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <span className="text-gray-700 dark:text-slate-300"><strong>Instant</strong> Guidance</span>
                </div>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-full h-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-healthcare-200 to-blue-200 rounded-3xl blur-3xl opacity-30"></div>
                <div className="relative bg-gradient-to-br from-healthcare-100 to-blue-50 rounded-3xl p-8 border-2 border-healthcare-200 shadow-2xl dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-4 shadow-md dark:bg-slate-800">
                      <p className="text-sm text-gray-600 dark:text-slate-400">AI Assistant</p>
                      <p className="font-semibold text-healthcare-700 mt-1">What can I help with today?</p>
                    </div>
                    <div className="bg-healthcare-500 rounded-2xl p-4 text-white ml-auto w-3/4">
                      <p className="text-sm">I have a persistent headache...</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-md space-y-2 dark:bg-slate-800">
                      <p className="text-sm text-gray-600 dark:text-slate-400">Consider these factors:</p>
                      <ul className="text-xs space-y-1">
                        <li>✓ Rest & hydration</li>
                        <li>✓ See a doctor if persistent</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-black text-healthcare-900 dark:text-slate-100">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto dark:text-slate-300">
              Everything you need for better healthcare management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-healthcare-100 hover:border-healthcare-500 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-5xl mb-4 transform group-hover:scale-125 transition-transform">🩺</div>
              <h3 className="text-2xl font-bold text-healthcare-800 mb-3 dark:text-slate-100">AI Symptom Analysis</h3>
              <p className="text-gray-600 leading-relaxed dark:text-slate-300">
                Describe your symptoms and get instant guidance. Our AI analyzes patterns to provide reliable information.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-healthcare-100 hover:border-healthcare-500 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-5xl mb-4 transform group-hover:scale-125 transition-transform">👨‍⚕️</div>
              <h3 className="text-2xl font-bold text-healthcare-800 mb-3 dark:text-slate-100">Doctor Appointments</h3>
              <p className="text-gray-600 leading-relaxed dark:text-slate-300">
                Book appointments with qualified doctors at your convenience. Get expert consultation for proper diagnosis.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-healthcare-100 hover:border-healthcare-500 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-5xl mb-4 transform group-hover:scale-125 transition-transform">🔒</div>
              <h3 className="text-2xl font-bold text-healthcare-800 mb-3 dark:text-slate-100">Privacy Protected</h3>
              <p className="text-gray-600 leading-relaxed dark:text-slate-300">
                Your health data is secure. We don't store personal information—complete privacy for demo purposes.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-healthcare-100 hover:border-healthcare-500 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-5xl mb-4 transform group-hover:scale-125 transition-transform">⚡</div>
              <h3 className="text-2xl font-bold text-healthcare-800 mb-3 dark:text-slate-100">Instant Response</h3>
              <p className="text-gray-600 leading-relaxed dark:text-slate-300">
                No waiting. Get immediate guidance 24/7. Our AI responds in seconds with helpful information.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-healthcare-100 hover:border-healthcare-500 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-5xl mb-4 transform group-hover:scale-125 transition-transform">📚</div>
              <h3 className="text-2xl font-bold text-healthcare-800 mb-3 dark:text-slate-100">Medical Knowledge Base</h3>
              <p className="text-gray-600 leading-relaxed dark:text-slate-300">
                Access comprehensive medical information on symptoms, conditions, and preventive care.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-healthcare-100 hover:border-healthcare-500 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-5xl mb-4 transform group-hover:scale-125 transition-transform">📱</div>
              <h3 className="text-2xl font-bold text-healthcare-800 mb-3 dark:text-slate-100">Easy to Use</h3>
              <p className="text-gray-600 leading-relaxed dark:text-slate-300">
                Simple, intuitive interface designed for everyone. No technical knowledge required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gradient-to-r from-healthcare-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-black text-healthcare-900 dark:text-slate-100">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: '1', title: 'Describe', desc: 'Tell us about your symptoms' },
              { number: '2', title: 'Analyze', desc: 'AI analyzes & provides guidance' },
              { number: '3', title: 'Explore', desc: 'Learn about conditions & care' },
              { number: '4', title: 'Book', desc: 'Schedule with a doctor' }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[calc(100%-60%)] h-1 bg-gradient-to-r from-healthcare-400 to-transparent"></div>
                )}
                <div className="bg-white rounded-2xl p-8 text-center border-2 border-healthcare-200 relative z-10 dark:bg-slate-800 dark:border-slate-700">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-healthcare-500 to-healthcare-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-healthcare-800 mb-2 dark:text-slate-100">{step.title}</h3>
                  <p className="text-gray-600 dark:text-slate-300">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-healthcare-600 to-healthcare-700 rounded-3xl p-12 text-center text-white space-y-6 shadow-2xl">
            <h2 className="text-4xl font-black">Ready to Take Control?</h2>
            <p className="text-xl text-healthcare-100 max-w-2xl mx-auto">
              Start your health journey today. Get instant guidance and book appointments with professionals.
            </p>
            <Link 
              href="/consult" 
              className="inline-flex items-center justify-center gap-2 bg-white text-healthcare-600 px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
              🚀 Start Free Consultation Now
            </Link>
            <p className="text-sm text-healthcare-100">
              No credit card required • Completely free • Available 24/7
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-gray-50 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-black text-healthcare-900 text-center mb-16 dark:text-slate-100">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              { q: 'Is this AI doctor a replacement for real doctors?', a: 'No. This is a triage tool for initial guidance only. Always consult a healthcare professional for proper diagnosis.' },
              { q: 'Is my health information safe?', a: 'Yes. This is a demo that doesn\'t store personal health data. For production, implement HIPAA compliance.' },
              { q: 'Can I really book appointments?', a: 'Yes! You can book appointments with our network of doctors. Availability varies by location and specialty.' },
              { q: 'How quickly do I get responses?', a: 'Instant! Our AI responds within seconds to any query, 24/7.' }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border-l-4 border-healthcare-500 dark:bg-slate-800">
                <h3 className="text-lg font-bold text-healthcare-800 mb-2 dark:text-slate-100">{faq.q}</h3>
                <p className="text-gray-600 dark:text-slate-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
