import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck, FileSearch, GitBranch, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'


const features = [
  { icon: <ShieldCheck className="w-4 h-4 text-amber-400" />, title: 'AI Trust Score', desc: 'Every property rated by multi-agent AI' },
  { icon: <FileSearch className="w-4 h-4 text-amber-400" />, title: 'Document Intelligence', desc: 'AI extracts key clauses & red flags' },
  { icon: <GitBranch className="w-4 h-4 text-amber-400" />, title: 'Fraud Graph', desc: 'Detect hidden builder connections' },
  { icon: <BarChart3 className="w-4 h-4 text-amber-400" />, title: 'Live Monitoring', desc: 'Get alerted on property changes' },
]

function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const getPasswordStrength = (password) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-400' }
    if (score === 2) return { score, label: 'Medium', color: 'bg-amber-400' }
    return { score, label: 'Strong', color: 'bg-emerald-500' }
  }

  const passwordStrength = getPasswordStrength(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = activeTab === 'login' ? '/auth/login' : '/auth/register'
      const payload = activeTab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }

      const res = await api.post(endpoint, payload)
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>

        {/* Glow blobs */}
        <div className="absolute top-[-60px] left-[-60px] w-80 h-80 bg-amber-500 opacity-15 rounded-full blur-3xl" />
        <div className="absolute bottom-[-40px] right-[-40px] w-72 h-72 bg-orange-700 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-48 h-48 bg-amber-500 opacity-5 rounded-full blur-2xl" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-amber-500 p-2.5 rounded-xl shadow-lg shadow-amber-500/30">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-2xl font-extrabold tracking-tight">TrustGhar</span>
          </div>

          {/* Tagline */}
          <h1 className="text-white text-4xl font-extrabold mb-4 leading-tight tracking-tight">
            Trust Every Property.<br />
            Invest With <span className="text-amber-400">Confidence.</span>
          </h1>
          <p className="text-stone-400 text-base mb-12">
            India's AI-powered property intelligence platform.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-3 border border-stone-700/50"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="bg-amber-500/15 p-1.5 rounded-lg shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <p className="text-stone-200 text-xs font-semibold">{item.title}</p>
                  <p className="text-stone-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-8 py-12"
        style={{ background: '#f5ede0' }}>
        <div className="w-full max-w-md rounded-2xl shadow-lg border border-stone-200 p-10 animate-fade-in"
          style={{ background: '#fdf8f2' }}>

          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <div className="bg-amber-500 p-1.5 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-stone-800 text-xl font-bold">TrustGhar</span>
          </div>

          <h2 className="text-stone-900 text-2xl font-bold text-center mb-1">
            Welcome to <span className="text-amber-500">TrustGhar</span>
          </h2>
          <p className="text-stone-500 text-center text-sm mb-6">Login or create an account to continue</p>

          {/* Tabs */}
          <div className="flex border-b border-stone-200 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${activeTab === 'login' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-400'}`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${activeTab === 'register' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-400'}`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {activeTab === 'login' ? (
              <>
                <div className="mb-4">
                  <label className="text-stone-700 text-sm font-medium mb-1.5 block">Email</label>
                  <input
                    type="email" name="email" placeholder="Enter your email"
                    value={form.email} onChange={handleChange}
                    className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-stone-900 outline-none focus:border-amber-500 transition-colors text-sm"
                  />
                </div>
                <div className="mb-2">
                  <label className="text-stone-700 text-sm font-medium mb-1.5 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} name="password" placeholder="Enter your password"
                      value={form.password} onChange={handleChange}
                      className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 pr-10 text-stone-900 outline-none focus:border-amber-500 transition-colors text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-stone-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="text-right mb-6">
                  <span className="text-amber-500 text-sm cursor-pointer hover:underline">Forgot password?</span>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold transition-colors text-sm tracking-wide disabled:opacity-60">
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-stone-700 text-sm font-medium mb-1.5 block">Full Name</label>
                  <input
                    type="text" name="name" placeholder="Enter your name"
                    value={form.name} onChange={handleChange}
                    className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-stone-900 outline-none focus:border-amber-500 transition-colors text-sm"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-stone-700 text-sm font-medium mb-1.5 block">Email</label>
                  <input
                    type="email" name="email" placeholder="Enter your email"
                    value={form.email} onChange={handleChange}
                    className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-stone-900 outline-none focus:border-amber-500 transition-colors text-sm"
                  />
                </div>
                <div className="mb-6">
                  <label className="text-stone-700 text-sm font-medium mb-1.5 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} name="password" placeholder="Create a password"
                      value={form.password} onChange={handleChange}
                      className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 pr-10 text-stone-900 outline-none focus:border-amber-500 transition-colors text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-stone-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1.5 mb-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i < passwordStrength.score ? passwordStrength.color : 'bg-stone-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-stone-400">
                        {passwordStrength.label} — use 8+ characters with a number and a symbol
                      </p>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold transition-colors text-sm tracking-wide disabled:opacity-60">
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </>
            )}
          </form>

          <p className="text-stone-500 text-center mt-6 text-sm">
            {activeTab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span
              onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
              className="text-amber-500 cursor-pointer hover:underline font-semibold"
            >
              {activeTab === 'login' ? 'Register' : 'Login'}
            </span>
          </p>
        </div>
      </div>

    </div>
  )
}

export default Login
