import { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { X } from 'lucide-react'

// ── Slides ─────────────────────────────────────────────────────────────────────
const SLIDES = [
  { image: '/images/HeroBackground.jpeg', headline: 'Learn English,\nMandarin & More', sub: 'Expert-led courses designed to get you to your goal — fast.' },
  { image: '/images/Carousel3.jpeg',  headline: 'IELTS · PTE · GE\nAll in one place', sub: 'Structured lessons, quizzes, and AI-powered essay feedback.' },
  { image: '/images/Carousel2.jpeg',   headline: 'Your Progress,\nYour Pace', sub: 'Track every video watched, quiz completed, and essay submitted.' },
  { image: '/images/Carousel1.jpeg',       headline: 'Study Guides\nTailored for You', sub: 'Personalised materials assigned directly by your teacher.' },
  { image: '/images/Carousel0.jpeg',       headline: 'A Fun Place', sub: 'Where talent meets creativity.' },

]

const WA_NUMBER = '6285262289050'
const IG_URL    = 'https://www.instagram.com/eruditeenglish.mdn'

const TICKER_ITEMS = [
  'New IELTS Academic course now available!',
  'AI-powered essay checker — instant band score feedback',
  'PTE Academic & PTE Core classes open for enrollment',
  'A competition coming soon!',
  'Questions? Chat with us on WhatsApp or Instagram',
]

// ── Social SVGs ────────────────────────────────────────────────────────────────
function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
function InstagramIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}

