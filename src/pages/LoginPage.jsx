import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { X, ChevronDown } from 'lucide-react'

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
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {slides.map((slide, i) => {
        let relative = i - current
        if (relative > n / 2) relative -= n
        if (relative < -n / 2) relative += n
        if (Math.abs(relative) > 2) return null
        const isActive = relative === 0
        const isFar = Math.abs(relative) === 2
        const slotX = { [-2]: -1000, [-1]: -300, 0: 0, 1: 300, 2: 1000 }
        return (
          <div
            key={i}
            onClick={() => !isActive && onGo(i)}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: isActive ? 480 : 120,
              height: isActive ? '100%' : '76%',
              transform: `translate(calc(-50% + ${slotX[relative] ?? 0}px), -50%) scale(${isActive ? 1 : isFar ? 0.8 : 0.9})`,
              transition: 'transform 0.5s ease, width 0.5s ease, height 0.5s ease, opacity 0.5s ease',
              zIndex: isActive ? 10 : 10 - Math.abs(relative),
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              border: '3px solid var(--color-border)',
              boxShadow: isActive ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
              opacity: isActive ? 1 : isFar ? 0 : 0.45,
              pointerEvents: isFar ? 'none' : 'auto',
              filter: isActive ? 'none' : 'brightness(0.75) saturate(0.8)',
              cursor: isActive ? 'default' : 'pointer',
              overflow: 'hidden',
            }}
          >
            {isActive && (
              <>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,20,20,0.92) 0%, rgba(20,20,20,0.55) 38%, rgba(20,20,20,0.04) 65%, transparent 100%)', zIndex: 10 }} />
                <div style={{ position: 'absolute', bottom: 28, left: 28, right: 28, zIndex: 11 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(16px, 2.4vw, 26px)', fontWeight: 700, color: '#ffffff', lineHeight: 1.25, marginBottom: 7 }}>
                    {slide.headline.split('\n').map((line, idx) => (
                      <span key={idx}>{line}{idx < slide.headline.split('\n').length - 1 && <br />}</span>
                    ))}
                  </h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.55, margin: 0, fontFamily: 'var(--font-body)' }}>{slide.sub}</p>
                </div>
              </>
            )}
          </div>
        )
      })}
      <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 20 }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => onGo(i)} aria-label={`Slide ${i + 1}`}
            style={{ width: i === current ? 22 : 7, height: 7, borderRadius: 999, border: '2px solid var(--color-border)', background: i === current ? 'var(--color-accent)' : 'var(--color-surface)', cursor: 'pointer', padding: 0, transition: 'width 0.3s ease, background 0.3s ease' }} />
        ))}
      </div>
    </div>
  )
}

