import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
} from 'recharts'
import { TrendingDown, TrendingUp, Minus, Trash2, ChevronLeft, ChevronRight, Brain } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const riskColor = (r) =>
  r === 'High' ? '#ef4444' : r === 'Moderate' ? '#f59e0b' : '#22c55e'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <p style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        {payload[0]?.payload?.date}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: '0.82rem' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MOOD CALENDAR
// ─────────────────────────────────────────────────────────────────────────────
function MoodCalendar({ history }) {
  const today    = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  // Build lookup: "YYYY-MM-DD" → {risk_level, burnout_score}
  const dayMap = {}
  for (const e of history) {
    const d = new Date(e.timestamp)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    // Keep highest burnout score if multiple entries same day
    if (!dayMap[key] || e.burnout_score > dayMap[key].burnout_score) {
      dayMap[key] = e
    }
  }

  const firstDay   = new Date(year, month, 1).getDay()  // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthNames  = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const cells = []
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) cells.push(null)
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isToday = (d) => {
    const t = new Date()
    return d === t.getDate() && month === t.getMonth() && year === t.getFullYear()
  }

  return (
    <div className="glass-card" style={{ padding: '1rem', maxWidth: '340px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
        <h3 style={{ fontWeight: 600, fontSize: '0.9rem' }}>Mood Calendar</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={prevMonth}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 6px' }}>
            <ChevronLeft size={12} />
          </motion.button>
          <span style={{ fontWeight: 600, fontSize: '0.8rem', minWidth: '90px', textAlign: 'center' }}>
            {monthNames[month]} {year}
          </span>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 6px' }}>
            <ChevronRight size={12} />
          </motion.button>
        </div>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '4px' }}>
        {['S','M','T','W','T','F','S'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} />
          const key   = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const entry = dayMap[key]
          const bg    = entry ? `${riskColor(entry.risk_level)}33` : 'var(--track-bg)'
          const border = entry
            ? `1px solid ${riskColor(entry.risk_level)}55`
            : isToday(d)
              ? '1px solid var(--accent-purple)'
              : '1px solid var(--border)'

          return (
            <motion.div key={key}
              whileHover={entry ? { scale: 1.15, zIndex: 1 } : {}}
              title={entry ? `${entry.risk_level} Risk — Score: ${Math.round(entry.burnout_score * 100)}%` : ''}
              style={{
                aspectRatio:  '1',
                borderRadius: '5px',
                background:   bg,
                border,
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                fontSize:     '0.68rem',
                fontWeight:   isToday(d) ? 700 : 400,
                color:        entry ? riskColor(entry.risk_level) : isToday(d) ? 'var(--accent-purple)' : 'var(--text-secondary)',
                cursor:       entry ? 'pointer' : 'default',
                transition:   'all 0.15s',
                position:     'relative',
              }}
            >
              {d}
              {entry && (
                <div style={{
                  position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)',
                  width: '3px', height: '3px', borderRadius: '50%',
                  background: riskColor(entry.risk_level),
                }} />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', marginTop: '1rem', flexWrap: 'wrap' }}>
        {[['#22c55e', 'Low'], ['#f59e0b', 'Moderate'], ['#ef4444', 'High']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />
            {l}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--track-bg)', border: '1px solid var(--border)' }} />
          No entry
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN INSIGHTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
// ── Thought Cloud ─────────────────────────────────────────────────────────────
function ThoughtCloud({ history }) {
  // Aggregate keywords
  const counts = {}
  history.forEach(entry => {
    if (entry.keywords) {
      entry.keywords.positive?.forEach(w => {
        const word = w.toLowerCase()
        counts[word] = { count: (counts[word]?.count || 0) + 1, type: 'positive' }
      })
      entry.keywords.negative?.forEach(w => {
        const word = w.toLowerCase()
        counts[word] = { count: (counts[word]?.count || 0) + 1, type: 'negative' }
      })
    }
  })

  const words = Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)

  if (words.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Not enough data for a Thought Cloud yet. Keep journaling!</p>
      </div>
    )
  }

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Brain size={18} style={{ color: 'var(--accent-purple)' }} />
        Thought Cloud
      </h3>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '12px', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '120px',
        padding: '10px'
      }}>
        {words.map(([word, data]) => {
          const size = Math.min(1.8, 0.8 + (data.count * 0.2))
          const color = data.type === 'positive' ? '#10b981' : '#f43f5e'
          const opacity = Math.min(1, 0.4 + (data.count * 0.15))
          
          return (
            <motion.span
              key={word}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1, y: -2 }}
              style={{
                fontSize: `${size}rem`,
                fontWeight: data.count > 1 ? 700 : 500,
                color,
                opacity,
                cursor: 'default',
                padding: '4px 8px',
                textShadow: data.count > 2 ? `0 0 10px ${color}33` : 'none'
              }}
            >
              {word}
            </motion.span>
          )
        })}
      </div>
    </div>
  )
}

