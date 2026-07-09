"use client"

import { useState, useEffect } from 'react'

export default function AdminPage() {
  // Error Boundary
  if (typeof window === 'undefined') return null
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('doctors')
  const [doctors, setDoctors] = useState([])
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [addingDoctor, setAddingDoctor] = useState(false)
  const [newDoctor, setNewDoctor] = useState({ name: '', specialty: '', rating: 4.5, experience_years: 5 })

  const backendUrl = 'http://localhost:5000'

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

    // Load doctors
    fetch(`${backendUrl}/api/admin/doctors`, { 
      headers,
      credentials: 'include'
    })
      .then(r => {
        console.log('📡 Doctors response status:', r.status)
        if (!r.ok) throw new Error(`API error: ${r.status}`)
        return r.json()
      })
      .then(data => {
        console.log('✅ Doctors loaded:', data.doctors?.length || 0, 'doctors')
        setDoctors(data.doctors || [])
      })
      .catch(e => {
        console.error('❌ Doctor fetch error:', e)
        showNotification('Failed to load doctors: ' + e.message, 'error')
      })

    // Load bookings
    fetch(`${backendUrl}/api/admin/bookings`, { 
      headers,
      credentials: 'include'
    })
      .then(r => {
        console.log('📡 Bookings response status:', r.status)
        if (!r.ok) throw new Error(`API error: ${r.status}`)
        return r.json()
      })
      .then(data => {
        console.log('✅ Bookings loaded:', data.bookings?.length || 0, 'bookings')
        setBookings(data.bookings || [])
      })
      .catch(e => {
        console.error('❌ Booking fetch error:', e)
        showNotification('Failed to load bookings: ' + e.message, 'error')
      })

    // Load stats
    fetch(`${backendUrl}/api/admin/stats`, { 
      headers,
      credentials: 'include'
    })
      .then(r => {
        console.log('📡 Stats response status:', r.status)
        if (!r.ok) throw new Error(`API error: ${r.status}`)
        return r.json()
      })
      .then(data => {
        console.log('✅ Stats loaded:', data.stats?.length || 0, 'stats')
        setStats(data.stats || [])
      })
      .catch(e => {
        console.error('❌ Stats fetch error:', e)
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

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor._id)
    setEditForm({ ...doctor })
  }

  const handleSaveDoctor = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${backendUrl}/api/admin/doctors/${editingDoctor}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Password': password,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })
      if (res.ok) {
        showNotification('✓ Doctor updated', 'success')
        setEditingDoctor(null)
        loadAllData(password)
      } else {
        showNotification('Failed to update', 'error')
      }
    } catch (err) {
      showNotification('Error: ' + err.message, 'error')
    }
    setLoading(false)
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-healthcare-50 to-healthcare-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-lg bg-healthcare-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">⚙️</div>
            <h1 className="text-3xl font-bold text-healthcare-800">Admin Panel</h1>
            <p className="text-gray-600 mt-2">Healthcare Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full px-4 py-3 border-2 border-healthcare-200 rounded-lg focus:outline-none focus:border-healthcare-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-healthcare-500 text-white py-3 rounded-lg hover:bg-healthcare-600 font-semibold disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            💡 Password: <code className="font-bold">admin123</code>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-healthcare-50 to-white">
      <header className="bg-white border-b border-healthcare-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-healthcare-800">⚙️ Admin Dashboard</h1>
          <button
            onClick={() => {
              setIsAuthenticated(false)
              sessionStorage.removeItem('admin_password')
              setPassword('')
            }}
            className="px-4 py-2 text-healthcare-600 hover:bg-healthcare-50 rounded-lg font-semibold"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {['doctors', 'bookings', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold capitalize border-b-2 transition-all ${
                activeTab === tab
                  ? 'text-healthcare-600 border-healthcare-600'
                  : 'text-gray-600 border-transparent hover:text-gray-800'
              }`}
            >
              {tab === 'doctors' && '👨‍⚕️ Doctors'}
              {tab === 'bookings' && '📅 Bookings'}
              {tab === 'stats' && '📊 Statistics'}
            </button>
          ))}
        </div>

        {/* DOCTORS TAB */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-healthcare-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-healthcare-800">Manage Doctors ({doctors.length})</h2>
                <button
                  onClick={() => setAddingDoctor(!addingDoctor)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
                >
                  {addingDoctor ? '✕ Cancel' : '+ Add Doctor'}
                </button>
              </div>

              {addingDoctor && (
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200 space-y-4 mb-6">
                  <h3 className="font-bold text-lg text-green-700">Add New Doctor</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Name" value={newDoctor.name} onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="Specialty" value={newDoctor.specialty} onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="number" placeholder="Rating" step="0.1" value={newDoctor.rating} onChange={(e) => setNewDoctor({ ...newDoctor, rating: parseFloat(e.target.value) })} className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input type="number" placeholder="Experience" value={newDoctor.experience_years} onChange={(e) => setNewDoctor({ ...newDoctor, experience_years: parseInt(e.target.value) })} className="px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <button
                    onClick={() => {
                      // For now, just show notification
                      showNotification('Add doctor feature coming soon', 'success')
                      setAddingDoctor(false)
                    }}
                    className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-semibold"
                  >
                    ✓ Add Doctor
                  </button>
                </div>
              )}

              {editingDoctor ? (
                <div className="bg-healthcare-50 p-6 rounded-lg border-2 border-healthcare-200 space-y-4">
                  <h3 className="font-bold text-lg text-healthcare-700">Edit Doctor</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Name" />
                    <input type="text" value={editForm.specialty || ''} onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Specialty" />
                    <input type="number" step="0.1" value={editForm.rating || 0} onChange={(e) => setEditForm({ ...editForm, rating: parseFloat(e.target.value) })} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Rating" />
                    <input type="number" value={editForm.experience_years || 0} onChange={(e) => setEditForm({ ...editForm, experience_years: parseInt(e.target.value) })} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Experience" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSaveDoctor} disabled={loading} className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-semibold disabled:opacity-50">✓ Save</button>
                    <button onClick={() => setEditingDoctor(null)} className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 font-semibold">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {doctors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No doctors yet</div>
                  ) : (
                    doctors.map(doctor => (
                      <div key={doctor._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-bold text-healthcare-700">{doctor.name}</p>
                          <p className="text-sm text-gray-600">{doctor.specialty} • ⭐ {doctor.rating} • {doctor.experience_years} yrs</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditDoctor(doctor)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">✏️ Edit</button>
                          <button onClick={() => handleDeleteDoctor(doctor._id, doctor.name)} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">🗑️ Delete</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-healthcare-200">
            <h2 className="text-xl font-bold text-healthcare-800 mb-6">All Bookings ({bookings.length})</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No bookings yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-healthcare-200">
                      <th className="text-left py-2 px-2">Doctor</th>
                      <th className="text-left py-2 px-2">Patient Email</th>
                      <th className="text-left py-2 px-2">Phone</th>
                      <th className="text-left py-2 px-2">Appointment</th>
                      <th className="text-center py-2 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-2 font-semibold text-healthcare-700">{booking.doctor_name || 'Unknown'}</td>
                        <td className="py-3 px-2">{booking.patient_email}</td>
                        <td className="py-3 px-2 text-sm">{booking.patient_phone}</td>
                        <td className="py-3 px-2 text-xs">{booking.slot_time ? new Date(booking.slot_time).toLocaleString() : 'N/A'}</td>
                        <td className="py-3 px-2 text-center">
                          <button onClick={() => handleCancelBooking(booking.slot_id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">Cancel</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.length === 0 ? (
              <div className="col-span-4 text-center py-8 text-gray-500">No statistics available</div>
            ) : (
              stats.map(stat => (
                <div key={stat.doctor_id} className="bg-white rounded-lg p-4 border border-healthcare-200 shadow-sm">
                  <p className="font-bold text-healthcare-700 text-sm">{stat.doctor_name}</p>
                  <div className="space-y-2 mt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Slots:</span>
                      <span className="font-bold">{stat.total_slots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-bold text-green-600">{stat.available_slots}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booked:</span>
                      <span className="font-bold text-orange-600">{stat.booked_slots}</span>
                    </div>
                  </div>
                  {stat.total_slots > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${(stat.booked_slots / stat.total_slots) * 100}%` }}></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {notification.show && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg text-white font-semibold ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}