// ── Login Modal ────────────────────────────────────────────────────────────────
function LoginModal({ onClose }) {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState(null)
  const [btnState, setBtnState] = useState('idle')
  const firstInputRef           = useRef(null)

  useEffect(() => {
    firstInputRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try { await signIn(email, password); navigate('/') }
    catch (err) { setError(err.message || 'Invalid email or password.') }
    finally { setLoading(false) }
  }

  const btnStyle = {
    width: '100%', padding: '12px 20px',
    fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    background: btnState === 'idle' ? 'var(--color-surface)' : 'var(--color-accent)',
    color: btnState === 'idle' ? 'var(--color-text)' : '#ffffff',
    boxShadow: btnState === 'idle' ? 'var(--shadow-card)' : btnState === 'hover' ? 'var(--shadow-hover)' : 'var(--shadow-pressed)',
    transform: btnState === 'hover' ? 'translate(2px,2px)' : btnState === 'active' ? 'translate(4px,4px)' : 'none',
    transition: 'all var(--transition-base)',
    opacity: loading ? 0.7 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }

  const inputStyle = (field) => ({
    width: '100%', padding: '10px 14px',
    fontFamily: 'var(--font-body)', fontSize: 15,
    background: 'var(--color-surface)',
    border: `2px solid ${focused === field ? 'var(--color-secondary)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-wobbly-sm)', color: 'var(--color-text)', outline: 'none',
    boxShadow: focused === field ? '0 0 0 3px rgba(45,93,161,0.12)' : 'none',
    transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
  })

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(253,251,247,0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'backdropIn 0.18s ease' }}
      aria-modal="true" role="dialog" aria-label="Sign in">
      <div onClick={e => e.stopPropagation()}
        style={{ position: 'relative', background: 'var(--color-surface)', border: '3px solid var(--color-border)', borderRadius: 'var(--radius-wobbly)', boxShadow: 'var(--shadow-elevated)', padding: '40px 36px 32px', width: '100%', maxWidth: 380, animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div aria-hidden style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%) rotate(-1.5deg)', width: 80, height: 22, background: 'rgba(229,224,216,0.7)', border: '1.5px solid rgba(45,45,45,0.2)', borderRadius: '3px 2px 4px 2px', zIndex: 1 }} />
        <button onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', background: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-2)', boxShadow: 'var(--shadow-card)', transition: 'all var(--transition-base)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-muted)'; e.currentTarget.style.transform = 'translate(2px,2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.transform = 'none' }}>
          <X size={14} strokeWidth={2.5} />
        </button>
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
            <div style={{ padding: '9px 12px', background: 'var(--color-danger-bg)', border: '2px solid var(--color-danger)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: 13, color: 'var(--color-danger)', fontFamily: 'var(--font-body)' }}>{error}</div>
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

// ── Section Label Tag (reusable) ───────────────────────────────────────────────
function SectionTag({ children, rotate = '-1.2deg', bg = '#f5f0d0' }) {
  return (
    <div style={{
      position: 'absolute', top: -18, left: '50%',
      transform: `translateX(-50%) rotate(${rotate})`,
      background: bg, border: '2px solid var(--color-border)',
      borderRadius: 'var(--radius-wobbly-sm)',
      padding: '4px 20px', fontSize: 13, fontWeight: 700,
      fontFamily: 'var(--font-heading)', color: 'var(--color-text)',
      whiteSpace: 'nowrap', boxShadow: 'var(--shadow-card)', letterSpacing: '0.02em',
    }}>{children}</div>
  )
}

// ── Section Wrapper (reusable) ─────────────────────────────────────────────────
function SectionCard({ children, dotted = true, style = {} }) {
  return (
    <div style={{
      position: 'relative',
      background: 'var(--color-surface)',
      border: '2.5px solid var(--color-border)',
      borderRadius: 'var(--radius-wobbly)',
      boxShadow: 'var(--shadow-card)',
      padding: '48px 52px 44px',
      ...(dotted ? { backgroundImage: 'radial-gradient(var(--color-muted) 1px, transparent 1px)', backgroundSize: '20px 20px' } : {}),
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Features Section ───────────────────────────────────────────────────────────
const FEATURES = [
  { emoji: '', title: 'AI Essay Grader', desc: 'Get instant band-score feedback on your Writing Task 1 & 2, plus line-by-line suggestions to fix grammar and coherence.' },
  { emoji: '', title: 'Structured Courses', desc: 'Every track follows a clear syllabus — from foundation vocabulary to full mock tests — so you always know what to study next.' },
  { emoji: '', title: 'Expert Teachers', desc: 'All instructors are certified and experienced with IELTS & PTE. Live Q&A sessions and direct feedback included.' },
  { emoji: '', title: 'Progress Dashboard', desc: "Track videos watched, quiz scores, and essay history in one place. See exactly how far you've come week by week." },
  { emoji: '', title: 'Personalised Study Guides', desc: 'Your teacher assigns materials tailored to your weak points — no wasted time on things you already know.' },
  { emoji: '', title: 'Learn Anywhere', desc: 'Full mobile support. Study on the bus, during lunch, or from your desk — your progress syncs automatically.' },
]

function FeaturesSection() {
  return (
    <SectionCard>
      <SectionTag rotate="-1deg" bg="#e8f4fd">Why Choose Us</SectionTag>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.25, marginBottom: 8, marginTop: 8 }}>
        Everything you need to <span style={{ color: 'var(--color-accent)' }}>hit your target score.</span>
      </h2>
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-text-2)', marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
        We built Erudite around the tools and support that actually move the needle — not just video lectures.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
        {FEATURES.map((f, i) => (
          <FeatureCard key={i} {...f} />
        ))}
      </div>
    </SectionCard>
  )
}

function FeatureCard({ emoji, title, desc }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--color-accent)' : 'var(--color-bg)',
        border: '2.5px solid var(--color-border)',
        borderRadius: 'var(--radius-wobbly-sm)',
        padding: '20px 22px',
        boxShadow: hovered ? 'var(--shadow-hover)' : '3px 3px 0px var(--color-border)',
        transform: hovered ? 'translate(2px,2px)' : 'none',
        transition: 'all var(--transition-base)',
        cursor: 'default',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: hovered ? '#ffffff' : 'var(--color-text)', marginBottom: 7, transition: 'color var(--transition-base)' }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: hovered ? 'rgba(255,255,255,0.85)' : 'var(--color-text-2)', lineHeight: 1.6, transition: 'color var(--transition-base)' }}>{desc}</div>
    </div>
  )
}

// ── Courses / Pricing Section ──────────────────────────────────────────────────
const COURSES = [
  {
    track: 'IELTS Academic',
    tag: 'Most Popular',
    tagColor: 'var(--color-accent)',
    emoji: '',
    desc: 'Full preparation for IELTS Academic — Reading, Writing, Listening & Speaking, with AI essay feedback and weekly mock tests.',
    features: ['4 complete skill modules', 'AI Writing Task 1 & 2 grader', 'Weekly mock test + debrief', 'Speaking practice sessions', 'Personalised study guide'],
    cta: 'Inquire on WhatsApp',
  },
  {
    track: 'PTE Academic',
    tag: 'Fast Track',
    tagColor: '#7c5cbf',
    emoji: '',
    desc: 'Master the computer-based PTE format with timed drills, pattern recognition techniques, and instant AI scoring.',
    features: ['All 20 PTE task types covered', 'Timed practice mode', 'AI scoring for Write Essay & Summarise', 'Score predictor dashboard', 'Teacher-reviewed practice sets'],
    cta: 'Inquire on WhatsApp',
  },
  {
    track: 'General English',
    tag: 'For Everyone',
    tagColor: '#2d9e6b',
    emoji: '',
    desc: 'Conversational and written English for everyday use — ideal for work, study, or personal growth at any level.',
    features: ['Beginner → Advanced tracks', 'Grammar & vocabulary modules', 'Weekly conversation sessions', 'Writing feedback from teachers', 'Flexible scheduling'],
    cta: 'Inquire on WhatsApp',
  },
  {
    track: 'Mandarin',
    tag: 'New Course',
    tagColor: '#c0392b',
    emoji: '',
    desc: 'Learn Mandarin from scratch with certified instructors. HSK-aligned curriculum with speaking, reading, and character writing.',
    features: ['HSK 1–4 syllabus', 'Tonal pronunciation drills', 'Character writing practice', 'Cultural context lessons', 'Small group classes'],
    cta: 'Inquire on WhatsApp',
  },
]

function CoursesSection() {
  return (
    <SectionCard>
      <SectionTag rotate="1deg" bg="#fde8f0">Courses</SectionTag>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.25, marginBottom: 8, marginTop: 8 }}>
        Pick your <span style={{ color: 'var(--color-secondary)' }}>track.</span> We'll handle the rest.
      </h2>
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-text-2)', marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
        All courses include access to the platform, study materials, and teacher support. Pricing is shared on WhatsApp after a quick needs assessment.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 18 }}>
        {COURSES.map((c, i) => (
          <CourseCard key={i} course={c} />
        ))}
      </div>
    </SectionCard>
  )
}

function CourseCard({ course }) {
  const [btnState, setBtnState] = useState('idle')
  return (
    <div style={{ background: 'var(--color-bg)', border: '2.5px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: '24px 22px 20px', boxShadow: '3px 3px 0px var(--color-border)', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Tag */}
      <div style={{ display: 'inline-block', alignSelf: 'flex-start', background: course.tagColor, color: '#fff', border: '1.5px solid var(--color-border)', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', marginBottom: 12, letterSpacing: '0.03em' }}>{course.tag}</div>
      <div style={{ fontSize: 30, marginBottom: 8 }}>{course.emoji}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>{course.track}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: 16 }}>{course.desc}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {course.features.map((f, i) => (
          <li key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-2)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
          </li>
        ))}
      </ul>
      <a
        href={`https://wa.me/${WA_NUMBER}?text=Hi! I'm interested in the ${course.track} course.`}
        target="_blank" rel="noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '10px 16px', marginTop: 'auto',
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
          border: '2.5px solid var(--color-border)',
          borderRadius: 'var(--radius-wobbly)',
          background: btnState === 'idle' ? 'var(--color-surface)' : '#25D366',
          color: btnState === 'idle' ? 'var(--color-text)' : '#ffffff',
          boxShadow: btnState === 'idle' ? 'var(--shadow-card)' : 'var(--shadow-hover)',
          transform: btnState !== 'idle' ? 'translate(2px,2px)' : 'none',
          transition: 'all var(--transition-base)', textDecoration: 'none',
        }}
        onMouseEnter={() => setBtnState('hover')}
        onMouseLeave={() => setBtnState('idle')}
        onMouseDown={() => setBtnState('active')}
        onMouseUp={() => setBtnState('hover')}
      >
        <WhatsAppIcon size={14} /> {course.cta}
      </a>
    </div>
  )
}

