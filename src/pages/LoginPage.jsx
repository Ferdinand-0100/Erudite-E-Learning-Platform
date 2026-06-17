import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

// ── Carousel slides ────────────────────────────────────────────────────────────
const SLIDES = [
  {
    image: '/images/HeroBackground.jpeg',
    headline: 'Learn English,\nMandarin & More',
    sub: 'Expert-led courses designed to get you to your goal — fast.',
  },
  {
    image: '/images/Carousel_Temp2.jpg',
    headline: 'IELTS · PTE · GE\nAll in one place',
    sub: 'Structured lessons, quizzes, and AI-powered essay feedback.',
  },
  {
    image: '/images/Carousel_Temp.jpg',
    headline: 'Your Progress,\nYour Pace',
    sub: 'Track every video watched, quiz completed, and essay submitted.',
  },
]

const WA_NUMBER = '6285262289050'
const IG_URL = 'https://www.instagram.com/eruditeenglish.mdn'

// ── Ticker items — edit these to change the promo text ────────────────────────
const TICKER_ITEMS = [
  'New IELTS Academic course now available!',
  'AI-powered essay checker — get instant band score feedback',
  'PTE Academic & PTE Core classes open for enrollment',
  'Questions? Chat with us on WhatsApp or Instagram',
  'A cool competition coming soon!',
]

// ── WhatsApp SVG icon ──────────────────────────────────────────────────────────
function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ── Instagram SVG icon ─────────────────────────────────────────────────────────
function InstagramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}

