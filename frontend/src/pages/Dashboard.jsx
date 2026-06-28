import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Brain, TrendingUp, ArrowRight, BookOpen, Flame, Info, Zap, Quote, Moon, Award, ShieldAlert, LifeBuoy, Mail, Copy, Check } from 'lucide-react'

// ── Burnout Gauge ────────────────────────────────────────────────────────────
function BurnoutGauge({ score, color }) {
  const radius = 80
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - score)
  const pct = Math.round(score * 100)

  return (
    <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto' }}>
      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle
          cx="110" cy="110" r={radius} fill="none"
          stroke="var(--track-bg)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <motion.circle
          cx="110" cy="110" r={radius} fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
          transform="rotate(-90 110 110)"
          style={{ filter: `drop-shadow(0 0 8px ${color}44)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span className="glow-text" style={{ fontSize: '3rem', fontWeight: 800 }}>
          {pct}%
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '-5px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Burnout Risk
        </span>
      </div>
    </div>
  )
}

// ── Streak Badge ─────────────────────────────────────────────────────────────
function StreakBadge({ streak }) {
  if (streak < 2) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 14px',
        background: 'rgba(245,158,11,0.12)',
        border: '1px solid rgba(245,158,11,0.35)',
        borderRadius: '50px',
        fontSize: '0.82rem',
        fontWeight: 600,
        color: '#f59e0b',
      }}
    >
      <Flame size={14} />
      {streak} day streak
    </motion.div>
  )
}

// ── Calculate journaling streak from history ─────────────────────────────────
function calcStreak(entries) {
  if (!entries || entries.length === 0) return 0
  const days = new Set(
    entries.map(e => new Date(e.timestamp).toDateString())
  )
  const daysArr = [...days].map(d => new Date(d)).sort((a, b) => b - a)

  let streak = 1
  let current = daysArr[0]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Must have entry today or yesterday to have an active streak
  if (current < yesterday) return 0

  for (let i = 1; i < daysArr.length; i++) {
    const prev = new Date(current)
    prev.setDate(prev.getDate() - 1)
    if (daysArr[i].toDateString() === prev.toDateString()) {
      streak++
      current = daysArr[i]
    } else {
      break
    }
  }
  return streak
}

// ── FeatureBar ────────────────────────────────────────────────────────────────
function FeatureBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{Math.round(value * 100)}%</span>
      </div>
      <div style={{ background: 'var(--track-bg)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{ height: '100%', borderRadius: '4px', background: color }}
        />
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
const emotionAffirmations = {
  stressed: "Breathe. This feeling is temporary. You are doing enough.",
  sad: "It's okay to feel this way. Be gentle with yourself today.",
  angry: "Count to ten. Your peace is more important than this moment.",
  fatigued: "Rest is not a luxury, it is a necessity. Give yourself permission to pause.",
  positive: "Your energy is radiant! Keep nurturing this inner peace.",
  neutral: "Today is a fresh canvas. Move through it with intention.",
  default: "Every small step towards wellness is a victory. You've got this."
}

export default function Dashboard({ navigate, analysisResult }) {
  const [history, setHistory] = useState([])
  const [copied, setCopied] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const streak = calcStreak(history)

  useEffect(() => {
    const user_id = sessionStorage.getItem('username') || 'guest'
    fetch(`/api/history?user_id=${user_id}`)
      .then(r => r.json())
      .then(d => setHistory(d.entries || []))
      .catch(() => { })
  }, [])

  // ── No data state ──
  if (!analysisResult) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', paddingTop: '64px',
      }}>
        <Brain size={48} style={{ color: 'var(--text-secondary)' }} />
        <h2 style={{ color: 'var(--text-secondary)' }}>No analysis yet</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Complete a journal entry to see your dashboard</p>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate('journal')} className="btn-primary"
          style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} /> Write Journal Entry
        </motion.button>
      </div>
    )
  }

  const {
    burnout_score,
    burnout_level,
    primary_emotion,
    emotion_distribution,
    cognitive_load_score,
    fatigue_indicators,
    patterns,
    reasoning,
    recommendations,
    warning,
    inconsistency_alert
  } = analysisResult

  // Calculate Badges
  const badges = []
  if (streak >= 3) badges.push({ id: 'streak', icon: <Flame size={14} />, label: `${streak} Day Streak`, color: '#f97316' })
  if (history.length >= 3) {
    const last3 = history.slice(-3)
    const avgSleep = last3.reduce((acc, e) => acc + (e.sleep_hours || 0), 0) / 3
    if (avgSleep >= 7.5) badges.push({ id: 'sleep', icon: <Moon size={14} />, label: 'Sleep Pro', color: '#8b5cf6' })
    const avgMood = last3.reduce((acc, e) => acc + (e.mood_score || 0), 0) / 3
    if (avgMood >= 8) badges.push({ id: 'zen', icon: <Award size={14} />, label: 'Zen Master', color: '#10b981' })
  }

  const riskColor = burnout_level === 'High' ? '#ef4444'
    : burnout_level === 'Moderate' ? '#f59e0b' : '#22c55e'

  const emotionColors = {
    stressed: '#ef4444', sad: '#8b5cf6', angry: '#f97316',
    fatigued: '#eab308', positive: '#22c55e', neutral: '#3b82f6',
  }
  const emotionColor = emotionColors[primary_emotion] || 'var(--accent-purple)'

  const latestEmotion = primary_emotion || 'default'
  const affirmation = emotionAffirmations[latestEmotion] || emotionAffirmations.default

  return (
    <div style={{ minHeight: '100vh', padding: '80px 2rem 3rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* ── Header row ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
              Your <span className="glow-text">Analysis Dashboard</span>
            </h1>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {badges.map(b => (
                <motion.div
                  key={b.id}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', background: `${b.color}15`,
                    border: `1px solid ${b.color}40`, borderRadius: '20px',
                    color: b.color, fontSize: '0.75rem', fontWeight: 600
                  }}
                >
                  {b.icon} {b.label}
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Daily Affirmation Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
            style={{
              padding: '1.2rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.2rem',
              borderLeft: '4px solid var(--accent-purple)',
              background: 'rgba(139, 92, 246, 0.05)',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{
              background: 'var(--accent-purple)',
              color: 'white',
              padding: '10px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Quote size={18} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Daily Affirmation
              </p>
              <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                "{affirmation}"
              </p>
            </div>
          </motion.div>

          {/* ── Warning Banner ── */}
          <AnimatePresence>
            {warning?.active && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{
                  background: warning.severity === 'critical' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                  borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                <AlertTriangle size={20} color={warning.severity === 'critical' ? '#ef4444' : '#f59e0b'} />
                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{warning.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Inconsistency Alert (Masking Detection) ── */}
          <AnimatePresence>
            {inconsistency_alert && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="glass-card"
                style={{
                  padding: '1rem 1.5rem', marginBottom: '1.5rem',
                  borderLeft: '4px solid #3b82f6',
                  background: 'rgba(59, 130, 246, 0.05)',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                <ShieldAlert size={20} style={{ color: '#3b82f6' }} />
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3b82f6', marginBottom: '2px' }}>AI Perceptive Insight</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{inconsistency_alert}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {analysisResult.is_short_input && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
              Note: This analysis is primarily based on your behavioral metrics due to the brief journal entry.
            </motion.div>
          )}

          {/* ── Top Row: Gauge + XAI Reasons ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>

            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <BurnoutGauge score={burnout_score} color={riskColor} />
              <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Risk Intensity</p>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: riskColor }}>{burnout_level}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  Based on your behavioral data and linguistic stress patterns.
                </p>

                {/* Crisis Support Button (Opens Modal) */}
                {(burnout_score > 0.8 || burnout_level.includes('Severe')) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSupportModal(true)}
                    style={{
                      marginTop: '1.5rem', width: '100%', padding: '12px',
                      background: '#ef4444', color: 'white', border: 'none',
                      borderRadius: '10px', fontWeight: 600, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '8px',
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                    }}
                  >
                    <LifeBuoy size={18} /> Emergency Support Needed?
                  </motion.button>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} style={{ color: 'var(--accent-purple)' }} /> Analysis Reasoning
              </h3>
              {reasoning.summary && (
                <div style={{ marginBottom: '1.2rem', padding: '10px 14px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)', fontSize: '0.9rem', fontWeight: 500, fontStyle: 'italic', color: 'var(--text-primary)' }}>
                  "{reasoning.summary}"
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(reasoning).map(([category, items]) => (
                  category !== 'summary' && items.length > 0 && (
                    <div key={category}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 700, letterSpacing: '0.5px' }}>
                        {category}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {items.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', paddingLeft: '8px', borderLeft: '2px solid var(--accent-purple)' }}>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* ── Feature Breakdown + Emotion Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

            {/* Feature breakdown bars */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '1.2rem' }}>Score Breakdown</h3>
              <FeatureBar label="Sentiment" value={analysisResult.score_breakdown?.sentiment || 0} color="#ef4444" />
              <FeatureBar label="Cognitive" value={analysisResult.score_breakdown?.cognitive || 0} color="#8b5cf6" />
              <FeatureBar label="Behavioral" value={analysisResult.score_breakdown?.behavioral || 0} color="#f59e0b" />
              <FeatureBar label="Context" value={analysisResult.score_breakdown?.context || 0} color="#22c55e" />
            </div>

            {/* Emotion card */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Detected Emotion</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <div style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: emotionColor,
                  boxShadow: `0 0 12px ${emotionColor}`,
                }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize' }}>
                  {primary_emotion}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  (intensity: {analysisResult.nlp_analysis?.sentiment?.emotional_intensity > 0 ? `${Math.round(analysisResult.nlp_analysis.sentiment.emotional_intensity * 100)}%` : 'Low'})
                </span>
              </div>

              {primary_emotion !== 'positive' && ['positive', 'negative', 'neutral'].map(type => (
                <div key={type} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{type}</span>
                    <span>{Math.round(emotion_distribution[type] * 100)}%</span>
                  </div>
                  <div style={{ background: 'var(--track-bg)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${emotion_distribution[type] * 100}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      style={{
                        height: '100%', borderRadius: '4px',
                        background: type === 'positive' ? '#22c55e' : type === 'negative' ? '#ef4444' : 'var(--accent-purple)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Keyword Detection ── */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1.2rem' }}>Keyword Detection</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Fatigue Indicators', items: fatigue_indicators, color: '#f59e0b' },
                { label: 'Negative Patterns', items: patterns, color: '#8b5cf6' },
                { label: 'Direct Keywords', items: analysisResult.nlp_analysis?.keyword_analysis?.stress_keywords_found || [], color: '#ef4444' },
              ].map(({ label, items, color }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>{label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {items && items.length > 0 ? items.map((kw, i) => (
                      <span key={i} style={{
                        background: `${color}22`, border: `1px solid ${color}44`,
                        borderRadius: '6px', padding: '2px 10px',
                        fontSize: '0.78rem', color,
                      }}>{kw}</span>
                    )) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>None detected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Cognitive Load */}
            {cognitive_load_score != null && (
              <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cognitive Load Score:</span>
                <div style={{ flex: 1, background: 'var(--track-bg)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cognitive_load_score * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: '4px',
                      background: `linear-gradient(90deg, var(--accent-purple), var(--accent-mauve))`,
                    }}
                  />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '36px' }}>
                  {Math.round(cognitive_load_score * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* ── Recommendations ── */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
              Recommendations — <span style={{ color: 'var(--accent-purple)' }}>{recommendations.primary_issue}</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.2rem' }}>
              Urgency: <span style={{
                color: recommendations.urgency === 'immediate' ? '#ef4444' : recommendations.urgency === 'moderate' ? '#f59e0b' : '#22c55e',
                textTransform: 'capitalize', fontWeight: 600,
              }}>{recommendations.urgency}</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {recommendations.recommendations.map((rec, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    background: 'rgba(59,130,246,0.06)', borderRadius: '10px',
                    padding: '12px', fontSize: '0.88rem', display: 'flex', gap: '10px',
                  }}>
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  {rec}
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('recovery')} className="btn-primary"
              style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              View Recovery Plan <ArrowRight size={16} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('insights')}
              style={{
                padding: '12px 24px', background: 'transparent',
                border: '1px solid var(--border)', borderRadius: '12px',
                color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
              <TrendingUp size={16} /> View Trends
            </motion.button>
          </div>

        </motion.div>
      </div>

      {/* ── Support Modal ── */}
      <AnimatePresence>
        {showSupportModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '1rem'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card"
              style={{
                maxWidth: '500px', width: '100%', padding: '2rem',
                border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', color: '#ef4444' }}>
                <LifeBuoy size={28} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Emergency Support</h2>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                It looks like you're going through a tough time. We've drafted an email for the <strong>Wellness Centre</strong> to help you get support quickly.
              </p>

              <div style={{
                background: 'rgba(255,255,255,0.05)', padding: '1.2rem',
                borderRadius: '10px', border: '1px solid var(--border)',
                marginBottom: '1.5rem', whiteSpace: 'pre-wrap'
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>PROFESSIONAL DRAFT:</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  <strong>Subject:</strong> Mental Health Support Request - MindGuard Alert<br />
                  <strong>To:</strong> wellnesscentre@srmap.edu.in<br /><br />
                  Dear Wellness Team,<br />
                  I hope you are doing well.<br /><br />
                  I am a student and I would like to request a counseling session. I have been using MindGuard, and it showed a <strong>“{burnout_level}.”</strong><br /><br />
                  Recently, I have been feeling a lot of stress and emotional pressure. I would like to talk to a counselor and get some help to manage this.<br /><br />
                  Please let me know a suitable time for the session.<br /><br />
                  Thank you.<br />
                  Regards,<br />
                  {sessionStorage.getItem('username') || 'Student'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const username = sessionStorage.getItem('username') || 'Student';
                    const text = `Subject: Mental Health Support Request - MindGuard Alert\nTo: wellnesscentre@srmap.edu.in\n\nDear Wellness Team,\nI hope you are doing well.\n\nI am a student and I would like to request a counseling session. I have been using MindGuard, and it showed a "${burnout_level}."\n\nRecently, I have been feeling a lot of stress and emotional pressure. I would like to talk to a counselor and get some help to manage this.\n\nPlease let me know a suitable time for the session.\n\nThank you.\n\nRegards,\n${username}`;
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    width: '100%', padding: '16px', background: '#ef4444',
                    color: 'white', border: 'none',
                    borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    boxShadow: '0 4px 15px rgba(239,68,68,0.3)'
                  }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? 'Professional Draft Copied!' : 'Copy Professional Draft to Send'}
                </motion.button>

                <button
                  onClick={() => setShowSupportModal(false)}
                  style={{
                    marginTop: '0.5rem', background: 'none', border: 'none',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}