// ── Coverflow Carousel ─────────────────────────────────────────────────────────
function CoverflowCarousel({ slides, current, onGo }) {
  const n = slides.length

  const positions = [
    { x: -280, width: 120, z: 1 }, // left
    { x: -140, width: 120, z: 2 }, // left-center
    { x: 0,    width: 480, z: 4 }, // active
    { x: 380,  width: 120, z: 2 }, // right-center
  ]

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {slides.map((slide, i) => {
        let relative = i - current

        if (relative > n / 2) relative -= n
        if (relative < -n / 2) relative += n

        if (Math.abs(relative) > 2) {
          return null
        }

        const isActive = relative === 0

        const isFar = Math.abs(relative) === 2

        const slotX = {
          [-2]: -1000,
          [-1]: -300,
          0 : 0,
          1 : 300,
          2 : 1000,
        }

        return (
          <div
            key={i}
            onClick={() => !isActive && onGo(i)}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',

              width: isActive ? 480 : 120,
              height: isActive ? '100%' : '76%',

              transform: `
                translate(
                  calc(-50% + ${slotX[relative] ?? 0}px),
                  -50%
                )
                scale(${isActive ? 1 : isFar ? 0.8 : 0.9})
              `,

              transition:
                'transform 0.5s ease, width 0.5s ease, height 0.5s ease, opacity 0.5s ease',

              zIndex: isActive
                ? 10
                : 10 - Math.abs(relative),

              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',

              border: '3px solid var(--color-border)',
              boxShadow: isActive
                ? 'var(--shadow-elevated)'
                : 'var(--shadow-card)',

              opacity: isActive
                ? 1
                : isFar
                ? 0
                : 0.45,
              
              pointerEvents: isFar ? 'none' : 'auto',

              filter: isActive
                ? 'none'
                : 'brightness(0.75) saturate(0.8)',

              cursor: isActive ? 'default' : 'pointer',
              overflow: 'hidden',
            }}
          >
            {isActive && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to top, rgba(20,20,20,0.92) 0%, rgba(20,20,20,0.55) 38%, rgba(20,20,20,0.04) 65%, transparent 100%)',
                    zIndex: 10,
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    bottom: 28,
                    left: 28,
                    right: 28,
                    zIndex: 11,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'clamp(16px, 2.4vw, 26px)',
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1.25,
                      marginBottom: 7,
                    }}
                  >
                    {slide.headline.split('\n').map((line, idx) => (
                      <span key={idx}>
                        {line}
                        {idx < slide.headline.split('\n').length - 1 && (
                          <br />
                        )}
                      </span>
                    ))}
                  </h3>

                  <p
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.82)',
                      lineHeight: 1.55,
                      margin: 0,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {slide.sub}
                  </p>
                </div>
              </>
            )}
          </div>
        )
      })}

      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          zIndex: 20,
        }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => onGo(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: i === current ? 22 : 7,
              height: 7,
              borderRadius: 999,
              border: '2px solid var(--color-border)',
              background:
                i === current
                  ? 'var(--color-accent)'
                  : 'var(--color-surface)',
              cursor: 'pointer',
              padding: 0,
              transition:
                'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Login Modal ────────────────────────────────────────────────────────────────
function LoginModal({ onClose }) {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [focused, setFocused]     = useState(null)
  const [btnState, setBtnState]   = useState('idle')
  const firstInputRef             = useRef(null)

  // Focus trap + keyboard close
  useEffect(() => {
    firstInputRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const btnStyle = {
    width: '100%',
    padding: '12px 20px',
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    background: btnState === 'idle' ? 'var(--color-surface)' : btnState === 'hover' ? 'var(--color-accent)' : 'var(--color-accent)',
    color: btnState === 'idle' ? 'var(--color-text)' : '#ffffff',
    boxShadow: btnState === 'idle' ? 'var(--shadow-card)' : btnState === 'hover' ? 'var(--shadow-hover)' : 'var(--shadow-pressed)',
    transform: btnState === 'hover' ? 'translate(2px,2px)' : btnState === 'active' ? 'translate(4px,4px)' : 'none',
    transition: 'all var(--transition-base)',
    opacity: loading ? 0.7 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }

  const inputStyle = (field) => ({
    width: '100%',
    padding: '10px 14px',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    background: 'var(--color-surface)',
    border: `2px solid ${focused === field ? 'var(--color-secondary)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-wobbly-sm)',
    color: 'var(--color-text)',
    outline: 'none',
    boxShadow: focused === field ? '0 0 0 3px rgba(45,93,161,0.12)' : 'none',
    transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
  })

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(253,251,247,0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'backdropIn 0.18s ease' }}
      aria-modal="true" role="dialog" aria-label="Sign in"
    >
      {/* Card — stop propagation so clicks inside don't close */}
      <div onClick={e => e.stopPropagation()}
        style={{ position: 'relative', background: 'var(--color-surface)', border: '3px solid var(--color-border)', borderRadius: 'var(--radius-wobbly)', boxShadow: 'var(--shadow-elevated)', padding: '40px 36px 32px', width: '100%', maxWidth: 380, animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Tape strip decoration */}
        <div aria-hidden style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%) rotate(-1.5deg)', width: 80, height: 22, background: 'rgba(229,224,216,0.7)', border: '1.5px solid rgba(45,45,45,0.2)', borderRadius: '3px 2px 4px 2px', zIndex: 1 }} />

        {/* Close button */}
        <button onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', background: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-2)', boxShadow: 'var(--shadow-card)', transition: 'all var(--transition-base)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-muted)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.transform = 'translate(2px,2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'none' }}>
          <X size={14} strokeWidth={2.5} />
        </button>

        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <img src="/images/Logo.png" alt="Erudite" style={{ width: 38, height: 38, objectFit: 'contain', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 3, boxShadow: 'var(--shadow-card)' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1.1 }}>Erudite English</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.1 }}>Welcome back!</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 5 }}>Email address</label>
            <input ref={firstInputRef} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              style={inputStyle('email')} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 5 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={inputStyle('password')} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />
          </div>

          {error && (
            <div style={{ padding: '9px 12px', background: 'var(--color-danger-bg)', border: '2px solid var(--color-danger)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: 13, color: 'var(--color-danger)', fontFamily: 'var(--font-body)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={btnStyle}
            onMouseEnter={() => !loading && setBtnState('hover')}
            onMouseLeave={() => setBtnState('idle')}
            onMouseDown={() => !loading && setBtnState('active')}
            onMouseUp={() => setBtnState('hover')}>
            {loading ? (
              <><span style={{ width: 14, height: 14, border: '2px solid rgba(45,45,45,0.3)', borderTopColor: btnState === 'idle' ? 'var(--color-text)' : '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Signing in…</>
            ) : 'Sign in →'}
          </button>
        </form>

        <p style={{ marginTop: 18, fontSize: 12, color: 'var(--color-text-3)', textAlign: 'center', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
          No account? Contact your course administrator.
        </p>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [showLogin, setShowLogin] = useState(false)
  const [current, setCurrent]     = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef(null)

  // Nav button states
  const [waState, setWaState]   = useState('idle')
  const [igState, setIgState]   = useState('idle')
  const [sigState, setSigState] = useState('idle')

  useEffect(() => { if (user) navigate('/') }, [user])

  function goTo(idx) {
    if (animating || idx === current) return
    setAnimating(true); setCurrent(idx)
    setTimeout(() => setAnimating(false), 380)
    clearInterval(timerRef.current); startAutoplay()
  }
  function startAutoplay() {
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 4500)
  }
  useEffect(() => { startAutoplay(); return () => clearInterval(timerRef.current) }, [])

  // Shared inline button factory matching design-system spec
  // hoverColor: any CSS color string — used as fill on hover/active
  const mkBtn = (state, hoverColor = 'var(--color-accent)', color = '#ffffff') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 18px',
    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
    border: '2.5px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    cursor: 'pointer', textDecoration: 'none',
    whiteSpace: 'nowrap',
    background: state === 'idle' ? 'var(--color-surface)' : hoverColor,
    color: state === 'idle' ? 'var(--color-text)' : '#ffffff',
    boxShadow: state === 'idle' ? 'var(--shadow-card)' : state === 'hover' ? 'var(--shadow-hover)' : 'var(--shadow-pressed)',
    transform: state === 'hover' ? 'translate(2px,2px)' : state === 'active' ? 'translate(4px,4px)' : 'none',
    transition: 'all var(--transition-base)',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>
      <style>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes fadeUp      { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes backdropIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes modalIn     { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes marquee     { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes wiggle      { 0%,100%{transform:rotate(-1deg)} 50%{transform:rotate(1deg)} }
        * { box-sizing: border-box; }

        @media (max-width: 860px) {
          .lp-hero     { flex-direction: column !important; gap: 32px !important; }
          .lp-herotext { max-width: 100% !important; }
          .lp-carousel { width: 100% !important; height: 300px !important; }
          .lp-navlinks { display: none !important; }
          .lp-h1       { font-size: clamp(32px,8vw,52px) !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--color-bg)', borderBottom: '2.5px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/images/Logo.png" alt="Erudite" style={{ width: 36, height: 36, objectFit: 'contain', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 3, boxShadow: 'var(--shadow-card)' }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 19, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Erudite English</span>
          </div>

          {/* Nav links + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="lp-navlinks"
              style={mkBtn(waState, '#25D366')}
              onMouseEnter={() => setWaState('hover')} onMouseLeave={() => setWaState('idle')}
              onMouseDown={() => setWaState('active')} onMouseUp={() => setWaState('hover')}>
              <WhatsAppIcon size={14} /> WhatsApp
            </a>
            <a href={IG_URL} target="_blank" rel="noreferrer" className="lp-navlinks"
              style={mkBtn(igState, '#e1306c')}
              onMouseEnter={() => setIgState('hover')} onMouseLeave={() => setIgState('idle')}
              onMouseDown={() => setIgState('active')} onMouseUp={() => setIgState('hover')}>
              <InstagramIcon size={14} /> Instagram
            </a>
            <b>-</b>
            {/* Sign In — always visible */}
            <button onClick={() => setShowLogin(true)}
              style={mkBtn(sigState, 'var(--color-accent)', '#e1306c')}
              onMouseEnter={() => setSigState('hover')} onMouseLeave={() => setSigState('idle')}
              onMouseDown={() => setSigState('active')} onMouseUp={() => setSigState('hover')}>
              Sign In →
            </button>
          </div>
        </div>
      </nav>

      {/* ── TICKER ── */}
      <div style={{ background: 'var(--color-accent)', borderBottom: '2.5px solid var(--color-border)', overflow: 'hidden' }} aria-label="Updates">
        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: '9px 0' }}>
          <div style={{ display: 'inline-flex', animation: 'marquee 36s linear infinite' }}
            onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
            onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)', display: 'inline-flex', alignItems: 'center' }}>
                {item}<span style={{ margin: '0 18px', color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '60px 28px 48px' }}>
        <div className="lp-hero" style={{ display: 'flex', alignItems: 'flex-start', gap: 56 }}>

          {/* Left: headline + CTAs */}
          <div className="lp-herotext" style={{ flex: '0 0 420px', maxWidth: 420, animation: 'fadeUp 0.5s ease both' }}>

            {/* Sticky-note tag */}
            <div style={{ display: 'inline-block', background: 'var(--color-surface-2)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: '3px 12px', marginBottom: 18, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', boxShadow: 'var(--shadow-card)', transform: 'rotate(-1.2deg)' }}>
              English · Mandarin · Computer
            </div>

            <h1 className="lp-h1" style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(38px,5vw,62px)', fontWeight: 700, lineHeight: 1.1, color: 'var(--color-text)', marginBottom: 20 }}>
              Your <span style={{ color: 'var(--color-accent)' }}>English</span><br />
              Journey<br />
              <span style={{ color: 'var(--color-secondary)', display: 'inline-block', animation: 'wiggle 3s ease-in-out infinite' }}>Starts Here!</span>
            </h1>

            <p style={{ fontSize: 16, color: 'var(--color-text-2)', lineHeight: 1.7, marginBottom: 32, maxWidth: 380 }}>
              From IELTS to PTE and General English — structured courses, AI essay feedback, and personalised study guides crafted just for you.
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, border: '3px solid var(--color-border)', borderRadius: 'var(--radius-wobbly)', background: '#25D366', color: '#ffffff', boxShadow: 'var(--shadow-card)', textDecoration: 'none', transition: 'all var(--transition-base)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.transform = 'translate(2px,2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'none' }}>
                <WhatsAppIcon size={16} /> Chat on WhatsApp
              </a>
              <a href={IG_URL} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, border: '3px solid var(--color-border)', borderRadius: 'var(--radius-wobbly)', background: 'var(--color-surface)', color: 'var(--color-text)', boxShadow: 'var(--shadow-card)', textDecoration: 'none', transition: 'all var(--transition-base)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#E1306C'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.transform = 'translate(2px,2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'none' }}>
                <InstagramIcon size={16} /> Follow us
              </a>
            </div>
          </div>

          {/* Right: coverflow carousel */}
          <div className="lp-carousel" style={{ flex: 1, minWidth: 0, height: 420, animation: 'fadeUp 0.6s 0.08s ease both' }}>
            <CoverflowCarousel slides={SLIDES} current={current} onGo={goTo} />
          </div>
        </div>
      </main>

      {/* ── ABOUT US ── */}
      <section style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 28px 72px', marginTop: '48px' }}>
        <div style={{
          position: 'relative',
          background: 'var(--color-surface)',
          border: '2.5px solid var(--color-border)',
          borderRadius: 'var(--radius-wobbly)',
          boxShadow: 'var(--shadow-card)',
          padding: '48px 52px 44px',
          backgroundImage: 'radial-gradient(var(--color-muted) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}>

          {/* Floating label tag — centered at top edge */}
          <div style={{
            position: 'absolute', top: -18, left: '50%',
            transform: 'translateX(-50%)',
            background: '#f5f0d0',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-wobbly-sm)',
            padding: '4px 20px',
            fontSize: 13, fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-text)',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-card)',
            letterSpacing: '0.02em',
          }}>
            About Us
          </div>

          {/* Headline */}
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(22px, 3.5vw, 36px)',
            fontWeight: 700,
            color: 'var(--color-text)',
            textAlign: 'center',
            lineHeight: 1.25,
            marginBottom: 32,
            marginTop: 8,
          }}>
            We help students unlock their potential<br />
            <span style={{ color: 'var(--color-accent)' }}>one lesson at a time.</span>
          </h2>

          {/* Body with drop cap */}
          <div style={{ maxWidth: 780, margin: '0 auto', fontSize: 16, color: 'var(--color-text-2)', lineHeight: 1.75, fontFamily: 'var(--font-body)' }}>
            <p style={{ marginBottom: 20 }}>
              <span style={{
                float: 'left',
                fontFamily: 'var(--font-heading)',
                fontSize: 56, fontWeight: 700,
                lineHeight: 0.8,
                marginRight: 10, marginTop: 6,
                color: 'var(--color-secondary)',
              }}>Erudite English</span>
              was founded with a single belief: that language learning should be personal, structured, and genuinely enjoyable. Based in Medan, we work with students preparing for IELTS, PTE Academic, and General English — combining expert-led instruction with modern tools like AI essay scoring and personalised study guides, while also offering courses like Mandarin and Computer.
            </p>
            <p>
              Our platform is built for real students with real goals. Whether you're aiming for a band 7.5, preparing for a university abroad, or simply sharpening your everyday English, we meet you where you are and help you get where you want to go.
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 40 }}>
            {[
              { value: '100+', label: 'Students Taught' },
              { value: '3',    label: 'Course Tracks' },
              { value: 'AI',   label: 'Essay Feedback' },
              { value: '100%', label: 'Online & Flexible' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'var(--color-surface)',
                border: '2.5px solid var(--color-border)',
                borderRadius: 'var(--radius-wobbly-sm)',
                padding: '14px 28px',
                textAlign: 'center',
                boxShadow: '3px 3px 0px var(--color-border)',
                minWidth: 120,
              }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── LOGIN MODAL ── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}