// ── Testimonials Section ───────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Ferdinand', track: 'IELTS Academic', score: 'Band 7.5', avatar: '', quote: 'The AI essay grader was a game-changer. I could practice at midnight and still get detailed feedback. My Writing score jumped from 6.0 to 7.5 in six weeks.' },
  { name: 'Schubert', track: 'PTE Academic', score: '79 Overall', avatar: '', quote: 'The timed drills for Repeat Sentence and Describe Image are really well-designed. I felt completely prepared on exam day — no surprises.' },
  { name: 'William', track: 'Mandarin', score: 'HSK 2 Passed', avatar: '', quote: 'I tried apps before but nothing stuck. Having a real teacher who corrects my tones and a structured schedule made all the difference.' },
  { name: 'Ferbanana', track: 'General English', score: 'B2 Level', avatar: '', quote: 'My English for work meetings improved dramatically. The weekly conversation sessions built my confidence faster than I expected.' },
]

function TestimonialsSection() {
  return (
    <SectionCard dotted={false} style={{ background: 'var(--color-surface-2, var(--color-bg))' }}>
      <SectionTag rotate="-0.8deg" bg="#e8fdf0">Student Stories</SectionTag>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.25, marginBottom: 8, marginTop: 8 }}>
        Real students. <span style={{ color: 'var(--color-accent)' }}>Real results.</span>
      </h2>
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-text-2)', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
        Don't take our word for it — here's what our students say after completing their courses.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
        {TESTIMONIALS.map((t, i) => (
          <TestimonialCard key={i} {...t} rotate={['-1.2deg','0.8deg','-0.5deg','1.1deg'][i % 4]} />
        ))}
      </div>
    </SectionCard>
  )
}

