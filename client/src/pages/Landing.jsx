import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ShieldCheck, FileSearch, GitBranch, BarChart3, ArrowRight, Menu, X } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const features = [
  { icon: ShieldCheck, title: 'AI Trust Score', desc: 'Every property rated by multi-agent AI analyzing RERA data, documents, and builder history' },
  { icon: FileSearch, title: 'Document Intelligence', desc: 'AI extracts key clauses and red flags from sale deeds, RERA certificates, and more' },
  { icon: GitBranch, title: 'Fraud Network Graph', desc: 'Detect hidden connections between builders, shell companies, and risky entities' },
  { icon: BarChart3, title: 'Live Monitoring', desc: 'Get alerted the moment a property you care about has a new complaint or update' },
]

const steps = [
  { step: '01', title: 'RERA Scraper', desc: 'Fetches live registration data from the state RERA portal' },
  { step: '02', title: 'Fraud Detector', desc: 'Builds a knowledge graph to find hidden builder connections' },
  { step: '03', title: 'Document Analyzer', desc: 'Reads uploaded documents for risky clauses and mismatches' },
  { step: '04', title: 'Report Generator', desc: 'Compiles everything into one trust score and report' },
]

const stats = [
  { value: 2400, prefix: '', suffix: '+', label: 'Properties analyzed' },
  { value: 180, prefix: '₹', suffix: 'Cr', label: 'Fraud detected' },
  { value: 94, prefix: '', suffix: '%', label: 'Accuracy rate' },
  { value: 12, prefix: '', suffix: '', label: 'States covered' },
]

const navLinks = [
  { label: 'Features', id: 'features' },
  { label: 'How it Works', id: 'how-it-works' },
  { label: 'Pricing', id: 'pricing' },
]

const marqueeItems = ['RERA Verified', 'AI-Powered Analysis', 'Fraud Detection', 'Real-time Monitoring', 'Document Intelligence', 'Trust Score Engine']

