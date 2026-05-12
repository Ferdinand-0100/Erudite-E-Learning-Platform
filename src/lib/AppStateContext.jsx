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

import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react'

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
  // Tracks the defaultValue registered for each key, so clear() can reset properly.
  const defaults = useRef({})
  // Subscribers: key → Set of setState functions
  const subscribers = useRef({})

  const get = useCallback((key, defaultValue) => {
    // Always record the latest default so clear() knows what to reset to
    defaults.current[key] = defaultValue
    if (key in cache.current) return cache.current[key]
    const stored = readStorage(key)
    const value = stored !== undefined ? stored : defaultValue
    cache.current[key] = value
    return value
  }, [])

  const set = useCallback((key, valueOrUpdater) => {
    // Use SENTINEL to distinguish "not in cache" from a legitimate stored undefined/null.
    // This prevents functional updaters from receiving undefined when the key was just cleared.
    const current = key in cache.current ? cache.current[key] : defaults.current[key]
    const next = typeof valueOrUpdater === 'function'
      ? valueOrUpdater(current)
      : valueOrUpdater
    cache.current[key] = next
    writeStorage(key, next)
    // Notify all subscribers for this key
    subscribers.current[key]?.forEach(fn => fn(next))
  }, [])

  const clear = useCallback((key) => {
    // Reset to default rather than deleting — keeps the cache entry valid so
    // functional updaters in set() always receive a well-typed value.
    const def = defaults.current[key]
    cache.current[key] = def
    deleteStorage(key)
    subscribers.current[key]?.forEach(fn => fn(def))
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

  // Keep a stable ref to defaultValue so the effect below doesn't re-run on every render
  const defaultRef = useRef(defaultValue)
  defaultRef.current = defaultValue

  // Subscribe to store updates. This is the ONLY path that updates localValue,
  // which avoids the double-update bug from calling setLocalValue both here and
  // inside setValue.
  useEffect(() => {
    // Sync in case the store changed while this component was unmounted
    setLocalValue(get(key, defaultRef.current))

    const unsub = subscribe(key, (next) => {
      setLocalValue(next)
    })
    return unsub
  }, [key, get, subscribe])

  const setValue = useCallback((valueOrUpdater) => {
    // set() updates the cache, writes to sessionStorage, and notifies subscribers.
    // The subscriber above is what actually updates localValue — single code path.
    set(key, valueOrUpdater)
  }, [key, set])

  const clearValue = useCallback(() => {
    clear(key)
  }, [key, clear])

  return [localValue, setValue, clearValue]
}