export default function LoginPage() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()

  // ── Auth state ───────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [btnState, setBtnState] = useState('idle')
  const [focusedInput, setFocusedInput] = useState(null)

  // ── Carousel state ───────────────────────────────────────
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const autoplayRef = useRef(null)

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  // Auto-advance carousel every 4s
  useEffect(() => {
    autoplayRef.current = setInterval(() => {
      goToNext()
    }, 4000)
    return () => clearInterval(autoplayRef.current)
  }, [currentSlide])

  function goTo(index) {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide(index)
      setIsTransitioning(false)
    }, 300)
    clearInterval(autoplayRef.current)
  }

  function goToNext() {
    const next = (currentSlide + 1) % SLIDES.length
    goTo(next)
  }

  function goToPrev() {
    const prev = (currentSlide - 1 + SLIDES.length) % SLIDES.length
    goTo(prev)
  }

  // ── Form submit ──────────────────────────────────────────
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

  const slide = SLIDES[currentSlide]

  const btnStyle = {
    ...styles.btn,
    ...(btnState === 'hover' && !loading ? styles.btnHover : {}),
    ...(btnState === 'active' && !loading ? styles.btnActive : {}),
    ...(loading ? styles.btnLoading : {}),
  }

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .ticker-track { display: flex; width: max-content; animation: marquee 28s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }

        .landing-left { display: flex; }
        .landing-right { display: flex; }

        @media (max-width: 768px) {
          .landing-wrapper {
            flex-direction: column !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .landing-left {
            width: 100% !important;
            height: 320px !important;
            min-height: 0 !important;
            border-radius: 0 !important;
            border-right: none !important;
            border-bottom: 3px solid var(--color-border) !important;
          }
          .landing-right {
            width: 100% !important;
            padding: 32px 20px !important;
            justify-content: center !important;
          }
          .login-card {
            transform: none !important;
            max-width: 400px !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* ── Ticker bar ───────────────────────────────────── */}
      <div style={styles.ticker} aria-label="Promotions ticker">
        {/* overflow hidden viewport */}
        <div style={styles.tickerViewport}>
          {/* The track is doubled so the loop is seamless */}
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} style={styles.tickerItem}>
                {item}
                <span style={styles.tickerSep} aria-hidden="true">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two-column wrapper ────────────────────────────── */}
      <div className="landing-wrapper" style={styles.wrapper}>

        {/* ── LEFT: Carousel ─────────────────────────────── */}
        <div className="landing-left" style={styles.left}>

          {/* Slide image */}
          <div
            style={{
              ...styles.slideImg,
              backgroundImage: `url(${slide.image})`,
              backgroundSize: slide.objectFit === 'contain' ? 'contain' : 'cover',
              backgroundColor: slide.bgColor || '#1a1a2e',
              opacity: isTransitioning ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* Dark gradient overlay — only for photo slides */}
          {!slide.objectFit && (
            <div style={styles.slideOverlay} />
          )}

          {/* Text content */}
          <div
            style={{
              ...styles.slideContent,
              opacity: isTransitioning ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            <h2 style={styles.slideHeadline}>
              {slide.headline.split('\n').map((line, i) => (
                <span key={i}>{line}{i < slide.headline.split('\n').length - 1 && <br />}</span>
              ))}
            </h2>
            <p style={styles.slideSub}>{slide.sub}</p>
          </div>

          {/* Carousel controls */}
          <div style={styles.carouselControls}>
            {/* Prev button */}
            <button
              onClick={goToPrev}
              style={styles.arrowBtn}
              aria-label="Previous slide"
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
            >
              ‹
            </button>

            {/* Dots */}
            <div style={styles.dots}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  style={{
                    ...styles.dot,
                    ...(i === currentSlide ? styles.dotActive : {}),
                  }}
                />
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={goToNext}
              style={styles.arrowBtn}
              aria-label="Next slide"
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
            >
              ›
            </button>
          </div>
        </div>

        {/* ── RIGHT: Login form ───────────────────────────── */}
        <div className="landing-right" style={styles.right}>
          <div className="login-card" style={styles.card}>

            <img src="/images/Logo.png" alt="Erudite logo" style={styles.logo} />
            <div style={styles.brand}>Erudite English</div>
            <h1 style={styles.heading}>Welcome back</h1>
            <p style={styles.sub}>Sign in to access your courses</p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    ...styles.input,
                    borderColor: focusedInput === 'email' ? 'var(--color-secondary)' : 'var(--color-border)',
                  }}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    ...styles.input,
                    borderColor: focusedInput === 'password' ? 'var(--color-secondary)' : 'var(--color-border)',
                  }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
              </div>

              {error && <div style={styles.errorBox}>{error}</div>}

              <button
                type="submit"
                disabled={loading}
                style={btnStyle}
                onMouseEnter={() => setBtnState('hover')}
                onMouseLeave={() => setBtnState('idle')}
                onMouseDown={() => setBtnState('active')}
                onMouseUp={() => setBtnState('hover')}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={styles.spinner} />
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            <p style={styles.note}>
              No account? Contact your course administrator.
            </p>

            {/* Social links */}
            <div style={styles.socialRow}>
              <a
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                style={styles.socialBtn}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#25D366'
                  e.currentTarget.style.color = '#fff'
                  e.currentTarget.style.transform = 'translate(2px, 2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-hover)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--color-muted)'
                  e.currentTarget.style.color = 'var(--color-text-2)'
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)'
                }}
              >
                <WhatsAppIcon size={15} />
                WhatsApp
              </a>
              <a
                href={IG_URL}
                target="_blank"
                rel="noreferrer"
                style={styles.socialBtn}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#E1306C'
                  e.currentTarget.style.color = '#fff'
                  e.currentTarget.style.transform = 'translate(2px, 2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-hover)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--color-muted)'
                  e.currentTarget.style.color = 'var(--color-text-2)'
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)'
                }}
              >
                <InstagramIcon size={15} />
                Instagram
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    gap: '16px',
    background: 'var(--color-bg)',
  },

  wrapper: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    maxWidth: '1200px',
    minHeight: '600px',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    boxShadow: 'var(--shadow-elevated)',
    overflow: 'hidden',
    transform: 'rotate(-0.3deg)',
  },

  // ── Ticker ───────────────────────────────────────────────
  ticker: {
    width: '100%',
    maxWidth: '1200px',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    boxShadow: 'var(--shadow-card)',
    background: 'var(--color-accent)',
    overflow: 'hidden',
    // Slight counter-rotation to the wrapper for a playful offset
    transform: 'rotate(0.4deg)',
  },

  tickerViewport: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    padding: '10px 0',
  },

  tickerItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    fontFamily: 'var(--font-heading)',
    fontSize: '14px',
    fontWeight: 700,
    color: '#ffffff',
    paddingRight: '4px',
  },

  tickerSep: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '10px',
    marginLeft: '12px',
  },

  // ── Left carousel panel ──────────────────────────────────
  left: {
    position: 'relative',
    width: '55%',
    minHeight: '560px',
    flexShrink: 0,
    overflow: 'hidden',
    borderRight: '3px solid var(--color-border)',
    // Force GPU compositing so the overflow clip is always respected
    // even during the opacity crossfade transition
    transform: 'translateZ(0)',
    isolation: 'isolate',
  },

  slideImg: {
    position: 'absolute',
    inset: 0,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    // Keep the element on its own composited layer so the clip
    // is applied before the first painted frame appears
    willChange: 'opacity',
    transform: 'translateZ(0)',
  },

  slideOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(160deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.65) 100%)',
  },

  slideContent: {
    position: 'absolute',
    bottom: '80px',
    left: '36px',
    right: '36px',
    zIndex: 2,
  },

  slideHeadline: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(26px, 3.5vw, 42px)',
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1.2,
    marginBottom: '12px',
    textShadow: '2px 2px 0px rgba(0,0,0,0.4)',
  },

  slideSub: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.88)',
    marginBottom: '24px',
    lineHeight: 1.5,
    maxWidth: '380px',
    textShadow: '1px 1px 0px rgba(0,0,0,0.4)',
  },

  socialRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '16px',
    justifyContent: 'center',
  },

  socialBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '8px 16px',
    background: 'var(--color-muted)',
    color: 'var(--color-text-2)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    textDecoration: 'none',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-card)',
    transition: 'background var(--transition-base), color var(--transition-base), transform var(--transition-base), box-shadow var(--transition-base)',
    whiteSpace: 'nowrap',
  },

  carouselControls: {
    position: 'absolute',
    bottom: '24px',
    left: '36px',
    right: '36px',
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  arrowBtn: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-wobbly-sm)',
    border: '2px solid rgba(255,255,255,0.5)',
    background: 'rgba(255,255,255,0.15)',
    color: '#ffffff',
    fontSize: '20px',
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    transition: 'background var(--transition-base)',
    fontFamily: 'inherit',
    flexShrink: 0,
  },

  dots: {
    display: 'flex',
    gap: '6px',
    flex: 1,
    justifyContent: 'center',
  },

  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.7)',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
    transition: 'background var(--transition-base), transform var(--transition-base)',
  },

  dotActive: {
    background: '#ffffff',
    transform: 'scale(1.3)',
  },

  // ── Right login panel ────────────────────────────────────
  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 32px',
    background: 'var(--color-surface)',
    overflowY: 'auto',
  },

  card: {
    width: '100%',
    maxWidth: '340px',
    background: 'var(--color-surface)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    boxShadow: 'var(--shadow-elevated)',
    padding: '36px 32px',
    transform: 'rotate(1deg)',
    animation: 'slideUp 0.4s ease',
  },

  logo: {
    width: '48px',
    height: '48px',
    objectFit: 'contain',
    marginBottom: '12px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    padding: '4px',
    background: 'var(--color-surface)',
    boxShadow: 'var(--shadow-card)',
  },

  brand: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--color-accent)',
    marginBottom: '6px',
  },

  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--font-size-display)',
    fontWeight: 700,
    marginBottom: '6px',
    color: 'var(--color-text)',
  },

  sub: {
    fontSize: '14px',
    color: 'var(--color-text-2)',
    marginBottom: '24px',
  },

  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '12px', fontWeight: 600, color: 'var(--color-text-2)', letterSpacing: '0.03em' },

  input: {
    padding: '9px 12px',
    minHeight: '44px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'border-color var(--transition-base)',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
  },

  errorBox: {
    padding: '10px 12px',
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    border: '2px solid var(--color-danger)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: '13px',
  },

  btn: {
    marginTop: '4px',
    padding: '12px',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-card)',
    transition: 'background var(--transition-base), color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base)',
    width: '100%',
  },

  btnHover: {
    background: 'var(--color-accent)',
    color: 'white',
    boxShadow: 'var(--shadow-hover)',
    transform: 'translate(2px, 2px)',
  },

  btnActive: {
    background: 'var(--color-accent)',
    color: 'white',
    boxShadow: 'var(--shadow-pressed)',
    transform: 'translate(4px, 4px)',
  },

  btnLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },

  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(45,45,45,0.3)',
    borderTopColor: 'var(--color-text)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },

  note: {
    marginTop: '20px',
    fontSize: '12px',
    color: 'var(--color-text-3)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
}