function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const heroTextRef = useRef(null)
  const cardRef = useRef(null)
  const cardWrapRef = useRef(null)
  const statsRef = useRef(null)
  const marqueeRef = useRef(null)

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)

    gsap.timeline()
      .fromTo(heroTextRef.current.children, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' })
      .fromTo(cardRef.current, { opacity: 0, y: 40, rotate: 8 }, { opacity: 1, y: 0, rotate: 3, duration: 1, ease: 'power3.out' }, '-=0.5')

    const wrap = cardWrapRef.current
    const card = cardRef.current
    const handleMouseMove = (e) => {
      const rect = wrap.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      gsap.to(card, { rotateY: x * 14, rotateX: -y * 14, duration: 0.4, ease: 'power2.out' })
    }
    const handleMouseLeave = () => {
      gsap.to(card, { rotateY: 0, rotateX: 3, duration: 0.6, ease: 'power2.out' })
    }
    wrap.addEventListener('mousemove', handleMouseMove)
    wrap.addEventListener('mouseleave', handleMouseLeave)

    gsap.to(marqueeRef.current, { xPercent: -50, repeat: -1, duration: 18, ease: 'none' })

    statsRef.current.querySelectorAll('[data-counter]').forEach((el) => {
      const target = Number(el.dataset.counter)
      gsap.fromTo(el, { textContent: 0 }, {
        textContent: target,
        duration: 1.8,
        ease: 'power1.out',
        snap: { textContent: 1 },
        onUpdate() {
          el.textContent = Math.floor(el.textContent).toLocaleString('en-IN')
        },
        scrollTrigger: { trigger: el, start: 'top 90%' },
      })
    })

    gsap.utils.toArray('.reveal-card').forEach((card) => {
      gsap.fromTo(card, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 88%' },
      })
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
      wrap.removeEventListener('mousemove', handleMouseMove)
      wrap.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #1c1008 0%, #2d1a06 40%, #1a120a 100%)' }}>

      {/* Dot grid texture */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Public Navbar */}
      <nav className={`sticky top-0 z-50 px-8 py-4 transition-all duration-300 ${scrolled ? 'backdrop-blur-md shadow-lg' : ''}`}
        style={{ background: scrolled ? 'rgba(28,16,8,0.85)' : 'transparent', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-orange-700 p-1.5 rounded-lg shadow-lg shadow-orange-700/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">TrustGhar</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="text-stone-300 hover:text-orange-600 font-medium text-sm transition-colors">
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-stone-300 hover:text-white font-medium text-sm transition-colors">
              Login
            </button>
            <button onClick={() => navigate('/login')} className="flex items-center gap-2.5 bg-white hover:bg-stone-100 text-stone-900 pl-5 pr-1.5 py-1.5 rounded-full font-semibold text-sm transition-all shadow-lg">
              Get Started
              <span className="bg-stone-900 text-white rounded-full p-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden flex flex-col gap-4 mt-4 pb-2">
            {navLinks.map((link) => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="text-stone-300 text-left font-medium text-sm">
                {link.label}
              </button>
            ))}
            <button onClick={() => navigate('/login')} className="bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[30rem] h-[30rem] bg-orange-700 opacity-15 rounded-full blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-80px] w-[30rem] h-[30rem] bg-orange-900 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-orange-600 opacity-5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-8 py-20 grid grid-cols-2 gap-12 items-center">

          <div ref={heroTextRef}>
            <span className="inline-block bg-white/5 border border-white/10 text-orange-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              Multi-agent AI · Live RERA verification
            </span>
            <h1 className="text-white text-7xl font-black leading-[0.95] tracking-tight mb-6 uppercase">
              Trust Every<br />Property.
            </h1>
            <p className="text-stone-400 text-lg mb-10 max-w-md">
              Discover AI-verified properties designed for confident investing — where real RERA data meets fraud-checked due diligence and complete peace of mind.
            </p>
            <button onClick={() => navigate('/login')} className="flex items-center gap-3 bg-orange-700 hover:bg-orange-800 text-white pl-7 pr-2 py-2 rounded-full font-semibold text-base transition-all shadow-lg shadow-orange-700/30">
              Get Started
              <span className="bg-white text-orange-700 rounded-full p-3">
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
          </div>

          {/* Building image — animated entrance + mouse-tilt movement */}
          <div ref={cardWrapRef} className="relative" style={{ perspective: '1200px' }}>
            <img ref={cardRef} src="/Building model.png" alt="Modern property" className="w-full object-contain drop-shadow-2xl" style={{ transformStyle: 'preserve-3d' }} />
          </div>
        </div>
      </div>

      {/* Infinite marquee */}
      <div className="relative z-10 py-5 overflow-hidden border-y" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        <div ref={marqueeRef} className="flex gap-12 whitespace-nowrap" style={{ width: 'fit-content' }}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="text-stone-500 text-sm font-semibold uppercase tracking-wider flex items-center gap-3">
              {item} <span className="text-orange-700">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* About statement */}
      <div className="reveal-card max-w-4xl mx-auto px-8 my-24 relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-orange-600" />
          <span className="text-stone-400 text-sm font-semibold uppercase tracking-wider">About TrustGhar</span>
        </div>
        <h2 className="text-white text-3xl md:text-4xl font-extrabold leading-tight tracking-tight uppercase">
          We verify properties so you don't have to gamble on them.
        </h2>
        <p className="text-stone-500 text-2xl md:text-3xl font-extrabold leading-tight tracking-tight uppercase mt-3">
          Blending real RERA data, fraud detection, and document AI for complete peace of mind.
        </p>
      </div>

      {/* Stats bar */}
      <div ref={statsRef} className="max-w-5xl mx-auto px-8 my-20 relative z-10">
        <div className="rounded-2xl grid grid-cols-4 divide-x" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {stats.map((s, i) => (
            <div key={i} className="p-6 text-center" style={i > 0 ? { borderColor: 'rgba(255,255,255,0.08)' } : {}}>
              <p className="text-white text-2xl font-extrabold">
                {s.prefix}<span data-counter={s.value}>0</span>{s.suffix}
              </p>
              <p className="text-stone-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div id="features" className="max-w-6xl mx-auto px-8 mb-24 relative z-10 scroll-mt-24">
        <div className="text-center mb-12">
          <h2 className="text-white text-3xl font-extrabold tracking-tight mb-3">Built for serious due diligence</h2>
          <p className="text-stone-400 text-base">Four AI agents work together to give you the full picture</p>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} className="reveal-card rounded-2xl p-6 flex items-start gap-4 transition-all hover:bg-white/[0.06]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="bg-orange-700/10 p-3 rounded-xl shrink-0">
                  <Icon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-1">{f.title}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* How it works — connected timeline */}
      <div id="how-it-works" className="max-w-5xl mx-auto px-8 mb-24 relative z-10 scroll-mt-24">
        <div className="text-center mb-16">
          <h2 className="text-white text-3xl font-extrabold tracking-tight mb-3">How it works</h2>
          <p className="text-stone-400 text-base">Enter an address, and four AI agents take it from there</p>
        </div>
        <div className="relative grid grid-cols-4 gap-5">
          <div className="absolute top-5 left-0 right-0 h-px hidden md:block" style={{ background: 'rgba(255,255,255,0.1)' }} />
          {steps.map((s, i) => (
            <div key={i} className="reveal-card relative">
              <div className="w-10 h-10 rounded-full bg-orange-700 text-white flex items-center justify-center font-bold text-sm mb-4 relative z-10 shadow-lg shadow-orange-700/30">
                {i + 1}
              </div>
              <h3 className="text-white font-bold text-sm mb-1.5">{s.title}</h3>
              <p className="text-stone-400 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing teaser */}
      <div id="pricing" className="max-w-5xl mx-auto px-8 mb-24 relative z-10 scroll-mt-24">
        <div className="reveal-card rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-white text-2xl font-extrabold tracking-tight mb-2">Free during early access</h2>
          <p className="text-stone-400 text-sm mb-6 max-w-md mx-auto">
            TrustGhar is currently free to use while we build out the full AI pipeline. No credit card required.
          </p>
          <button onClick={() => navigate('/login')} className="inline-flex items-center gap-2 bg-orange-700 hover:bg-orange-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-orange-700/30">
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Final CTA */}
      <div className="px-8 py-20 text-center reveal-card relative overflow-hidden z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-700 opacity-15 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-white text-3xl font-extrabold tracking-tight mb-4">Ready to verify your next property?</h2>
          <p className="text-stone-400 text-base mb-8">Start your first investigation in under a minute.</p>
          <button onClick={() => navigate('/login')} className="inline-flex items-center gap-2 bg-orange-700 hover:bg-orange-800 text-white px-7 py-3.5 rounded-xl font-semibold text-base transition-all shadow-lg shadow-orange-700/30">
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-4 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-orange-700 p-1.5 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-extrabold text-lg tracking-tight">TrustGhar</span>
            </div>
            <p className="text-stone-400 text-sm max-w-sm leading-relaxed">
              India's AI-powered property intelligence platform — verifying RERA compliance, detecting fraud, and analyzing documents so you can invest with confidence.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Navigation</h4>
            <div className="flex flex-col gap-2.5">
              {navLinks.map((link) => (
                <button key={link.id} onClick={() => scrollTo(link.id)} className="text-stone-400 hover:text-orange-500 text-sm text-left transition-colors">
                  {link.label}
                </button>
              ))}
              <button onClick={() => navigate('/login')} className="text-stone-400 hover:text-orange-500 text-sm text-left transition-colors">
                Login
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <div className="flex flex-col gap-2.5 text-stone-400 text-sm">
              <p>support@trustghar.in</p>
              <p>Bangalore, Karnataka, India</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="text-stone-500 text-sm">Copyright TrustGhar © 2026</p>
          <div className="flex items-center gap-6">
            <span className="text-stone-500 text-sm cursor-default">Privacy Policy</span>
            <span className="text-stone-500 text-sm cursor-default">Terms Of Use</span>
          </div>
        </div>

        <div className="overflow-hidden select-none pointer-events-none" style={{ marginTop: '-1rem' }}>
          <p className="text-center font-black uppercase leading-none" style={{ fontSize: '11rem', color: 'rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>
            TRUSTGHAR
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
