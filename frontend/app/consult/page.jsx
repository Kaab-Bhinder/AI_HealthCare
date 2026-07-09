import Link from 'next/link'
import Chat from '../../components/Chat'
export default function Consult() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-healthcare-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-healthcare-600 hover:text-healthcare-700 font-semibold text-sm mb-4 inline-block">← Back Home</Link>
          <div className="flex items-center gap-3">
            <div className="text-4xl">💬</div>
            <div>
              <h2 className="text-3xl font-bold text-healthcare-800">AI Consultation</h2>
              <p className="text-gray-600 text-sm mt-1">Get instant health guidance & book appointments with doctors</p>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Quick Tips Card */}
            <div className="rounded-2xl border-2 border-healthcare-200 bg-gradient-to-br from-healthcare-50 to-blue-50 p-6 shadow-md">
              <h3 className="font-bold text-healthcare-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Quick Tips
              </h3>
              <ul className="text-sm text-gray-700 space-y-3">
                <li className="flex gap-2">
                  <span className="text-healthcare-600 font-bold">1.</span>
                  <span>Describe symptoms clearly with onset and severity.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-healthcare-600 font-bold">2.</span>
                  <span>Mention age and chronic conditions if relevant.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-healthcare-600 font-bold">3.</span>
                  <span>For emergencies, call 911 immediately.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-healthcare-600 font-bold">4.</span>
                  <span>Book appointments for in-depth consultation.</span>
                </li>
              </ul>
            </div>

            {/* Common Symptoms Card */}
            <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-md">
              <h3 className="font-bold text-purple-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">🩺</span>
                Common Symptoms
              </h3>
              <div className="space-y-2 text-sm">
                <div className="bg-white rounded-lg px-3 py-2 hover:bg-purple-100 cursor-pointer transition-all">Headache</div>
                <div className="bg-white rounded-lg px-3 py-2 hover:bg-purple-100 cursor-pointer transition-all">Fever</div>
                <div className="bg-white rounded-lg px-3 py-2 hover:bg-purple-100 cursor-pointer transition-all">Cough</div>
                <div className="bg-white rounded-lg px-3 py-2 hover:bg-purple-100 cursor-pointer transition-all">Sore Throat</div>
                <div className="bg-white rounded-lg px-3 py-2 hover:bg-purple-100 cursor-pointer transition-all">Nausea</div>
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-6 shadow-md">
              <h3 className="font-bold text-yellow-700 mb-3 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Important
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                This AI assistant provides general guidance only. Not a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare provider for proper evaluation.
              </p>
            </div>
          </aside>

          {/* Chat Area */}
          <section className="lg:col-span-3">
            <Chat />
          </section>
        </div>
      </div>
    </div>
  )
}