function TestimonialCard({ name, track, score, avatar, quote, rotate }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '2.5px solid var(--color-border)',
      borderRadius: 'var(--radius-wobbly-sm)',
      padding: '22px 20px 18px',
      boxShadow: '3px 3px 0px var(--color-border)',
      transform: `rotate(${rotate})`,
      transition: 'transform var(--transition-base)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'rotate(0deg) translate(-2px,-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = `rotate(${rotate})`}
    >
      {/* tape strip */}
      <div aria-hidden style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(-1deg)', width: 56, height: 18, background: 'rgba(229,224,216,0.75)', border: '1.5px solid rgba(45,45,45,0.18)', borderRadius: '3px 2px 3px 2px' }} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>"{quote}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1.5px dashed var(--color-border)', paddingTop: 12 }}>
        <div style={{ fontSize: 26 }}>{avatar}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{name}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-2)' }}>{track}</div>
        </div>
        <div style={{ marginLeft: 'auto', background: 'var(--color-accent)', color: '#fff', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', border: '1.5px solid var(--color-border)', whiteSpace: 'nowrap' }}>{score}</div>
      </div>
    </div>
  )
}

// ── Gallery Section ────────────────────────────────────────────────────────────
// Add or remove images here — captions are optional
const GALLERY_IMAGES = [
  { src: '/images/HeroBackground.jpeg', caption: 'Our community space' },
  { src: '/images/Carousel0.jpeg',      caption: 'Storytelling competition' },
  { src: '/images/Carousel1.jpeg',      caption: 'Competition in session' },
  { src: '/images/Carousel2.jpeg',      caption: 'Judges' },
  { src: '/images/Carousel3.jpeg',      caption: 'Registration' },
  { src: '/images/Carousel4.jpeg',      caption: 'Erudite English Tournament Cup' },
]

