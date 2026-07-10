import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Bell, LogOut, Radio, MapPin, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import api from '../api/axios'

function Monitor() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkingId, setCheckingId] = useState(null)
  const [checkResult, setCheckResult] = useState(null)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  useEffect(() => {
    api.get('/monitor')
      .then((res) => setProperties(res.data))
      .catch((err) => console.error('Failed to load monitored properties:', err))
      .finally(() => setLoading(false))
  }, [])

  const stopMonitoring = async (id) => {
    try {
      await api.delete(`/monitor/${id}`)
      setProperties((prev) => prev.filter((p) => p._id !== id))
    } catch (err) {
      console.error('Failed to stop monitoring:', err)
    }
  }

  const checkNow = async (id) => {
    setCheckingId(id)
    setCheckResult(null)
    try {
      const { data } = await api.post(`/monitor/${id}/check-now`)
      setProperties((prev) => prev.map((p) => (p._id === id ? { ...p, trustScore: data.newScore, status: 'complete' } : p)))
      setCheckResult({ id, oldScore: data.oldScore, newScore: data.newScore })
    } catch (err) {
      console.error('Failed to run check:', err)
    } finally {
      setCheckingId(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5ede0' }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-stone-200 px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-500 p-1.5 rounded-lg shadow-md shadow-indigo-200">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-stone-900 font-extrabold text-base tracking-tight">TrustGhar</span>
          </div>
          <div className="flex items-center gap-1">
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Investigations', path: '/dashboard' },
              { label: 'Documents', path: '/documents' },
              { label: 'Listings', path: '/listings' },
              { label: 'Alerts', path: '/alerts' },
              { label: 'Monitor', path: '/monitor' },
            ].map((item, i) => (
              <button key={i} onClick={() => navigate(item.path)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
                ${item.label === 'Monitor' ? 'bg-indigo-500 text-white shadow-sm' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl hover:bg-stone-100 transition-colors">
            <Bell className="w-4 h-4 text-stone-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
          </button>
          <div className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">S</div>
            <span className="text-stone-700 text-sm font-medium">Shambhavi</span>
          </div>
          <button onClick={handleLogout} className="text-stone-400 hover:text-red-500 transition-colors p-1"><LogOut className="w-4 h-4" /></button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">

        <div className="mb-8">
          <h1 className="text-stone-900 text-2xl font-extrabold tracking-tight">Monitor</h1>
          <p className="text-stone-400 text-sm mt-1">
            {properties.length > 0 ? `Watching ${properties.length} propert${properties.length > 1 ? 'ies' : 'y'}` : 'No properties being watched'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {loading && (
            <p className="text-stone-400 text-sm">Loading monitored properties...</p>
          )}
          {!loading && properties.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-stone-100">
              <Radio className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">
                No properties monitored yet. Open a report and click "Monitor This Property" to start watching for updates.
              </p>
            </div>
          )}
          {properties.map((prop) => (
            <div key={prop._id} className="flex flex-col gap-2 bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 p-3 rounded-xl shrink-0">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <p className="text-stone-800 text-sm font-semibold">{prop.propertyAddress}</p>
                  <p className="text-stone-400 text-xs mt-0.5">
                    {prop.status === 'complete' ? `Trust score: ${prop.trustScore}` : `Status: ${prop.status}`}
                  </p>
                </div>
                <button
                  onClick={() => checkNow(prop._id)}
                  disabled={checkingId === prop._id}
                  className="flex items-center gap-1.5 text-indigo-500 hover:text-indigo-600 text-xs font-semibold transition-colors shrink-0 disabled:opacity-50">
                  {checkingId === prop._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {checkingId === prop._id ? 'Checking...' : 'Check Now'}
                </button>
                <button onClick={() => stopMonitoring(prop._id)} className="flex items-center gap-1.5 text-stone-400 hover:text-red-500 text-xs font-semibold transition-colors shrink-0">
                  <XCircle className="w-3.5 h-3.5" />
                  Stop Monitoring
                </button>
              </div>
              {checkResult?.id === prop._id && (
                <p className="text-xs text-stone-500 pl-14">
                  Checked: {checkResult.oldScore} → {checkResult.newScore}
                  {checkResult.newScore !== checkResult.oldScore ? ' — changed, see Alerts for details' : ' — no change'}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Monitor
