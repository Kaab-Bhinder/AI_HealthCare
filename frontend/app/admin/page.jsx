"use client"
import { useState, useEffect } from 'react'
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
      <div className="min-h-screen bg-gradient-to-br from-healthcare-600 via-healthcare-700 to-purple-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-10 space-y-8">
            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <label className="block text-sm font-bold text-healthcare-800 dark:text-slate-100 mb-3">Admin Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-5 py-4 border-2 border-healthcare-200 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:border-healthcare-500 focus:ring-2 focus:ring-healthcare-200 text-base transition-all"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-healthcare-500 to-healthcare-600 text-white py-4 rounded-xl hover:shadow-lg font-bold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 text-lg"
              >
                {loading ? '⏳ Logging in...' : '🔓 Login to Dashboard'}
              </button>
            </form>

            {/* Password Hint */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20 border-2 border-blue-300 dark:border-slate-700 rounded-xl p-5 space-y-2">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <span className="text-lg">💡</span> Demo Credentials
              </p>
              <div className="bg-white dark:bg-slate-800 rounded-lg px-4 py-2 font-mono font-bold text-blue-600 dark:text-blue-300 text-center">
                admin123
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300 text-center">For demo purposes only</p>
            </div>

            {/* Footer Note */}
            <div className="text-center text-xs text-gray-600 dark:text-slate-400 border-t border-gray-200 dark:border-slate-700 pt-6">
              <p>Secure admin access • Healthcare professionals only</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-healthcare-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-healthcare-600 to-healthcare-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-healthcare-600 font-bold text-xl shadow-lg">⚙️</div>
            <div>
              <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
              <p className="text-healthcare-100 text-xs font-semibold mt-1">Healthcare Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="px-6 py-3 rounded-full bg-healthcare-500 text-white hover:bg-healthcare-400 font-bold transition-all transform hover:scale-105 active:scale-95"
            >
              🏠 Home
            </a>
            <button
              onClick={() => {
                setIsAuthenticated(false)
                sessionStorage.removeItem('admin_password')
                setPassword('')
              }}
              className="px-6 py-3 rounded-full bg-white text-healthcare-600 hover:bg-healthcare-50 font-bold transition-all transform hover:scale-105 active:scale-95"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Tab Navigation */}
        <div className="flex gap-3 mb-10 overflow-x-auto pb-4">
          {['doctors', 'bookings', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all transform ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-healthcare-500 to-healthcare-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-healthcare-50 border-2 border-gray-200 dark:border-slate-700'
              }`}
            >
              {tab === 'doctors' && '👨‍⚕️ Doctors'}
              {tab === 'bookings' && '📅 Bookings'}
              {tab === 'stats' && '📊 Statistics'}
            </button>
          ))}
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
        <div className={`fixed bottom-8 right-8 px-8 py-5 rounded-full shadow-2xl text-white font-bold animate-bounce-gentle flex items-center gap-3 ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-green-400 to-green-500' 
            : 'bg-gradient-to-r from-red-400 to-red-500'
        }`}>
          <span className="text-2xl">{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  )
}