export default function InsightsPage({ navigate }) {
  const [history, setHistory]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [confirmReset, setConfirmReset] = useState(false)

  const fetchHistory = () => {
    setLoading(true)
    const user_id = sessionStorage.getItem('username') || 'guest'
    fetch(`/api/history?user_id=${user_id}`)
      .then(r => r.json())
      .then(d => setHistory(d.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchHistory() }, [])

  const clearHistory = async () => {
    const user_id = sessionStorage.getItem('username') || 'guest'
    await fetch(`/api/history?user_id=${user_id}`, { method: 'DELETE' })
    setHistory([])
    setConfirmReset(false)
  }

  // Chart data
  const chartData = history.map((e, i) => ({
    day:     `#${i + 1}`,
    burnout: Math.round(e.burnout_score * 100),
    mood:    e.mood_score * 10,
    sleep:   Math.round(e.sleep_hours * 8.33),  // scale 12h→100
    date:    new Date(e.timestamp).toLocaleDateString(),
  }))

  // Stats
  const avgBurnout = history.length
    ? (history.reduce((a, b) => a + b.burnout_score, 0) / history.length * 100).toFixed(1)
    : 0

  const trend = history.length >= 2
    ? history[history.length - 1].burnout_score - history[history.length - 2].burnout_score
    : 0

  // Emotion frequency
  const emotionCount = {}
  history.forEach(e => {
    if (e.emotion) emotionCount[e.emotion] = (emotionCount[e.emotion] || 0) + 1
  })
  const emotionData = Object.entries(emotionCount).map(([name, count]) => ({ name, count }))
  const emotionColorMap = {
    stressed: '#ef4444', sad: '#8b5cf6', angry: '#f97316',
    fatigued: '#eab308', positive: '#22c55e', neutral: 'var(--accent-purple)',
  }

  return (
    <div style={{ minHeight: '100vh', padding: '80px 2rem 3rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
              Trend <span className="glow-text">Insights</span>
            </h1>
            {history.length > 0 && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setConfirmReset(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '10px', color: '#ef4444', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                }}>
                <Trash2 size={14} /> Reset Entries
              </motion.button>
            )}
          </div>

          {/* ── Confirm Reset Modal ── */}
          <AnimatePresence>
            {confirmReset && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  position: 'fixed', inset: 0, zIndex: 200,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                }}>
                <div className="glass-card" style={{ padding: '2rem', maxWidth: '360px', textAlign: 'center' }}>
                  <Trash2 size={32} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
                  <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Reset all entries?</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    This will permanently delete all {history.length} journal history entries. This cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={() => setConfirmReset(false)}
                      style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      Cancel
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={clearHistory}
                      style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', color: '#ef4444', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                      Delete All
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading history…</div>
          ) : history.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No entries yet. Complete journal entries to see trends.</p>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('journal')} className="btn-primary" style={{ padding: '10px 24px' }}>
                Start Journaling
              </motion.button>
            </div>
          ) : (
            <>
              {/* ── Summary Cards ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Total Entries', value: history.length, unit: '' },
                  { label: 'Avg Burnout',   value: avgBurnout,    unit: '%' },
                  { label: 'Latest Risk',   value: history[history.length - 1]?.risk_level, unit: '' },
                  { label: 'Latest Score',  value: Math.round(history[history.length - 1]?.burnout_score * 100), unit: '%' },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="glass-card" style={{ padding: '1.2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '6px' }}>{label}</p>
                    <p style={{ fontSize: '1.6rem', fontWeight: 700 }} className="glow-text">{value}{unit}</p>
                  </div>
                ))}
              </div>

              {/* ── Trend Direction ── */}
              <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {trend > 0.05
                  ? <TrendingUp size={20} style={{ color: '#ef4444' }} />
                  : trend < -0.05
                    ? <TrendingDown size={20} style={{ color: '#22c55e' }} />
                    : <Minus size={20} style={{ color: '#f59e0b' }} />}
                <span style={{ fontSize: '0.92rem' }}>
                  {trend > 0.05   ? 'Burnout risk is increasing — take action now'
                    : trend < -0.05 ? 'Great progress! Burnout risk is decreasing'
                      : 'Burnout risk is stable'}
                </span>
              </div>

              {/* ── Calendar & Main Chart Grid ── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '1.5rem',
                marginBottom: '1.5rem',
                alignItems: 'start'
              }}>
                {/* ── Mood Calendar ── */}
                <MoodCalendar history={history} />

                {/* ── Burnout Area Chart ── */}
                <div className="glass-card" style={{ padding: '1.5rem', height: '100%' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Burnout Score Over Time</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="burnoutGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="day" stroke="#475569" fontSize={11} />
                    <YAxis stroke="#475569" fontSize={11} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="burnout" name="Burnout %" stroke="#ef4444"
                      fill="url(#burnoutGrad)" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

              {/* ── Mood vs Sleep Line Chart ── */}
              <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Mood vs Sleep Trend</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="day" stroke="#475569" fontSize={11} />
                    <YAxis stroke="#475569" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="mood"  name="Mood (scaled)" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="sleep" name="Sleep (scaled)" stroke="var(--accent-purple)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* ── Emotion Frequency Bar Chart ── */}
              {emotionData.length > 0 && (
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Emotion Frequency</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={emotionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis type="number" stroke="#475569" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#475569" fontSize={11} width={70} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                        {emotionData.map((entry, i) => (
                          <Cell key={i} fill={emotionColorMap[entry.name] || 'var(--accent-purple)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ── Thought Cloud ── */}
              <div style={{ marginBottom: '1.5rem' }}>
                <ThoughtCloud history={history} />
              </div>

              {/* ── Recent Entries List ── */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '1.2rem' }}>Recent Entries</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[...history].reverse().slice(0, 5).map((entry, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '12px', background: 'var(--bg-card)',
                        borderRadius: '10px', borderLeft: `3px solid ${riskColor(entry.risk_level)}`,
                      }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                          {entry.journal_preview || 'No preview available'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(entry.timestamp).toLocaleString()}
                          {entry.emotion && <span style={{ marginLeft: 8, textTransform: 'capitalize' }}>· {entry.emotion}</span>}
                        </p>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem',
                        background: `${riskColor(entry.risk_level)}22`,
                        border: `1px solid ${riskColor(entry.risk_level)}44`,
                        color: riskColor(entry.risk_level), fontWeight: 600, flexShrink: 0,
                      }}>
                        {entry.risk_level}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}