function GallerySection() {
  const [lightbox, setLightbox] = useState(null) // index of open image

  return (
    <>
      <SectionCard>
        <SectionTag rotate="-0.8deg" bg="#fde8f0">Gallery</SectionTag>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.25, marginBottom: 8, marginTop: 8 }}>
          Life at <span style={{ color: 'var(--color-accent)' }}>Erudite English.</span>
        </h2>
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-text-2)', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
          A glimpse into our classes, students, and the environment where learning happens every day.
        </p>

        {/* Masonry-style grid — first image spans 2 rows to break the uniformity */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'auto',
          gap: 12,
        }}>
          {GALLERY_IMAGES.map((img, i) => (
            <GalleryThumb
              key={i}
              img={img}
              featured={i === 0}
              onClick={() => setLightbox(i)}
            />
          ))}
        </div>
      </SectionCard>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(10,10,10,0.88)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'backdropIn 0.18s ease',
          }}
          role="dialog" aria-modal="true" aria-label="Image preview"
        >
          {/* Prev / Next */}
          {[
            { label: '←', delta: -1, side: { left: 16 } },
            { label: '→', delta:  1, side: { right: 16 } },
          ].map(({ label, delta, side }) => (
            <button
              key={label}
              onClick={e => { e.stopPropagation(); setLightbox((lightbox + delta + GALLERY_IMAGES.length) % GALLERY_IMAGES.length) }}
              aria-label={delta === -1 ? 'Previous image' : 'Next image'}
              style={{
                position: 'fixed', top: '50%', ...side,
                transform: 'translateY(-50%)',
                width: 44, height: 44,
                background: 'var(--color-surface)',
                border: '2.5px solid var(--color-border)',
                borderRadius: 'var(--radius-wobbly-sm)',
                cursor: 'pointer', zIndex: 2001,
                fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700,
                color: 'var(--color-text)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >{label}</button>
          ))}

          {/* Image */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 860, width: '100%', animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            <img
              src={GALLERY_IMAGES[lightbox].src}
              alt={GALLERY_IMAGES[lightbox].caption}
              style={{
                width: '100%', maxHeight: '80vh',
                objectFit: 'contain',
                border: '3px solid var(--color-border)',
                borderRadius: 'var(--radius-wobbly)',
                boxShadow: 'var(--shadow-elevated)',
                display: 'block',
              }}
            />
            {GALLERY_IMAGES[lightbox].caption && (
              <div style={{
                textAlign: 'center', marginTop: 12,
                fontFamily: 'var(--font-body)', fontSize: 13,
                color: 'rgba(255,255,255,0.7)',
              }}>
                {GALLERY_IMAGES[lightbox].caption}
                <span style={{ marginLeft: 12, opacity: 0.45 }}>{lightbox + 1} / {GALLERY_IMAGES.length}</span>
              </div>
            )}
          </div>

          {/* Close hint */}
          <div style={{ position: 'fixed', top: 16, right: 20, fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Click anywhere to close
          </div>
        </div>
      )}
    </>
  )
}

function GalleryThumb({ img, featured, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        gridColumn: featured ? 'span 2' : 'span 1',
        gridRow:    featured ? 'span 2' : 'span 1',
        position: 'relative',
        overflow: 'hidden',
        border: '2.5px solid var(--color-border)',
        borderRadius: 'var(--radius-wobbly-sm)',
        boxShadow: hovered ? 'var(--shadow-hover)' : '3px 3px 0 var(--color-border)',
        cursor: 'pointer',
        aspectRatio: featured ? 'auto' : '4/3',
        minHeight: featured ? 320 : 'auto',
        transform: hovered ? 'translate(-2px,-2px)' : 'none',
        transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
      }}
    >
      <img
        src={img.src}
        alt={img.caption}
        loading="lazy"
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          display: 'block',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 0.4s ease',
        }}
      />
      {/* Caption overlay on hover */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(20,20,20,0.72) 0%, transparent 50%)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity var(--transition-base)',
        display: 'flex', alignItems: 'flex-end',
        padding: '14px 14px',
      }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
          color: '#ffffff',
        }}>{img.caption}</span>
      </div>
    </div>
  )
}

