import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function LoginPage() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [btnHovered, setBtnHovered] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

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

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.card}>
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
                borderColor: focusedInput === 'email' ? 'var(--color-accent)' : undefined,
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
                borderColor: focusedInput === 'password' ? 'var(--color-accent)' : undefined,
              }}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, background: btnHovered ? 'var(--color-accent-hover)' : 'var(--color-accent)' }}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
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
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    padding: '24px',
  },
  card: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-elevated)',
    borderRadius: 'var(--radius-lg)',
    padding: '36px 32px',
    width: '100%',
    maxWidth: '360px',
  },
  brand: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--color-accent)',
    marginBottom: '20px',
  },
  heading: {
    fontSize: 'var(--font-size-display)',
    fontWeight: 600,
    letterSpacing: '-0.4px',
    marginBottom: '6px',
  },
  sub: {
    fontSize: '14px',
    color: 'var(--color-text-2)',
    marginBottom: '24px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '12px', fontWeight: 500, color: 'var(--color-text-2)' },
  input: {
    padding: '9px 12px',
    minHeight: '44px',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255,255,255,0.6)',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  errorBox: {
    padding: '10px 12px',
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
  },
  btn: {
    marginTop: '4px',
    padding: '10px',
    background: 'var(--color-accent)',
    color: 'var(--color-accent-fg)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 500,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background var(--transition-base)',
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  note: {
    marginTop: '20px',
    fontSize: '12px',
    color: 'var(--color-text-3)',
    textAlign: 'center',
  },
}
