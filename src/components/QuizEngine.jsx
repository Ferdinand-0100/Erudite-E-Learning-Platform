import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Trophy, ThumbsUp, BookOpen, HelpCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { recordEvent } from '../lib/progressService'
import FillBlankEngine from './FillBlankEngine'
import FilterBar from './FilterBar'
import { useAppState } from '../lib/AppStateContext'

// ── Package picker ────────────────────────────────────────────────────────────

function PackagePicker({ courseKey, onSelect }) {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter state — persisted per courseKey
  const [search, setSearch, clearSearch] = useAppState(`quiz-search-${courseKey}`, '')
  const [activeDifficulties, setActiveDifficulties, clearDiffs] = useAppState(`quiz-diffs-${courseKey}`, [])
  const [activeTags, setActiveTags, clearTags] = useAppState(`quiz-tags-${courseKey}`, [])

  useEffect(() => {
    supabase
      .from('quiz_packages')
      .select('*, quiz_questions(count)')
      .eq('course_key', courseKey)
      .order('sort_order')
      .then(({ data }) => {
        setPackages((data || []).map(p => ({ ...p, question_count: p.quiz_questions?.[0]?.count ?? 0 })))
        setLoading(false)
      })
  }, [courseKey])

  const availableTags = [...new Set(packages.flatMap(p => p.tags || []))].sort()

  const filtered = packages.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
    if (activeDifficulties.length > 0 && !activeDifficulties.includes(p.difficulty)) return false
    if (activeTags.length > 0 && !activeTags.every(t => (p.tags || []).includes(t))) return false
    return true
  })

  const difficultyColors = {
    Beginner:     { bg: '#dcfce7', color: '#166534' },
    Intermediate: { bg: '#fef3c7', color: '#92400e' },
    Advanced:     { bg: '#fee2e2', color: '#991b1b' },
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
      </div>
    )
  }

  if (packages.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--color-surface)', border: '3px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-md)', boxShadow: 'var(--shadow-card)' }}>
        <HelpCircle size={32} style={{ color: 'var(--color-text-3)', marginBottom: 10 }} />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No quiz packages yet</p>
        <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Quiz packages for this section haven't been added yet.</p>
      </div>
    )
  }

  return (
    <div>
      <FilterBar
        search={search}
        onSearchChange={v => setSearch(v)}
        activeDifficulties={activeDifficulties}
        onDifficultyToggle={d => {
          setActiveDifficulties(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
        }}
        availableTags={availableTags}
        activeTags={activeTags}
        onTagToggle={t => {
          setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
        }}
        onClear={() => { clearSearch(); clearDiffs(); clearTags() }}
        placeholder="Search quiz packages…"
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {filtered.map(pkg => {
          const dc = difficultyColors[pkg.difficulty] || difficultyColors.Beginner
          return (
            <div
              key={pkg.id}
              onClick={() => onSelect(pkg)}
              style={{
                background: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-wobbly-md)',
                padding: 18,
                cursor: 'pointer',
                transition: 'transform var(--transition-slow), box-shadow var(--transition-slow)',
                boxShadow: 'var(--shadow-card)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-elevated)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, flex: 1, marginRight: 8 }}>{pkg.title}</div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', background: dc.bg, color: dc.color, flexShrink: 0 }}>{pkg.difficulty}</span>
              </div>
              {pkg.description && <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 10, lineHeight: 1.5 }}>{pkg.description}</p>}
              {(pkg.tags || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {pkg.tags.map(t => <span key={t} style={{ fontSize: 11, padding: '2px 7px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', background: 'var(--color-muted)', color: 'var(--color-text-2)' }}>{t}</span>)}
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{pkg.question_count} question{pkg.question_count !== 1 ? 's' : ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Quiz runner ───────────────────────────────────────────────────────────────

function QuizRunner({ pkg, courseKey, onBack }) {  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [hoveredOption, setHoveredOption] = useState(null)

  const storageKey = `quiz-progress-${courseKey}-${pkg.id}`

  function loadProgress() { try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null') } catch { return null } }
  function saveProgress(state) { try { sessionStorage.setItem(storageKey, JSON.stringify(state)) } catch {} }
  function clearProgress() { try { sessionStorage.removeItem(storageKey) } catch {} }

  useEffect(() => {
    const saved = loadProgress()
    supabase
      .from('quiz_questions')
      .select('*')
      .eq('package_id', pkg.id)
      .order('sort_order')
      .then(({ data }) => {
        setQuestions(data || [])
        if (saved) {
          setCurrent(saved.current ?? 0)
          setSelected(saved.selected ?? null)
          setScore(saved.score ?? 0)
          setFinished(saved.finished ?? false)
        }
        setLoading(false)
      })
  }, [pkg.id])

  function handleSelect(idx) {
    if (selected !== null) return
    const isCorrect = idx === questions[current].correct_answer_index
    const newScore = isCorrect ? score + 1 : score
    setSelected(idx)
    if (isCorrect) setScore(newScore)
    saveProgress({ current, selected: idx, score: newScore, finished })
    supabase.from('quiz_attempts').insert({ student_id: user.id, question_id: questions[current].id, chosen_index: idx })
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setFinished(true)
      saveProgress({ current, selected, score, finished: true })
      recordEvent(supabase, user.id, courseKey, 'quiz_completed', `Quiz: ${pkg.title}`)
    } else {
      const next = current + 1
      setCurrent(next)
      setSelected(null)
      setHoveredOption(null)
      saveProgress({ current: next, selected: null, score, finished: false })
    }
  }

  function restart() {
    clearProgress()
    setCurrent(0); setSelected(null); setScore(0); setFinished(false); setHoveredOption(null)
  }

  if (loading) {
    return (
      <div style={styles.card}>
        <div className="skeleton" style={{ height: 16, width: 80, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 6, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 24, marginBottom: 20 }} />
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 10 }} />)}
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div>
        {onBack && <button onClick={onBack} style={{ ...styles.backBtn, marginBottom: 16 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-muted)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}><ArrowLeft size={14} style={{ marginRight: 6 }} />Back to packages</button>}
        <div style={{ ...styles.card, ...styles.emptyCard }}>
          <HelpCircle size={32} style={{ color: 'var(--color-text-3)', marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No questions yet</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>This package has no questions yet.</p>
        </div>
      </div>
    )
  }

  const q = questions[current]
  const pct = ((current + 1) / questions.length) * 100
  const letters = ['A', 'B', 'C', 'D']

  if (finished) {
    const isPerfect = score === questions.length
    const isGood = score > questions.length / 2
    const ResultIcon = isPerfect ? Trophy : isGood ? ThumbsUp : BookOpen
    const resultColor = isPerfect ? 'var(--color-accent)' : isGood ? '#166534' : 'var(--color-text-2)'
    return (
      <div>
        {onBack && <button onClick={onBack} style={{ ...styles.backBtn, marginBottom: 16 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-muted)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}><ArrowLeft size={14} style={{ marginRight: 6 }} />Back to packages</button>}
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <ResultIcon size={48} style={{ color: resultColor, marginBottom: 14 }} />
            <div style={styles.resultTitle}>Quiz complete!</div>
            <div style={styles.resultScore}>
              You scored <strong style={{ color: resultColor }}>{score}</strong> out of <strong>{questions.length}</strong>
            </div>
            {isPerfect && <p style={{ fontSize: 13, color: 'var(--color-accent)', marginTop: 6, fontWeight: 500 }}>Perfect score! Outstanding work 🎉</p>}
          </div>
          <button
            style={styles.btn}
            onClick={restart}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.transform = 'translate(2px, 2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = '' }}
          >Try again</button>
        </div>
      </div>
    )
  }

  // FITB question
  if (q.question_type === 'fitb') {
    return (
      <div>
        {onBack && <button onClick={onBack} style={{ ...styles.backBtn, marginBottom: 16 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-muted)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}><ArrowLeft size={14} style={{ marginRight: 6 }} />Back to packages</button>}
        <FillBlankEngine
          question={q}
          current={current}
          total={questions.length}
          score={score}
          onComplete={(isCorrect) => {
            if (isCorrect) setScore(s => s + 1)
            setTimeout(() => {
              if (current + 1 >= questions.length) {
                setFinished(true)
                recordEvent(supabase, user.id, courseKey, 'quiz_completed', `Quiz: ${pkg.title}`)
              } else {
                setCurrent(c => c + 1)
                setSelected(null)
                setHoveredOption(null)
              }
            }, 1800)
          }}
        />
      </div>
    )
  }

  return (
    <div>
      {onBack && <button onClick={onBack} style={{ ...styles.backBtn, marginBottom: 16 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-muted)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}><ArrowLeft size={14} style={{ marginRight: 6 }} />Back to packages</button>}
      <div style={styles.card}>
        <div style={styles.progressHeader}>
          <span style={styles.progressText}>Question {current + 1} of {questions.length}</span>
          <span style={styles.scoreText}>{score} correct</span>
        </div>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${pct}%` }} />
        </div>
        <p style={styles.question}>{q.question}</p>
        <div style={styles.options}>
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correct_answer_index
            const isSelected = i === selected
            const isHovered = hoveredOption === i && selected === null
            let optStyle = { ...styles.option }
            let letterStyle = { ...styles.letter }
            if (selected !== null) {
              if (isCorrect) { optStyle = { ...optStyle, ...styles.optionCorrect }; letterStyle = { ...letterStyle, ...styles.letterCorrect } }
              else if (isSelected) { optStyle = { ...optStyle, ...styles.optionWrong }; letterStyle = { ...letterStyle, ...styles.letterWrong } }
            } else if (isHovered) { optStyle = { ...optStyle, ...styles.optionHover } }
            return (
              <div key={i} style={optStyle} onClick={() => handleSelect(i)} onMouseEnter={() => selected === null && setHoveredOption(i)} onMouseLeave={() => setHoveredOption(null)}>
                <span style={letterStyle}>{letters[i]}</span>
                <span style={{ flex: 1 }}>{opt}</span>
                {selected !== null && isCorrect && <CheckCircle size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />}
                {selected !== null && isSelected && !isCorrect && <XCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>
        {selected !== null && (
          <button
            style={styles.btnNext}
            onClick={handleNext}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.transform = 'translate(2px, 2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = '' }}
          >
            {current + 1 < questions.length ? 'Next question →' : 'See results →'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function QuizEngine({ courseKey, forcePkg = null }) {
  const [selectedPkg, setSelectedPkg] = useState(forcePkg)

  if (selectedPkg) {
    return <QuizRunner pkg={selectedPkg} courseKey={courseKey || selectedPkg.course_key} onBack={forcePkg ? null : () => setSelectedPkg(null)} />
  }

  return <PackagePicker courseKey={courseKey} onSelect={setSelectedPkg} />
}

const styles = {
  backBtn: {
    display: 'inline-flex', alignItems: 'center', padding: '6px 14px',
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-2)',
    fontFamily: 'var(--font-body)', transition: 'background var(--transition-base)',
  },
  card: {
    background: 'var(--color-surface)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-md)',
    padding: 28,
    maxWidth: 580,
    boxShadow: 'var(--shadow-elevated)',
  },
  emptyCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 28px' },
  progressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressText: { fontSize: 12, color: 'var(--color-text-3)', fontWeight: 500 },
  scoreText: { fontSize: 12, color: 'var(--color-accent)', fontWeight: 600 },
  progressBar: {
    height: 10,
    background: 'var(--color-muted)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--color-accent)',
    borderRadius: 'var(--radius-wobbly-sm)',
    transition: 'width var(--transition-progress)',
  },
  question: { fontSize: 16, fontWeight: 600, lineHeight: 1.6, marginBottom: 20, color: 'var(--color-text)' },
  options: { display: 'flex', flexDirection: 'column', gap: 10 },
  option: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
    border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)',
    cursor: 'pointer', transition: 'all var(--transition-base)',
    background: 'var(--color-surface)', color: 'var(--color-text)',
  },
  optionHover: { background: 'var(--color-muted)' },
  optionCorrect: { border: '2px solid var(--color-success)', background: 'var(--color-success-bg)', color: 'var(--color-success)' },
  optionWrong: { border: '2px solid var(--color-danger)', background: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
  letter: {
    width: 26, height: 26,
    borderRadius: 'var(--radius-wobbly-sm)',
    border: '2px solid var(--color-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
    transition: 'all var(--transition-fast)',
    background: 'var(--color-surface)',
  },
  letterCorrect: { background: 'var(--color-success)', borderColor: 'var(--color-success)', color: 'white' },
  letterWrong: { background: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: 'white' },
  btnNext: {
    marginTop: 20, padding: '12px 20px',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    border: '3px solid var(--color-border)', borderRadius: 'var(--radius-wobbly)',
    cursor: 'pointer', fontWeight: 600, fontSize: 14,
    boxShadow: 'var(--shadow-card)',
    transition: 'background var(--transition-base), color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base)',
    width: '100%', fontFamily: 'var(--font-body)',
  },
  btn: {
    marginTop: 8, padding: '12px 20px',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    border: '3px solid var(--color-border)', borderRadius: 'var(--radius-wobbly)',
    cursor: 'pointer', fontWeight: 600, fontSize: 14,
    boxShadow: 'var(--shadow-card)',
    transition: 'background var(--transition-base), color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base)',
    width: '100%', fontFamily: 'var(--font-body)',
  },
  resultTitle: { fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, marginBottom: 8 },
  resultScore: { fontSize: 15, color: 'var(--color-text-2)', marginBottom: 4 },
}
