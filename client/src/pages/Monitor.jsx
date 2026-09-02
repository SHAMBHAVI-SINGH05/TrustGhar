import { useState, useEffect } from 'react'
import { Radio, MapPin, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

function Monitor() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkingId, setCheckingId] = useState(null)
  const [checkResult, setCheckResult] = useState(null)

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
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>

      <Sidebar active="Monitor" />

      <div className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-8 py-10">

          <div className="mb-8">
            <h1 className="text-white text-2xl font-extrabold tracking-tight">Monitor</h1>
            <p className="text-stone-400 text-sm mt-1">
              {properties.length > 0 ? `Watching ${properties.length} propert${properties.length > 1 ? 'ies' : 'y'}` : 'No properties being watched'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {loading && (
              <p className="text-stone-400 text-sm">Loading monitored properties...</p>
            )}
            {!loading && properties.length === 0 && (
              <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Radio className="w-8 h-8 text-stone-600 mx-auto mb-3" />
                <p className="text-stone-400 text-sm">
                  No properties monitored yet. Open a report and click "Monitor This Property" to start watching for updates.
                </p>
              </div>
            )}
            {properties.map((prop) => (
              <div key={prop._id} className="flex flex-col gap-2 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500/10 p-3 rounded-xl shrink-0">
                    <MapPin className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-stone-200 text-sm font-semibold">{prop.propertyAddress}</p>
                    <p className="text-stone-500 text-xs mt-0.5">
                      {prop.status === 'complete' ? `Trust score: ${prop.trustScore}` : `Status: ${prop.status}`}
                    </p>
                  </div>
                  <button
                    onClick={() => checkNow(prop._id)}
                    disabled={checkingId === prop._id}
                    className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs font-semibold transition-colors shrink-0 disabled:opacity-50">
                    {checkingId === prop._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {checkingId === prop._id ? 'Checking...' : 'Check Now'}
                  </button>
                  <button onClick={() => stopMonitoring(prop._id)} className="flex items-center gap-1.5 text-stone-500 hover:text-red-400 text-xs font-semibold transition-colors shrink-0">
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
    </div>
  )
}

export default Monitor
