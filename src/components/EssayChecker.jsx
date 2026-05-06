import { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCircle, TrendingUp, BookOpen, MessageSquare, Lightbulb, ChevronDown, ChevronUp, Clock, ImagePlus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { recordEvent } from '../lib/progressService'
import { useAppState } from '../lib/AppStateContext'

// Essay type display labels (mirrors admin options)
const ESSAY_TYPE_LABELS = {
  general:              'General English',
  ielts_task1_academic: 'IELTS Task 1 — Academic',
  ielts_task1_general:  'IELTS Task 1 — General',
  ielts_task2:          'IELTS Task 2',
  pte_summarize:        'PTE — Summarize Written Text',
  pte_essay:            'PTE — Write Essay',
}

const DAILY_LIMIT_DEFAULT = 3

// ── Timer helpers ─────────────────────────────────────────────────────────────

function timerStorageKey(promptId) { return `essay-timer-start-${promptId}` }

function getStoredStart(promptId) {
  try { return parseInt(sessionStorage.getItem(timerStorageKey(promptId)) || '0', 10) || null }
  catch { return null }
}

function setStoredStart(promptId, ts) {
  try { sessionStorage.setItem(timerStorageKey(promptId), String(ts)) } catch {}
}

function clearStoredStart(promptId) {
  try { sessionStorage.removeItem(timerStorageKey(promptId)) } catch {}
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function EssayChecker({ courseKey }) {
  const { user } = useAuth()
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState(null)
  const [showCorrections, setShowCorrections] = useState(false)
  const [pastSubmissions, setPastSubmissions] = useState([])

  // Daily usage tracking: { [promptId]: count }
  const [usageToday, setUsageToday] = useState({})
  const [dailyLimit, setDailyLimit] = useState(DAILY_LIMIT_DEFAULT)

  // Per-prompt essay drafts — keyed by prompt ID
  const [essayDrafts, setEssayDrafts, clearEssayDrafts] = useAppState(`essay-drafts-${courseKey}`, {})
  const [selectedPromptId, setSelectedPromptId] = useAppState(`essay-selected-prompt-${courseKey}`, null)

  function getEssayDraft(promptId) { return essayDrafts[promptId] ?? '' }
  function saveEssayDraft(promptId, text) { setEssayDrafts(prev => ({ ...prev, [promptId]: text })) }
  function clearEssayDraft(promptId) { setEssayDrafts(prev => { const n = { ...prev }; delete n[promptId]; return n }) }

  const [essay, setEssay] = useState('')

  // ── Image upload (IELTS Task 1 Academic only) ────────────────────────────
  const [imageBase64, setImageBase64] = useState(null)
  const [imageMimeType, setImageMimeType] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const imageInputRef = useRef(null)

  const isAcademic = selectedPrompt?.essay_type === 'ielts_task1_academic'

  function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      // dataUrl = "data:image/jpeg;base64,/9j/..."
      const [meta, b64] = dataUrl.split(',')
      const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      setImageBase64(b64)
      setImageMimeType(mime)
      setImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
    // reset input so same file can be re-selected
    e.target.value = ''
  }

  function clearImage() {
    setImageBase64(null)
    setImageMimeType(null)
    setImagePreview(null)
  }

  // Clear image when switching away from academic prompt
  useEffect(() => {
    if (!isAcademic) clearImage()
  }, [selectedPrompt?.id])

  // ── Timer state ─────────────────────────────────────────────────────────────
  const [timerStarted, setTimerStarted] = useState(false)  // has the clock started?
  const [secondsLeft, setSecondsLeft] = useState(null)     // null = not running
  const [timeExpired, setTimeExpired] = useState(false)
  const timerRef = useRef(null)
  const autoSubmitRef = useRef(false) // prevent double-submit on expiry

  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length

  // ── Start / restore timer ───────────────────────────────────────────────────
  const startTimer = useCallback((prompt, startTs = Date.now()) => {
    if (!prompt?.time_limit_minutes) return
    const totalSeconds = prompt.time_limit_minutes * 60
    setStoredStart(prompt.id, startTs)
    setTimerStarted(true)

    function tick() {
      const elapsed = Math.floor((Date.now() - startTs) / 1000)
      const remaining = totalSeconds - elapsed
      if (remaining <= 0) {
        setSecondsLeft(0)
        setTimeExpired(true)
        clearInterval(timerRef.current)
      } else {
        setSecondsLeft(remaining)
      }
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
  }, [])

  // Clear timer interval on unmount or prompt change
  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [selectedPrompt?.id])

  // Restore timer from sessionStorage when prompt loads
  useEffect(() => {
    if (!selectedPrompt?.time_limit_minutes) {
      setTimerStarted(false)
      setSecondsLeft(null)
      setTimeExpired(false)
      clearInterval(timerRef.current)
      return
    }
    const stored = getStoredStart(selectedPrompt.id)
    if (stored) {
      const elapsed = Math.floor((Date.now() - stored) / 1000)
      const totalSeconds = selectedPrompt.time_limit_minutes * 60
      if (elapsed >= totalSeconds) {
        // Already expired
        setTimerStarted(true)
        setSecondsLeft(0)
        setTimeExpired(true)
      } else {
        startTimer(selectedPrompt, stored)
      }
    } else {
      setTimerStarted(false)
      setSecondsLeft(null)
      setTimeExpired(false)
    }
  }, [selectedPrompt?.id])

  // Auto-submit when time expires
  useEffect(() => {
    if (timeExpired && essay.trim() && !autoSubmitRef.current && !checking) {
      autoSubmitRef.current = true
      handleCheck(true)
    }
  }, [timeExpired])

  useEffect(() => {
    supabase
      .from('essay_prompts')
      .select('*')
      .eq('course_key', courseKey)
      .order('sort_order')
      .then(({ data }) => {
        const list = data || []
        setPrompts(list)
        if (list.length > 0) {
          const initial = list.find(p => p.id === selectedPromptId) ?? list[0]
          setSelectedPrompt(initial)
          setEssay(getEssayDraft(initial.id))
        }
        setLoading(false)
      })
  }, [courseKey])

  // Fetch today's submission counts for all prompts in this course
  useEffect(() => {
    if (!user?.id || prompts.length === 0) return
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const promptIds = prompts.map(p => p.id)

    supabase
      .from('essay_submissions')
      .select('prompt_id')
      .eq('student_id', user.id)
      .in('prompt_id', promptIds)
      .gte('submitted_at', startOfDay.toISOString())
      .then(({ data }) => {
        const counts = {}
        for (const row of data || []) {
          counts[row.prompt_id] = (counts[row.prompt_id] ?? 0) + 1
        }
        setUsageToday(counts)
      })
  }, [user?.id, prompts])

  useEffect(() => {
    if (!selectedPrompt || !user?.id) return
    supabase
      .from('essay_submissions')
      .select('*')
      .eq('prompt_id', selectedPrompt.id)
      .eq('student_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setPastSubmissions(data || []))
  }, [selectedPrompt, user?.id])

  function handlePromptSelect(p) {
    clearInterval(timerRef.current)
    setSelectedPromptId(p.id)
    setSelectedPrompt(p)
    setFeedback(null)
    setError(null)
    autoSubmitRef.current = false
    setEssay(getEssayDraft(p.id))
  }

  // Start the timer on first keystroke if the prompt has a time limit
  function handleEssayChange(e) {
    const val = e.target.value
    setEssay(val)
    if (selectedPrompt) saveEssayDraft(selectedPrompt.id, val)
    if (selectedPrompt?.time_limit_minutes && !timerStarted && !timeExpired) {
      startTimer(selectedPrompt)
    }
  }

  async function handleCheck(isAutoSubmit = false) {
    if (!essay.trim() || !selectedPrompt) return
    setChecking(true)
    setError(null)
    setFeedback(null)

    const { data, error: fnErr } = await supabase.functions.invoke('check-essay', {
      body: {
        essay,
        prompt: selectedPrompt.prompt,
        minWords: selectedPrompt.min_words,
        maxWords: selectedPrompt.max_words,
        promptId: selectedPrompt.id,
        essayType: selectedPrompt.essay_type ?? 'general',
        ...(imageBase64 ? { imageBase64, imageMimeType } : {}),
      }
    })

    if (fnErr || data?.error) {
      setError(fnErr?.message || data?.error)
      setChecking(false)
      return
    }

    if (data.dailyLimit) setDailyLimit(data.dailyLimit)

    setFeedback(data.feedback)
    clearEssayDraft(selectedPrompt.id)
    clearStoredStart(selectedPrompt.id)
    clearInterval(timerRef.current)
    clearImage()

    setUsageToday(prev => ({
      ...prev,
      [selectedPrompt.id]: (prev[selectedPrompt.id] ?? 0) + 1,
    }))

    await supabase.from('essay_submissions').insert({
      prompt_id: selectedPrompt.id,
      student_id: user.id,
      essay_text: essay,
      feedback: data.feedback,
    })
    await recordEvent(supabase, user.id, courseKey, 'essay_submitted', selectedPrompt.title)

    setChecking(false)
  }

  const submissionsToday = selectedPrompt ? (usageToday[selectedPrompt.id] ?? 0) : 0
  const limitReached = submissionsToday >= dailyLimit
  const hasTimeLimit = !!selectedPrompt?.time_limit_minutes
  const timerColor = secondsLeft !== null && secondsLeft <= 60
    ? 'var(--color-danger)'
    : secondsLeft !== null && secondsLeft <= 180
    ? '#d97706'
    : 'var(--color-text-2)'

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 80 }} />
        ))}
      </div>
    )
  }

  if (prompts.length === 0) {
    return (
      <div style={{ ...styles.card, textAlign: 'center', padding: '48px 28px' }}>
        <BookOpen size={32} style={{ color: 'var(--color-text-3)', marginBottom: 10 }} />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No essay prompts yet</p>
        <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Essay prompts for this section haven't been added yet.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>

      {/* Prompt selector */}
      {prompts.length > 1 && (
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Select a prompt</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prompts.map(p => (
              <div
                key={p.id}
                onClick={() => handlePromptSelect(p)}
                style={{
                  ...styles.promptOption,
                  ...(selectedPrompt?.id === p.id ? styles.promptOptionActive : {}),
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>
                  {p.min_words}–{p.max_words} words
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active prompt */}
      {selectedPrompt && (
        <div style={styles.promptCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={styles.sectionLabel}>Essay prompt</div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', background: 'var(--color-surface)', color: 'var(--color-secondary)', marginBottom: 10 }}>
              {ESSAY_TYPE_LABELS[selectedPrompt.essay_type ?? 'general'] ?? selectedPrompt.essay_type}
            </span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-text)', fontWeight: 500 }}>
            {selectedPrompt.prompt}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
              {selectedPrompt.min_words}–{selectedPrompt.max_words} words required
            </span>
            {hasTimeLimit && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--color-secondary)', background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: '2px 8px' }}>
                <Clock size={11} />
                {selectedPrompt.time_limit_minutes} min time limit
              </span>
            )}
          </div>
        </div>
      )}

      {/* Image upload — IELTS Task 1 Academic only */}
      {isAcademic && (
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Chart / graph / diagram</div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          {imagePreview ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={imagePreview}
                alt="Uploaded chart"
                style={{
                  maxWidth: '100%',
                  maxHeight: 320,
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-wobbly-sm)',
                  boxShadow: 'var(--shadow-card)',
                  display: 'block',
                }}
              />
              <button
                onClick={clearImage}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 26, height: 26,
                  border: '2px solid var(--color-border)',
                  borderRadius: '50%',
                  background: 'var(--color-surface)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--shadow-hover)',
                }}
                title="Remove image"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => imageInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px',
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-wobbly-sm)',
                background: 'var(--color-muted)',
                color: 'var(--color-text-2)',
                cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                fontFamily: 'var(--font-body)',
                transition: 'background var(--transition-base)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-muted)' }}
            >
              <ImagePlus size={16} />
              Upload chart, graph, or diagram
            </button>
          )}
          <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 8 }}>
            Optional — upload the visual data so the AI can verify your description against it.
          </p>
        </div>
      )}

      {/* Essay input */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.sectionLabel}>Your essay</div>
            {/* Timer display */}
            {hasTimeLimit && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 13, fontWeight: 700, color: timerColor,
                border: `2px solid ${timerColor}`,
                borderRadius: 'var(--radius-wobbly-sm)',
                padding: '2px 10px',
                transition: 'color var(--transition-base), border-color var(--transition-base)',
                background: timeExpired ? 'var(--color-danger-bg)' : secondsLeft !== null && secondsLeft <= 60 ? 'var(--color-danger-bg)' : 'var(--color-surface)',
              }}>
                <Clock size={12} />
                {timeExpired
                  ? 'Time\'s up!'
                  : secondsLeft !== null
                  ? formatTime(secondsLeft)
                  : `${selectedPrompt.time_limit_minutes}:00`}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Daily usage indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {Array.from({ length: dailyLimit }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: '2px solid var(--color-border)',
                    background: i < submissionsToday ? 'var(--color-accent)' : 'var(--color-muted)',
                    transition: 'background var(--transition-base)',
                  }}
                />
              ))}
              <span style={{ fontSize: 11, color: 'var(--color-text-3)', marginLeft: 4 }}>
                {submissionsToday}/{dailyLimit} today
              </span>
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: selectedPrompt && wordCount < selectedPrompt.min_words
                ? 'var(--color-danger)'
                : selectedPrompt && wordCount > selectedPrompt.max_words
                ? 'var(--color-danger)'
                : 'var(--color-success)',
            }}>
              {wordCount} words
            </div>
          </div>
        </div>

        {/* Timer not-started hint */}
        {hasTimeLimit && !timerStarted && !timeExpired && (
          <div style={{ marginBottom: 10, padding: '8px 12px', background: 'var(--color-surface-2)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: 12, color: 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={13} style={{ flexShrink: 0 }} />
            Timer starts when you begin typing. You'll have {selectedPrompt.time_limit_minutes} minutes.
          </div>
        )}

        <textarea
          value={essay}
          onChange={handleEssayChange}
          placeholder="Write your essay here..."
          style={{
            ...styles.textarea,
            ...(timeExpired ? { opacity: 0.6, pointerEvents: 'none' } : {}),
          }}
          rows={12}
          disabled={timeExpired}
        />
        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}
        {limitReached ? (
          <div style={styles.limitBox}>
            You've used all {dailyLimit} submission{dailyLimit !== 1 ? 's' : ''} for this prompt today. Come back tomorrow!
          </div>
        ) : timeExpired && checking ? (
          <div style={{ ...styles.limitBox, background: 'var(--color-danger-bg)', border: '2px solid var(--color-danger)', color: 'var(--color-danger)' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={styles.spinner} /> Time's up — submitting your essay…
            </span>
          </div>
        ) : timeExpired ? (
          <div style={{ ...styles.limitBox, background: 'var(--color-danger-bg)', border: '2px solid var(--color-danger)', color: 'var(--color-danger)' }}>
            Time's up! Your essay was submitted automatically.
          </div>
        ) : (
          <button
            onClick={() => handleCheck(false)}
            disabled={checking || !essay.trim() || (selectedPrompt && wordCount < selectedPrompt.min_words)}
            style={{
              ...styles.checkBtn,
              opacity: (checking || !essay.trim() || (selectedPrompt && wordCount < selectedPrompt.min_words)) ? 0.5 : 1,
              cursor: (checking || !essay.trim() || (selectedPrompt && wordCount < selectedPrompt.min_words)) ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.transform = 'translate(2px, 2px)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = '' }}
          >
            {checking ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={styles.spinner} /> Analysing your essay…
              </span>
            ) : `Check my essay (${dailyLimit - submissionsToday} left today)`}
          </button>
        )}
        {!limitReached && !timeExpired && selectedPrompt && wordCount < selectedPrompt.min_words && essay.trim() && (
          <p style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 6 }}>
            {selectedPrompt.min_words - wordCount} more words needed
          </p>
        )}
      </div>

      {/* Feedback */}
      {feedback && <FeedbackPanel feedback={feedback} showCorrections={showCorrections} setShowCorrections={setShowCorrections} essayType={selectedPrompt?.essay_type} />}

      {/* Past submissions */}
      {pastSubmissions.length > 0 && !feedback && (
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Previous attempts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pastSubmissions.map((sub, i) => (
              <div key={sub.id} style={styles.pastItem} onClick={() => setFeedback(sub.feedback)}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  Attempt {pastSubmissions.length - i} — Score: {sub.feedback?.overall_score}/10
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
                  {new Date(sub.submitted_at).toLocaleDateString()} · {sub.feedback?.band_estimate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ScoreBar({ score }) {
  const pct = (score / 10) * 100
  const color = score >= 7 ? '#16a34a' : score >= 5 ? '#d97706' : '#dc2626'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--color-muted)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 28 }}>{score}/10</span>
    </div>
  )
}

function FeedbackPanel({ feedback, showCorrections, setShowCorrections, essayType }) {
  const scoreColor = feedback.overall_score >= 7 ? '#16a34a' : feedback.overall_score >= 5 ? '#d97706' : '#dc2626'
  const isPTE = essayType?.startsWith('pte_')
  const estimateLabel = isPTE ? 'PTE score estimate' : essayType?.startsWith('ielts_') ? 'Band estimate' : 'Level estimate'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Overall score */}
      <div style={{ ...styles.card, background: 'var(--color-surface-2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -10, right: -10, opacity: 0.08 }}>
          <TrendingUp size={100} color="var(--color-border)" />
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Overall Score</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 52, fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1 }}>{feedback.overall_score}</span>
          <span style={{ fontSize: 18, color: 'var(--color-text-3)' }}>/10</span>
          {feedback.band_estimate && (
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-2)', marginLeft: 8 }}>
              {estimateLabel}: {feedback.band_estimate}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6, margin: 0 }}>{feedback.summary}</p>
      </div>

      {/* Category scores */}
      <div style={styles.card}>
        <div style={styles.sectionLabel}>Detailed scores</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(feedback.categories || {}).map(([key, val]) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </span>
              </div>
              <ScoreBar score={val.score} />
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 6, lineHeight: 1.6 }}>{val.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & improvements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-success)' }}>Strengths</span>
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(feedback.strengths || []).map((s, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.5 }}>{s}</li>
            ))}
          </ul>
        </div>
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Lightbulb size={16} style={{ color: '#d97706' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>Improvements</span>
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(feedback.improvements || []).map((s, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.5 }}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Corrected sentences */}
      {feedback.corrected_sentences?.length > 0 && (
        <div style={styles.card}>
          <button
            onClick={() => setShowCorrections(v => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={16} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent)' }}>
                Sentence corrections ({feedback.corrected_sentences.length})
              </span>
            </div>
            {showCorrections ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showCorrections && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {feedback.corrected_sentences.map((c, i) => (
                <div key={i} style={{ borderLeft: '3px solid var(--color-accent)', paddingLeft: 12 }}>
                  <div style={{ fontSize: 13, color: 'var(--color-danger)', textDecoration: 'line-through', marginBottom: 4 }}>{c.original}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-success)', fontWeight: 500, marginBottom: 4 }}>{c.corrected}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{c.explanation}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    padding: '20px 22px',
    boxShadow: 'var(--shadow-card)',
  },
  promptCard: {
    background: 'var(--color-surface-2)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    padding: '20px 22px',
    boxShadow: 'var(--shadow-hover)',
  },
  sectionLabel: {
    fontFamily: 'var(--font-heading)',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--color-text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
  },
  promptOption: {
    padding: '12px 14px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    background: 'var(--color-surface)',
  },
  promptOptionActive: {
    border: '2px solid var(--color-accent)',
    background: 'var(--color-surface-2)',
    boxShadow: 'var(--shadow-hover)',
    transform: 'translate(2px, 2px)',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    lineHeight: 1.7,
    resize: 'vertical',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color var(--transition-base)',
  },
  checkBtn: {
    marginTop: 12,
    padding: '12px 20px',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: 14,
    width: '100%',
    boxShadow: 'var(--shadow-card)',
    transition: 'background var(--transition-base), color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base)',
    cursor: 'pointer',
  },
  errorBox: {
    marginTop: 10,
    padding: '10px 12px',
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    border: '2px solid var(--color-danger)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: 13,
  },
  limitBox: {
    marginTop: 12,
    padding: '12px 14px',
    background: 'var(--color-surface-2)',
    color: 'var(--color-text-2)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'center',
  },
  spinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(45,45,45,0.3)',
    borderTopColor: 'var(--color-text)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  pastItem: {
    padding: '10px 12px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    cursor: 'pointer',
    transition: 'background var(--transition-base)',
    background: 'var(--color-surface)',
  },
}