// ── FAQ Section ────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Do I need to attend classes at a fixed time?', a: 'Most content — videos, quizzes, and study guides — is fully self-paced. Live sessions like speaking practice and Q&A are scheduled in advance, but recordings are available if you can\'t make it live.' },
  { q: 'How does the AI essay grader work?', a: 'You submit your essay through the platform and receive instant feedback on Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range. It also highlights specific sentences with improvement suggestions.' },
  { q: 'How do I enrol?', a: 'Just message us on WhatsApp or Instagram. We\'ll do a quick needs assessment, match you to the right course level, and send you login details once you\'re registered.' },
  { q: 'Can I take more than one course at the same time?', a: 'Yes — many students combine IELTS preparation with General English to build vocabulary and fluency alongside their test-specific skills.' },
  { q: 'What score improvements can I expect?', a: 'Results vary by starting level and study intensity, but students who engage consistently — completing weekly modules and essay submissions — typically see 0.5–1.5 band improvement within 6–10 weeks.' },
  { q: 'Is the platform available on mobile?', a: 'Yes, the platform is fully responsive and works on any modern smartphone browser. A dedicated app is in development.' },
]

function FAQSection() {
  const [open, setOpen] = useState(null)
  return (
    <SectionCard>
      <SectionTag rotate="0.9deg" bg="#fdf5e8">FAQ</SectionTag>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.25, marginBottom: 8, marginTop: 8 }}>
        Questions? <span style={{ color: 'var(--color-secondary)' }}>We've got answers.</span>
      </h2>
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-text-2)', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
        Still not sure? Drop us a message on WhatsApp and we'll reply within the hour.
      </p>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FAQS.map((item, i) => (
          <FAQItem key={i} {...item} isOpen={open === i} onToggle={() => setOpen(open === i ? null : i)} />
        ))}
      </div>
    </SectionCard>
  )
}

