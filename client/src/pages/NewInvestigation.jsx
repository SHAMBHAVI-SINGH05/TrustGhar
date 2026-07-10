import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Bell, LogOut, MapPin, Link, ChevronDown, Zap, FileSearch, Brain, BarChart3, ArrowRight, Search } from 'lucide-react'
import api from '../api/axios'

const indianStates = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
]

const investigationTypes = [
  { id: 'full', label: 'Full Analysis', desc: 'All AI agents — RERA scraping, fraud graph, document check, trust score report', icon: <Brain className="w-5 h-5" />, time: '3–5 min', recommended: true },
  { id: 'quick', label: 'Quick Check', desc: 'RERA verification + basic trust score only. Faster but less detailed.', icon: <Zap className="w-5 h-5" />, time: '~1 min', recommended: false },
  { id: 'document', label: 'Document Only', desc: 'Skip RERA scraping. Upload your own documents for AI analysis.', icon: <FileSearch className="w-5 h-5" />, time: '~2 min', recommended: false },
]

const agents = [
  { icon: <Search className="w-4 h-4 text-indigo-500" />, name: 'RERA Scraper Agent', desc: 'Fetches live data from state RERA portal' },
  { icon: <Brain className="w-4 h-4 text-indigo-500" />, name: 'Fraud Detector Agent', desc: 'Builds knowledge graph, finds hidden links' },
  { icon: <FileSearch className="w-4 h-4 text-indigo-500" />, name: 'Document Analyzer Agent', desc: 'Extracts clauses & red flags from PDFs' },
  { icon: <BarChart3 className="w-4 h-4 text-indigo-500" />, name: 'Report Generator Agent', desc: 'Compiles trust score & final report' },
]

function NewInvestigation() {
  const navigate = useNavigate()
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }
  const [form, setForm] = useState({ address: '', listingUrl: '', state: '', type: 'full' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleType = (id) => setForm({ ...form, type: id })

  const handleStart = async () => {
    setError('')
    setSubmitting(true)
    try {
      const res = await api.post('/investigations', {
        propertyAddress: form.address,
        listingUrl: form.listingUrl,
        state: form.state,
      })
      navigate(`/investigate/live/${res.data.investigationId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start investigation. Please try again.')
    } finally {
      setSubmitting(false)
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
            {['Dashboard', 'Investigations', 'Documents', 'Listings', 'Alerts', 'Monitor'].map((item, i) => (
              <button key={i} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
                ${i === 1 ? 'bg-indigo-500 text-white shadow-sm' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}>
                {item}
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

      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-stone-900 text-2xl font-extrabold tracking-tight">New Investigation</h1>
          <p className="text-stone-400 text-sm mt-1">Enter property details to start an AI-powered trust analysis</p>
        </div>

        <div className="grid grid-cols-3 gap-8 items-stretch">

          {/* Left — Form */}
          <div className="col-span-2 flex flex-col gap-5">

            {/* Property Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <h2 className="text-stone-900 font-bold text-sm mb-5">Property Details</h2>

              <div className="mb-4">
                <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">Property Address <span className="text-red-400">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-300" />
                  <input type="text" name="address" value={form.address} onChange={handleChange}
                    placeholder="e.g. Prestige Towers, Whitefield, Bangalore"
                    className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-stone-800 text-sm outline-none focus:border-indigo-400 transition-colors placeholder:text-stone-300 bg-white"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">Listing URL <span className="text-stone-300 normal-case font-normal">(optional)</span></label>
                <div className="relative">
                  <Link className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-300" />
                  <input type="url" name="listingUrl" value={form.listingUrl} onChange={handleChange}
                    placeholder="Paste MagicBricks / 99acres / Housing.com URL"
                    className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-stone-800 text-sm outline-none focus:border-indigo-400 transition-colors placeholder:text-stone-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-500 text-xs font-semibold mb-1.5 block uppercase tracking-wider">State <span className="text-red-400">*</span></label>
                <div className="relative">
                  <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-stone-300 pointer-events-none" />
                  <select name="state" value={form.state} onChange={handleChange}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-700 text-sm outline-none appearance-none focus:border-indigo-400 transition-colors bg-white">
                    <option value="">Select state for RERA lookup</option>
                    {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Investigation Type */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex-1 flex flex-col">
              <h2 className="text-stone-900 font-bold text-sm mb-5">Investigation Type</h2>
              <div className="flex flex-col gap-3">
                {investigationTypes.map((t) => (
                  <button key={t.id} onClick={() => handleType(t.id)}
                    className={`flex items-start gap-4 p-4 rounded-xl text-left transition-all border
                      ${form.type === t.id
                        ? 'bg-indigo-50 border-indigo-300'
                        : 'bg-stone-50 border-stone-100 hover:border-stone-200'}`}>
                    <div className={`p-2 rounded-lg mt-0.5 ${form.type === t.id ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-stone-400 border border-stone-200'}`}>
                      {t.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold ${form.type === t.id ? 'text-indigo-700' : 'text-stone-700'}`}>{t.label}</span>
                        {t.recommended && <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Recommended</span>}
                        <span className="ml-auto text-xs text-stone-400">{t.time}</span>
                      </div>
                      <p className="text-stone-400 text-xs leading-relaxed">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <button onClick={handleStart} disabled={submitting} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-60">
              <Brain className="w-5 h-5" />
              {submitting ? 'Starting...' : 'Start AI Investigation'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Right — Info */}
          <div className="flex flex-col gap-5">

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <h3 className="text-stone-900 font-bold text-sm mb-1">What happens next?</h3>
              <p className="text-stone-400 text-xs mb-4">AI agents run in sequence and report back</p>
              <div className="flex flex-col gap-2.5">
                {agents.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="bg-indigo-50 p-1.5 rounded-lg shrink-0">{a.icon}</div>
                    <p className="text-stone-700 text-xs font-semibold">{a.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <h3 className="text-stone-700 font-bold text-sm mb-4">Tips for better results</h3>
              <div className="flex flex-col gap-3">
                {[
                  'Include full address with city and pincode',
                  'Adding a listing URL helps the scraper find exact RERA details',
                  'Select correct state — each state has a separate RERA portal',
                  'Full Analysis gives the most complete fraud detection',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <p className="text-stone-400 text-xs leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5 border border-indigo-100 flex-1 flex flex-col justify-center" style={{ background: '#eef2ff' }}>
              <p className="text-indigo-500 text-xs font-bold uppercase tracking-wider mb-3">Platform Stats</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: '2,400+', label: 'Properties analyzed' },
                  { value: '₹180Cr', label: 'Fraud detected' },
                  { value: '94%', label: 'Accuracy rate' },
                  { value: '12', label: 'States covered' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-stone-800 font-extrabold text-lg">{s.value}</p>
                    <p className="text-stone-400 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewInvestigation
