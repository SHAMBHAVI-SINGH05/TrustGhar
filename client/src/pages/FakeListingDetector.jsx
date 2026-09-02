import { useState, useEffect, useRef } from 'react'
import {
  Link2, Search,
  ShieldAlert, CheckCircle, Loader2, ChevronRight, Trash2
} from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

const verdictStyle = {
  'likely genuine': { badge: 'bg-emerald-500/20 text-emerald-400' },
  'use caution': { badge: 'bg-amber-500/20 text-amber-400' },
  'likely fake': { badge: 'bg-red-500/20 text-red-400' },
}

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function RedFlagCard({ flag }) {
  return (
    <div className="rounded-xl border p-4 bg-red-500/10 border-red-500/25">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
        <span className="text-stone-200 text-sm font-bold">{flag.type}</span>
      </div>
      <p className="text-stone-300 text-xs leading-relaxed">{flag.explanation}</p>
    </div>
  )
}

function ListingCard({ item, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const status = item.analysis?.status
  const isAnalyzing = status === 'analyzing'
  const isComplete = status === 'complete'
  const isFailed = status === 'failed'
  const redFlags = item.analysis?.red_flags || []
  const verdict = item.analysis?.verdict || 'use caution'
  const style = verdictStyle[verdict] || verdictStyle['use caution']

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this listing check?')) return
    try {
      await api.delete(`/listings/${item._id}`)
      onRefresh()
    } catch (err) {
      console.error('Failed to delete listing check:', err)
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => isComplete && setExpanded(e => !e)}
      >
        <div className="bg-amber-500/10 p-3 rounded-xl shrink-0">
          <Link2 className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-stone-200 text-sm font-semibold truncate">{item.url}</p>
          <p className="text-stone-500 text-xs mt-0.5">{formatDate(item.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAnalyzing && (
            <span className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...
            </span>
          )}
          {isComplete && (
            <>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${style.badge}`}>
                {verdict}
              </span>
              <ChevronRight className={`w-4 h-4 text-stone-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </>
          )}
          {isFailed && (
            <span className="text-red-400 text-xs font-semibold">Check failed</span>
          )}
          {!status && (
            <span className="text-stone-500 text-xs">Pending</span>
          )}
          <button onClick={handleDelete} className="text-stone-600 hover:text-red-400 transition-colors p-1" title="Delete check">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isComplete && expanded && (
        <div className="px-4 pb-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {item.analysis?.summary && (
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1">AI Summary</p>
              <p className="text-stone-200 text-sm leading-relaxed">{item.analysis.summary}</p>
            </div>
          )}
          {redFlags.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider">
                {redFlags.length} Red Flag{redFlags.length !== 1 ? 's' : ''} Found
              </p>
              {redFlags.map((flag, i) => (
                <RedFlagCard key={i} flag={flag} />
              ))}
            </div>
          ) : (
            <p className="text-stone-400 text-sm text-center py-4 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> No red flags found.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function FakeListingDetector() {
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  const fetchChecks = async () => {
    try {
      const res = await api.get('/listings')
      setChecks(res.data)
    } catch (err) {
      console.error('Failed to load listing checks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChecks()
  }, [])

  useEffect(() => {
    const hasAnalyzing = checks.some(c => c.analysis?.status === 'analyzing')
    if (hasAnalyzing) {
      pollRef.current = setInterval(fetchChecks, 5000)
    } else {
      clearInterval(pollRef.current)
    }
    return () => clearInterval(pollRef.current)
  }, [checks])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) { setError('Please paste a listing URL first.'); return }
    setError('')
    setSubmitting(true)
    try {
      await api.post('/listings/check', { url: url.trim() })
      setUrl('')
      await fetchChecks()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start check. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const checked = checks.filter(c => c.analysis?.status === 'complete').length
  const flagged = checks.filter(c => c.analysis?.status === 'complete' && c.analysis?.red_flags?.length > 0).length

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>

      <Sidebar active="Listings" />

      <div className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-10">

        <div className="mb-8">
          <h1 className="text-white text-2xl font-extrabold tracking-tight">Fake Listing Detector</h1>
          <p className="text-stone-400 text-sm mt-1">Paste a property listing link to check it for scam warning signs</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Checks', value: checks.length },
            { label: 'Checked', value: checked },
            { label: 'Flagged', value: flagged },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-white text-3xl font-extrabold tracking-tight">{s.value}</p>
              <p className="text-stone-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* URL form */}
            <form onSubmit={handleSubmit} className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-white font-bold text-sm mb-5">Check a Listing</h2>
              <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">Listing URL</label>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste MagicBricks / 99acres / Housing.com URL"
                className="w-full rounded-xl px-4 py-3 text-stone-200 text-sm outline-none focus:border-amber-500/50 transition-colors mb-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              {error && (
                <div className="text-sm rounded-xl px-4 py-2.5 mb-4" style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(248,113,113,0.3)', color: '#fca5a5' }}>{error}</div>
              )}
              <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60">
                <Search className="w-4 h-4" />
                {submitting ? 'Checking...' : 'Check Listing'}
              </button>
            </form>

            {/* Checks list */}
            <div className="flex flex-col gap-3">
              {loading && <p className="text-stone-400 text-sm">Loading checks...</p>}
              {!loading && checks.length === 0 && (
                <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Link2 className="w-8 h-8 text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-300 text-sm font-semibold mb-1">No listings checked yet</p>
                  <p className="text-stone-500 text-xs">Paste a listing URL above to start AI analysis</p>
                </div>
              )}
              {checks.map((item) => (
                <ListingCard key={item._id} item={item} onRefresh={fetchChecks} />
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-white font-bold text-sm">How it works</h3>
              </div>
              <p className="text-stone-400 text-xs leading-relaxed">
                Paste a property listing link. The AI reads the real page — price, description, seller details — checks it against common scam patterns, and searches the web for any existing scam reports about the seller or property.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default FakeListingDetector
