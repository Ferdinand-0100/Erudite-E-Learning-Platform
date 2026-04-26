import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const SESSION_TOKEN_KEY = 'erudite_session_token'
const SESSION_CHECK_INTERVAL = 30_000 // check every 30 seconds

function generateToken() {
  return crypto.randomUUID()
}

function getLocalToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY)
}

function setLocalToken(token) {
  localStorage.setItem(SESSION_TOKEN_KEY, token)
}

function clearLocalToken() {
  localStorage.removeItem(SESSION_TOKEN_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [kickedOut, setKickedOut] = useState(false)
  const intervalRef = useRef(null)

  async function fetchProfile(userId, email) {
    const { data } = await supabase
      .from('profiles')
      .select('role, is_active, session_token')
      .eq('id', userId)
      .single()
    if (data?.is_active === false) {
      await supabase.auth.signOut()
      return
    }
    const role = resolveRole(data, email)
    setProfile(data ? { ...data, role } : { role })
    return data
  }

  function resolveRole(profileData, email) {
    if (profileData?.role) return profileData.role
    if (email?.endsWith('@admin.com')) return 'admin'
    return 'student'
  }

  // Write a new session token to DB and localStorage
  async function registerSession(userId, email) {
    const role = resolveRole(null, email)
    // Admins are exempt from single-device enforcement
    if (role === 'admin') return

    const token = generateToken()
    setLocalToken(token)
    await supabase
      .from('profiles')
      .update({ session_token: token })
      .eq('id', userId)
  }

  // Verify the local token still matches the DB token
  async function verifySession(userId, email) {
    const role = resolveRole(profile, email)
    if (role === 'admin') return // admins exempt

    const localToken = getLocalToken()
    if (!localToken) {
      // No local token — force sign out
      await handleKickOut()
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('session_token, is_active')
      .eq('id', userId)
      .single()

    if (!data || data.is_active === false || data.session_token !== localToken) {
      await handleKickOut()
    }
  }

  async function handleKickOut() {
    clearLocalToken()
    setKickedOut(true)
    clearInterval(intervalRef.current)
    await supabase.auth.signOut()
  }

  function startSessionPolling(userId, email) {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      verifySession(userId, email)
    }, SESSION_CHECK_INTERVAL)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id, session.user.email)
        const role = resolveRole(profileData, session.user.email)
        if (role !== 'admin') {
          // Verify existing session token on page load
          await verifySession(session.user.id, session.user.email)
          startSessionPolling(session.user.id, session.user.email)
        }
        setLoading(false)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setKickedOut(false)
        setUser(session.user)
        setLoading(true)
        const profileData = await fetchProfile(session.user.id, session.user.email)
        const role = resolveRole(profileData, session.user.email)
        if (role !== 'admin') {
          await registerSession(session.user.id, session.user.email)
          startSessionPolling(session.user.id, session.user.email)
        }
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        clearInterval(intervalRef.current)
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearInterval(intervalRef.current)
    }
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    clearLocalToken()
    clearInterval(intervalRef.current)
    // Clear session token in DB so the slot is freed
    if (user?.id) {
      await supabase.from('profiles').update({ session_token: null }).eq('id', user.id)
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, kickedOut, signIn, signOut, verifySession: () => user?.id ? verifySession(user.id, user.email) : Promise.resolve() }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
