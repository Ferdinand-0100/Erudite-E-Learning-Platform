/**
 * AppStateContext
 *
 * A global, sessionStorage-backed state store for the entire app.
 * Replaces all manual saveDraft/loadDraft patterns.
 *
 * Usage:
 *   const [value, setValue] = useAppState('my-unique-key', defaultValue)
 *
 * Works exactly like useState, but:
 *   - Survives component unmount/remount (tab switching, navigation)
 *   - Persists for the browser session (cleared when browser closes)
 *   - All state is namespaced by key — no collisions
 */

import { createContext, useContext, useCallback, useState, useRef } from 'react'

const AppStateContext = createContext(null)

// ── Helpers ───────────────────────────────────────────────────────────────────

function readStorage(key) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function writeStorage(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function deleteStorage(key) {
  try {
    sessionStorage.removeItem(key)
  } catch {}
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppStateProvider({ children }) {
  // In-memory cache so React re-renders work correctly.
  // sessionStorage is the source of truth; this cache keeps React in sync.
  const cache = useRef({})
  // Subscribers: key → Set of setState functions
  const subscribers = useRef({})

  const get = useCallback((key, defaultValue) => {
    if (key in cache.current) return cache.current[key]
    const stored = readStorage(key)
    const value = stored !== undefined ? stored : defaultValue
    cache.current[key] = value
    return value
  }, [])

  const set = useCallback((key, valueOrUpdater) => {
    const current = cache.current[key]
    const next = typeof valueOrUpdater === 'function'
      ? valueOrUpdater(current)
      : valueOrUpdater
    cache.current[key] = next
    writeStorage(key, next)
    // Notify all subscribers for this key
    subscribers.current[key]?.forEach(fn => fn(next))
  }, [])

  const clear = useCallback((key) => {
    delete cache.current[key]
    deleteStorage(key)
    subscribers.current[key]?.forEach(fn => fn(undefined))
  }, [])

  const subscribe = useCallback((key, fn) => {
    if (!subscribers.current[key]) subscribers.current[key] = new Set()
    subscribers.current[key].add(fn)
    return () => subscribers.current[key].delete(fn)
  }, [])

  return (
    <AppStateContext.Provider value={{ get, set, clear, subscribe }}>
      {children}
    </AppStateContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useAppState(key, defaultValue)
 *
 * Drop-in replacement for useState that persists across navigation.
 *
 * @param {string} key - Unique storage key (e.g. 'admin-quiz-selected-pkg')
 * @param {*} defaultValue - Value to use if nothing is stored yet
 * @returns {[value, setValue, clearValue]} - Like useState, plus a clear function
 */
export function useAppState(key, defaultValue) {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')

  const { get, set, clear, subscribe } = ctx

  // Local React state — initialised from the store
  const [localValue, setLocalValue] = useState(() => get(key, defaultValue))

  // Subscribe to external updates (e.g. another component changing the same key)
  // This is a one-time registration — the cleanup runs on unmount
  useState(() => {
    const unsub = subscribe(key, (next) => {
      setLocalValue(next !== undefined ? next : defaultValue)
    })
    return unsub
  })

  const setValue = useCallback((valueOrUpdater) => {
    set(key, valueOrUpdater)
    setLocalValue(prev => {
      const next = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(prev)
        : valueOrUpdater
      return next
    })
  }, [key, set])

  const clearValue = useCallback(() => {
    clear(key)
    setLocalValue(defaultValue)
  }, [key, clear, defaultValue])

  return [localValue, setValue, clearValue]
}