function FAQItem({ q, a, isOpen, onToggle }) {
  return (
    <div style={{
      background: 'var(--color-bg)',
      border: `2px solid ${isOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-wobbly-sm)',
      boxShadow: isOpen ? 'var(--shadow-hover)' : '2px 2px 0px var(--color-border)',
      overflow: 'hidden',
      transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
    }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: isOpen ? 'var(--color-accent)' : 'var(--color-text)', textAlign: 'left', transition: 'color var(--transition-base)' }}>{q}</span>
        <ChevronDown size={16} style={{ flexShrink: 0, color: 'var(--color-text-2)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }} />
      </button>
      {isOpen && (
        <div style={{ padding: '0 18px 16px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.7, borderTop: '1.5px dashed var(--color-border)' }}>
          <div style={{ paddingTop: 12 }}>{a}</div>
        </div>
      )}
    </div>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer({ onSignIn }) {
  const [waState, setWaState] = useState('idle')
  const [igState, setIgState] = useState('idle')

  const mkBtn = (state, hoverColor) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px',
    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    cursor: 'pointer', textDecoration: 'none',
    background: state === 'idle' ? 'var(--color-surface)' : hoverColor,
    color: state === 'idle' ? 'var(--color-text)' : '#ffffff',
    boxShadow: state === 'idle' ? 'var(--shadow-card)' : 'var(--shadow-hover)',
    transform: state !== 'idle' ? 'translate(2px,2px)' : 'none',
    transition: 'all var(--transition-base)',
  })

  return (
    <footer style={{ background: 'var(--color-surface)', borderTop: '2.5px solid var(--color-border)', marginTop: 72 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 28px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 36 }}>

        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <img src="/images/Logo.png" alt="Erudite" style={{ width: 34, height: 34, objectFit: 'contain', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 3, boxShadow: 'var(--shadow-card)' }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: 'var(--color-text)' }}>Erudite English</span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.65, margin: 0 }}>
            Expert-led language courses in Medan — IELTS, PTE, General English, and Mandarin, with AI-powered tools built in.
          </p>
        </div>

        {/* Courses */}
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12, letterSpacing: '0.02em' }}>Courses</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['IELTS Academic', 'PTE Academic', 'PTE Core', 'General English', 'Mandarin', 'Computer'].map(name => (
              <li key={name}>
                <a href={`https://wa.me/${WA_NUMBER}?text=I'm interested in ${name}`} target="_blank" rel="noreferrer"
                  style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none', transition: 'color var(--transition-base)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-2)'}
                >{name}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12, letterSpacing: '0.02em' }}>Contact Us</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.65, marginBottom: 14 }}>
            We reply within the hour on WhatsApp. Come say hello!
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer"
              style={mkBtn(waState, '#25D366')}
              onMouseEnter={() => setWaState('hover')} onMouseLeave={() => setWaState('idle')}
              onMouseDown={() => setWaState('active')} onMouseUp={() => setWaState('hover')}>
              <WhatsAppIcon size={13} /> WhatsApp
            </a>
            <a href={IG_URL} target="_blank" rel="noreferrer"
              style={mkBtn(igState, '#E1306C')}
              onMouseEnter={() => setIgState('hover')} onMouseLeave={() => setIgState('idle')}
              onMouseDown={() => setIgState('active')} onMouseUp={() => setIgState('hover')}>
              <InstagramIcon size={13} /> Instagram
            </a>
          </div>
        </div>

        {/* Student Login */}
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12, letterSpacing: '0.02em' }}>For Students</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.65, marginBottom: 14 }}>
            Already enrolled? Sign in to access your courses, essays, and progress dashboard.
          </p>
          <button onClick={onSignIn}
            style={{ ...mkBtn('idle', 'var(--color-accent)'), border: '2px solid var(--color-border)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translate(2px,2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.transform = 'none' }}>
            Sign In →
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1.5px dashed var(--color-border)', maxWidth: 1200, margin: '0 auto', padding: '16px 28px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-3)' }}>© {new Date().getFullYear()} Erudite English — Medan, Indonesia</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-3)' }}>Built with care for our students ✦</span>
      </div>
    </footer>
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

  const mkBtn = (state, hoverColor = 'var(--color-accent)') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 18px',
    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
    border: '2.5px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
    background: state === 'idle' ? 'var(--color-surface)' : hoverColor,
    color: state === 'idle' ? 'var(--color-text)' : '#ffffff',
    boxShadow: state === 'idle' ? 'var(--shadow-card)' : state === 'hover' ? 'var(--shadow-hover)' : 'var(--shadow-pressed)',
    transform: state === 'hover' ? 'translate(2px,2px)' : state === 'active' ? 'translate(4px,4px)' : 'none',
    transition: 'all var(--transition-base)',
  })

  const sectionGap = { maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 28px 72px' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>
      <style>{`
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes fadeUp     { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes backdropIn { from { opacity:0; } to { opacity:1; } }
        @keyframes modalIn    { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes wiggle     { 0%,100%{transform:rotate(-1deg)} 50%{transform:rotate(1deg)} }
        * { box-sizing: border-box; }

        @media (max-width: 860px) {
          .lp-hero     { flex-direction: column !important; gap: 32px !important; }
          .lp-herotext { max-width: 100% !important; }
          .lp-carousel { width: 100% !important; height: 300px !important; }
          .lp-navlinks { display: none !important; }
          .lp-h1       { font-size: clamp(32px,8vw,52px) !important; }
          .lp-sectioncard { padding: 36px 20px 32px !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--color-bg)', borderBottom: '2.5px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/images/Logo.png" alt="Erudite" style={{ width: 36, height: 36, objectFit: 'contain', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 3, boxShadow: 'var(--shadow-card)' }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 19, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Erudite English</span>
          </div>
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
            <button onClick={() => setShowLogin(true)}
              style={mkBtn(sigState, 'var(--color-accent)')}
              onMouseEnter={() => setSigState('hover')} onMouseLeave={() => setSigState('idle')}
              onMouseDown={() => setSigState('active')} onMouseUp={() => setSigState('hover')}>
              Sign In →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '60px 28px 48px' }}>
        <div className="lp-hero" style={{ display: 'flex', alignItems: 'flex-start', gap: 56 }}>
          <div className="lp-herotext" style={{ flex: '0 0 420px', maxWidth: 420, animation: 'fadeUp 0.5s ease both' }}>
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
          <div
            className="lp-carousel"
            style={{
              flex: 1,
              minWidth: 0,
              height: 420,
              animation: 'fadeUp 0.6s 0.08s ease both',
              position: 'relative',
            }}
          >
            {/* Map embed — Place mode keeps the focus on our pin only */}
            <div
              style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                border: '3px solid var(--color-border)',
                borderRadius: 4,
                boxShadow: 'var(--shadow-elevated)',
                background: 'var(--color-surface)',
              }}
            >
              <iframe
                title="Erudite English Location"
                src="https://maps.google.com/maps?q=Erudite+English+Jl.+Suasa+No.3K+Medan&t=m&z=17&output=embed&iwloc=near"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Location Card */}
            <div
              style={{
                position: 'absolute',
                left: 16,
                bottom: 16,
                background: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-wobbly-sm)',
                padding: '10px 14px',
                boxShadow: 'var(--shadow-elevated)',
                maxWidth: 290,
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <img src="/images/Logo.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain', border: '1.5px solid var(--color-border)', borderRadius: 4, padding: 2, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Erudite English</span>
              </div>
              <a
                href="https://maps.app.goo.gl/byKLErUfEH6ok9PK7"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 2,
                  color: 'var(--color-accent)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* ── ABOUT US ── */}
      <section style={sectionGap}>
        <SectionCard>
          <SectionTag>About Us</SectionTag>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.25, marginBottom: 32, marginTop: 8 }}>
            We help students unlock their potential<br />
            <span style={{ color: 'var(--color-accent)' }}>one lesson at a time.</span>
          </h2>
          <div style={{ maxWidth: 780, margin: '0 auto', fontSize: 16, color: 'var(--color-text-2)', lineHeight: 1.75, fontFamily: 'var(--font-body)' }}>
            <p style={{ marginBottom: 20 }}>
              <span style={{ float: 'left', fontFamily: 'var(--font-heading)', fontSize: 56, fontWeight: 700, lineHeight: 0.8, marginRight: 10, marginTop: 6, color: 'var(--color-secondary)' }}>Erudite English</span>
              was founded with a single belief: that language learning should be personal, structured, and genuinely enjoyable. Based in Medan, we work with students preparing for IELTS, PTE Academic, and General English — combining expert-led instruction with modern tools like AI essay scoring and personalised study guides, while also offering courses like Mandarin and Computer.
            </p>
            <p>Our platform is built for real students with real goals. Whether you're aiming for a band 7.5, preparing for a university abroad, or simply sharpening your everyday English, we meet you where you are and help you get where you want to go.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 40 }}>
            {[
              { value: '100+', label: 'Students Taught' },
              { value: '3',    label: 'Course Tracks' },
              { value: 'AI',   label: 'Essay Feedback' },
              { value: '100%', label: 'Online & Flexible' },
            ].map((stat, i) => (
              <div key={i} style={{ background: 'var(--color-surface)', border: '2.5px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: '14px 28px', textAlign: 'center', boxShadow: '3px 3px 0px var(--color-border)', minWidth: 120 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* ── FEATURES ── */}
      <section style={sectionGap}>
        <FeaturesSection />
      </section>

      {/* ── COURSES ── */}
      <section style={sectionGap}>
        <CoursesSection />
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={sectionGap}>
        <TestimonialsSection />
      </section>

      {/* ── GALLERY ── */}
      <section style={sectionGap}>
        <GallerySection />
      </section>

      {/* ── FAQ ── */}
      <section style={sectionGap}>
        <FAQSection />
      </section>

      {/* ── FOOTER ── */}
      <Footer onSignIn={() => setShowLogin(true)} />

      {/* ── LOGIN MODAL ── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  )
}