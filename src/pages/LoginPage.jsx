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
  const [btnState, setBtnState] = useState('idle') // idle | hover | active
  const [focusedInput, setFocusedInput] = useState(null)

  useEffect(() => {
    if (user) navigate('/')
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

  const btnStyle = {
    ...styles.btn,
    ...(btnState === 'hover' && !loading ? styles.btnHover : {}),
    ...(btnState === 'active' && !loading ? styles.btnActive : {}),
    ...(loading ? styles.btnLoading : {}),
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
    padding: '24px',
  },
  card: {
    background: 'var(--color-surface)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    boxShadow: 'var(--shadow-elevated)',
    padding: '36px 32px',
    width: '100%',
    maxWidth: '360px',
    transform: 'rotate(1deg)',
  },
  brand: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--color-accent)',
    marginBottom: '20px',
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
  label: { fontSize: '12px', fontWeight: 600, color: 'var(--color-text-2)' },
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
  },
}
