"use client"
import { useState, useEffect } from 'react'
import { Activity, Lock, LogOut, Stethoscope, CalendarClock, BarChart3, ShieldCheck, Check, X } from 'lucide-react'
export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('doctors')
  const [doctors, setDoctors] = useState([])
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [mounted, setMounted] = useState(false)
  const backendUrl = 'http://localhost:5000'
  useEffect(() => {
    setMounted(true)
    // Hide the main layout header on admin page
    const header = document.querySelector('header')
    if (header) header.style.display = 'none'
    // Cleanup: show header when leaving admin page
    return () => {
      const header = document.querySelector('header')
      if (header) header.style.display = 'block'
    }
  }, [])
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('admin_password')
    if (savedPassword) {
      setPassword(savedPassword)
      setIsAuthenticated(true)
      loadAllData(savedPassword)
    }
  }, [])
  const loadAllData = (pwd) => {
    console.log('🔄 Loading admin data...')
    const headers = {
      'X-Admin-Password': pwd,
      'Content-Type': 'application/json'
    }
    fetch(`${backendUrl}/api/admin/doctors`, { headers })
      .then(r => {
        console.log('📡 Doctors response:', r.status)
        if (!r.ok) throw new Error(`API error: ${r.status}`)
        return r.json()
      })
      .then(data => {
        console.log('✅ Doctors loaded:', data.doctors?.length || 0)
        setDoctors(data.doctors || [])
      })
      .catch(e => {
        console.error('❌ Doctor error:', e)
        showNotification('Failed to load doctors: ' + e.message, 'error')
      })
    fetch(`${backendUrl}/api/admin/bookings`, { headers })
      .then(r => {
        if (!r.ok) throw new Error(`API error: ${r.status}`)
        return r.json()
      })
      .then(data => {
        console.log('✅ Bookings loaded:', data.bookings?.length || 0)
        setBookings(data.bookings || [])
      })
      .catch(e => {
        console.error('❌ Booking error:', e)
        showNotification('Failed to load bookings: ' + e.message, 'error')
      })
    fetch(`${backendUrl}/api/admin/stats`, { headers })
      .then(r => {
        if (!r.ok) throw new Error(`API error: ${r.status}`)
        return r.json()
      })
      .then(data => {
        console.log('✅ Stats loaded:', data.stats?.length || 0)
        setStats(data.stats || [])
      })
      .catch(e => {
        console.error('❌ Stats error:', e)
        showNotification('Failed to load stats: ' + e.message, 'error')
      })
  }
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${backendUrl}/api/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (data.success) {
        setIsAuthenticated(true)
        sessionStorage.setItem('admin_password', password)
        showNotification('Logged in!', 'success')
        loadAllData(password)
      } else {
        showNotification('Invalid password', 'error')
      }
    } catch (err) {
      console.error('Login error:', err)
      showNotification('Login failed', 'error')
    }
    setLoading(false)
  }
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }
  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (!confirm(`Delete Dr. ${doctorName}?`)) return
    setLoading(true)
    try {
      const res = await fetch(`${backendUrl}/api/admin/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Password': password,
          'Content-Type': 'application/json'
        }
      })
      if (res.ok) {
        showNotification('✓ Doctor deleted', 'success')
        loadAllData(password)
      } else {
        showNotification('Failed to delete', 'error')
      }
    } catch (err) {
      showNotification('Error: ' + err.message, 'error')
    }
    setLoading(false)
  }
  const handleCancelBooking = async (slotId) => {
    if (!confirm('Cancel this booking?')) return
    setLoading(true)
    try {
      const res = await fetch(`${backendUrl}/api/admin/bookings/${slotId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Password': password,
          'Content-Type': 'application/json'
        }
      })
      if (res.ok) {
        showNotification('✓ Booking cancelled', 'success')
        loadAllData(password)
      } else {
        showNotification('Failed to cancel', 'error')
      }
    } catch (err) {
      showNotification('Error: ' + err.message, 'error')
    }
    setLoading(false)
  }
  if (!mounted) return null
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card p-9 sm:p-10">
            {/* Brand */}
            <div className="text-center mb-8">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift">
                <Lock className="h-6 w-6" />
              </span>
              <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900 dark:text-white">Admin Access</h1>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Sign in to manage doctors & bookings</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-ink-200 dark:border-white/15 bg-white dark:bg-white/5 text-ink-800 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-500 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 transition-all"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-brand-500 to-brand-600 text-white py-3.5 font-semibold shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in to dashboard'}
              </button>
            </form>

            {/* Demo hint */}
            <div className="mt-6 rounded-xl border border-ink-200 dark:border-white/10 bg-ink-50 dark:bg-white/5 p-4">
              <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Demo credentials</p>
              <div className="mt-2 rounded-lg bg-white dark:bg-ink-900 border border-ink-100 dark:border-white/10 px-3 py-2 font-mono text-sm text-brand-600 dark:text-brand-300 text-center">
                admin123
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-ink-400 border-t border-ink-100 dark:border-white/10 pt-5 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure admin access
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-ink-200/70 dark:border-white/10 bg-white/70 dark:bg-ink-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lift">
              <Activity className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div className="leading-none">
              <h1 className="font-display text-lg font-semibold text-ink-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-400 mt-1">Auravia Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="px-4 py-2 rounded-full text-sm font-medium text-ink-500 dark:text-ink-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-white/5 transition-colors">
              Home
            </a>
            <button
              onClick={() => {
                setIsAuthenticated(false)
                sessionStorage.removeItem('admin_password')
                setPassword('')
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink-900 dark:bg-white text-white dark:text-ink-900 text-sm font-semibold shadow-soft hover:shadow-lift transition-all"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['doctors', 'bookings', 'stats'].map(tab => {
            const Icon = tab === 'doctors' ? Stethoscope : tab === 'bookings' ? CalendarClock : BarChart3
            const label = tab === 'doctors' ? 'Doctors' : tab === 'bookings' ? 'Bookings' : 'Statistics'
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-soft'
                    : 'bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300 border border-ink-200 dark:border-white/10 hover:border-brand-300 hover:text-brand-600'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            )
          })}
        </div>

        {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <div className="animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-healthcare-200 dark:border-slate-700 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-healthcare-100 to-blue-50 dark:from-slate-700 dark:to-slate-800 p-8 border-b border-healthcare-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-healthcare-800 dark:text-slate-100">Manage Doctors</h2>
                    <p className="text-gray-600 dark:text-slate-400 mt-2">{doctors.length} doctors in the system</p>
                  </div>
                  <div className="text-5xl">👨‍⚕️</div>
                </div>
              </div>
              <div className="p-8">
                {doctors.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="text-5xl">📭</div>
                    <p className="text-gray-500 dark:text-slate-400 text-lg font-semibold">No doctors yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doctors.map(doctor => (
                      <div key={doctor._id} className="group flex items-center justify-between p-6 border-2 border-healthcare-100 dark:border-slate-700 rounded-2xl hover:border-healthcare-500 hover:bg-healthcare-50 dark:hover:bg-slate-700/50 transition-all">
                        <div className="flex-1">
                          <p className="font-bold text-lg text-healthcare-800 dark:text-slate-100">{doctor.name}</p>
                          <p className="text-sm text-gray-600 dark:text-slate-300 mt-1 font-semibold">{doctor.specialty}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">⭐ {doctor.rating} • {doctor.experience_years} years exp • {doctor.qualifications}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteDoctor(doctor._id, doctor.name)}
                          className="ml-6 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-healthcare-200 dark:border-slate-700 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-healthcare-100 to-blue-50 dark:from-slate-700 dark:to-slate-800 p-8 border-b border-healthcare-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-healthcare-800 dark:text-slate-100">All Bookings</h2>
                    <p className="text-gray-600 dark:text-slate-400 mt-2">{bookings.length} appointments scheduled</p>
                  </div>
                  <div className="text-5xl">📅</div>
                </div>
              </div>
              <div className="p-8 overflow-x-auto">
                {bookings.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="text-5xl">📭</div>
                    <p className="text-gray-500 dark:text-slate-400 text-lg font-semibold">No bookings yet</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-healthcare-100 to-blue-50 dark:from-slate-700/50 dark:to-slate-700/50 border-b-2 border-healthcare-200 dark:border-slate-700">
                        <th className="text-left py-4 px-4 font-bold text-healthcare-800 dark:text-slate-100">Doctor</th>
                        <th className="text-left py-4 px-4 font-bold text-healthcare-800 dark:text-slate-100">Patient Email</th>
                        <th className="text-left py-4 px-4 font-bold text-healthcare-800 dark:text-slate-100">Phone</th>
                        <th className="text-left py-4 px-4 font-bold text-healthcare-800 dark:text-slate-100">Appointment</th>
                        <th className="text-center py-4 px-4 font-bold text-healthcare-800 dark:text-slate-100">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(booking => (
                        <tr key={booking._id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-healthcare-50 dark:hover:bg-slate-700/50 transition-all">
                          <td className="py-4 px-4 font-semibold text-healthcare-700 dark:text-slate-200">{booking.doctor_name || 'Unknown'}</td>
                          <td className="py-4 px-4 text-gray-600 dark:text-slate-300">{booking.patient_email}</td>
                          <td className="py-4 px-4 text-gray-600 dark:text-slate-300">{booking.patient_phone}</td>
                          <td className="py-4 px-4 text-xs text-gray-600 dark:text-slate-300">
                            {booking.slot_time ? new Date(booking.slot_time).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => handleCancelBooking(booking.slot_id)}
                              className="px-4 py-2 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 transition-all"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-healthcare-200 dark:border-slate-700 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-healthcare-100 to-blue-50 dark:from-slate-700 dark:to-slate-800 p-8 border-b border-healthcare-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-healthcare-800 dark:text-slate-100">System Statistics</h2>
                    <p className="text-gray-600 dark:text-slate-400 mt-2">Real-time analytics & insights</p>
                  </div>
                  <div className="text-5xl">📊</div>
                </div>
              </div>
              <div className="p-8">
                {stats.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="text-5xl">📭</div>
                    <p className="text-gray-500 dark:text-slate-400 text-lg font-semibold">No statistics available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.map(stat => (
                      <div key={stat.doctor_id} className="bg-gradient-to-br from-white to-healthcare-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-6 border-2 border-healthcare-100 dark:border-slate-700 hover:border-healthcare-500 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-black text-healthcare-700 dark:text-slate-100 text-lg">{stat.doctor_name}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Doctor Analytics</p>
                          </div>
                          <div className="text-3xl group-hover:scale-125 transition-transform">👨‍⚕️</div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-slate-300 font-semibold">Total Slots:</span>
                            <span className="text-2xl font-black text-healthcare-600">{stat.total_slots}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-slate-300 font-semibold">Available:</span>
                            <span className="text-2xl font-black text-green-600">{stat.available_slots}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-slate-300 font-semibold">Booked:</span>
                            <span className="text-2xl font-black text-orange-600">{stat.booked_slots}</span>
                          </div>
                        </div>
                        {stat.total_slots > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs text-gray-600 dark:text-slate-300">
                              <span>Occupancy Rate</span>
                              <span className="font-bold">{Math.round((stat.booked_slots / stat.total_slots) * 100)}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all"
                                style={{ width: `${(stat.booked_slots / stat.total_slots) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed bottom-8 right-8 z-[60] pl-4 pr-6 py-4 rounded-2xl shadow-lift text-white font-semibold animate-fade-up flex items-center gap-3 ${
          notification.type === 'success'
            ? 'bg-gradient-to-r from-brand-500 to-brand-600'
            : 'bg-gradient-to-r from-rose-500 to-red-500'
        }`}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
            {notification.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </span>
          <span className="text-sm">{notification.message}</span>
        </div>
      )}
    </div>
  )
}
