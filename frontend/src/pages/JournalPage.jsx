import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Moon, Clock, Coffee, Smile, AlertCircle, Loader, CheckCircle, Mic, MicOff, Square } from 'lucide-react'

const moodLabels = ['', 'Terrible', 'Very Bad', 'Bad', 'Poor', 'Okay', 'Fine', 'Good', 'Very Good', 'Great', 'Amazing']
const moodColors = ['', '#ef4444', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#a3e635', '#22c55e', '#22c55e', '#10b981', '#06b6d4']

export default function JournalPage({ navigate, setAnalysisResult }) {
  const [journal, setJournal]       = useState('')
  const [sleep, setSleep]           = useState(7)
  const [work, setWork]             = useState(8)
  const [breakTime, setBreakTime]   = useState(30)
  const [mood, setMood]             = useState(5)
  const [deadline, setDeadline]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [done, setDone]             = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported]            = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  const recognitionRef              = useRef(null)

  // ── Voice Input ──────────────────────────────────────────
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous      = true
    recognitionRef.current.interimResults  = true
    recognitionRef.current.lang            = 'en-US'

    let finalTranscript = ''

    recognitionRef.current.onstart = () => setIsListening(true)

    recognitionRef.current.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        } else {
          interim = event.results[i][0].transcript
        }
      }
      setJournal(prev => {
        const base = prev.replace(/\[listening...\].*$/, '').trimEnd()
        if (finalTranscript) {
          return (base + ' ' + finalTranscript).trim()
        }
        return (base + ' ' + (interim ? `[listening...] ${interim}` : '')).trim()
      })
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
      setJournal(prev => prev.replace(/\[listening...\].*$/, '').trimEnd())
    }

    recognitionRef.current.onerror = () => {
      setIsListening(false)
      setError('Microphone access denied or unavailable.')
    }

    recognitionRef.current.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    const cleanJournal = journal.replace(/\[listening...\].*$/, '').trim()
    if (cleanJournal.length < 20) {
      setError('Please write at least 20 characters in your journal entry.')
      return
    }
    const words = cleanJournal.split(/\s+/).filter(w => w.length > 0)
    if (words.length < 4) {
      setError('Please provide a more descriptive journal (at least 4 words).')
      return
    }
    if (work > 0 && breakTime > work * 60) {
      setError('Break time cannot exceed total work/study hours.')
      return
    }
    const totalHrs = sleep + work + (breakTime / 60)
    if (totalHrs > 24) {
      setError('the total hrs (including breaks) exceed 24hrs enter valid details')
      return
    }
    setError('')
    setLoading(true)

    const payload = {
      journal_text: cleanJournal,
      sleep_hours:  sleep,
      work_hours:   work,
      break_time:   breakTime,
      mood_score:   mood,
      has_deadline: deadline,
      energy_level: 0.6,
      social_interaction: 0.5,
      physical_exercise: 0.5,
      caffeine_intake: 0.4,
      study_continuity: 0.5,
      yesterday_mood: null,
    }

    try {
      const user_id = sessionStorage.getItem('username') || 'guest'
      const response = await fetch(`/api/analyze?user_id=${user_id}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify(payload),
      })

      if (!response.ok) {
        const errText = await response.text()
        setError(`Server error ${response.status}: ${errText}`)
        setLoading(false)
        return
      }

      const data = await response.json()
      setAnalysisResult(data)
      setDone(true)
      setTimeout(() => navigate('dashboard'), 1500)
    } catch (err) {
      setError(`Connection error: ${err.message}. Make sure backend is running on port 8080.`)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background:  'var(--input-bg)',
    border:      '1px solid var(--border)',
    borderRadius: '10px',
    color:        'var(--text-primary)',
    padding:      '10px 14px',
    width:        '100%',
    fontSize:     '1rem',
    fontFamily:  'Inter, sans-serif',
    outline:     'none',
  }

  return (
    <div style={{ minHeight: '100vh', padding: '80px 2rem 3rem' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Daily <span className="glow-text">Journal Entry</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
            Write or speak how you're feeling today. Our AI will analyze your emotional state.
          </p>

          {/* ── Journal Textarea ── */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Brain size={18} style={{ color: '#3b82f6' }} /> Journal Entry
              </label>

              {/* Voice Button (Hidden) */}
              {false && voiceSupported && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isListening ? stopListening : startListening}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '6px',
                    padding:      '7px 14px',
                    background:   isListening
                      ? 'rgba(239,68,68,0.15)'
                      : 'rgba(139,92,246,0.1)',
                    border:       `1px solid ${isListening ? 'rgba(239,68,68,0.4)' : 'rgba(139,92,246,0.3)'}`,
                    borderRadius: '8px',
                    color:        isListening ? '#ef4444' : 'var(--accent-purple)',
                    cursor:       'pointer',
                    fontSize:     '0.8rem',
                    fontWeight:   500,
                    fontFamily:  'Inter, sans-serif',
                    transition:  'all 0.2s',
                  }}
                >
                  {isListening ? (
                    <>
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                      >
                        <Square size={13} fill="#ef4444" />
                      </motion.span>
                      Stop
                    </>
                  ) : (
                    <><Mic size={13} /> Voice Input</>
                  )}
                </motion.button>
              )}
            </div>

            {/* Listening indicator */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '8px',
                    padding:      '8px 12px',
                    background:   'rgba(239,68,68,0.08)',
                    border:       '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    fontSize:     '0.82rem',
                    color:        '#ef4444',
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}
                  />
                  Listening… speak clearly into your microphone
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              value={journal}
              onChange={e => setJournal(e.target.value)}
              placeholder="How are you feeling today? Describe your energy levels, stress, workload, sleep quality…"
              style={{ ...inputStyle, minHeight: '180px', resize: 'vertical', lineHeight: 1.7 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <span>{journal.replace(/\[listening...\].*$/, '').trim().length} characters</span>
              {/* Voice support warning hidden */}
            </div>
          </div>

          {/* ── Behavioral Inputs ── */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Daily Behaviors</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

              {/* Sleep */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Moon size={15} /> Sleep: <strong style={{ color: 'var(--text-primary)', marginLeft: 4 }}>{sleep}h</strong>
                </label>
                <input type="range" min="2" max="12" step="0.5" value={sleep}
                  onChange={e => setSleep(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  <span>2h</span><span>12h</span>
                </div>
              </div>

              {/* Work */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Clock size={15} /> Work/Study: <strong style={{ color: 'var(--text-primary)', marginLeft: 4 }}>{work}h</strong>
                </label>
                <input type="range" min="0" max="16" step="0.5" value={work}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setWork(val);
                    if (val === 0) setBreakTime(0);
                  }}
                  style={{ width: '100%', accentColor: '#8b5cf6' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  <span>0h</span><span>16h</span>
                </div>
              </div>

              {/* Breaks */}
              <div style={{ opacity: work === 0 ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Coffee size={15} /> Breaks: <strong style={{ color: 'var(--text-primary)', marginLeft: 4 }}>{breakTime} min</strong>
                  {work === 0 && <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontStyle: 'italic' }}>(N/A)</span>}
                </label>
                <input type="range" min="0" max="120" step="5" value={breakTime}
                  disabled={work === 0}
                  onChange={e => setBreakTime(parseInt(e.target.value))}
                  style={{ 
                    width: '100%', 
                    accentColor: '#06b6d4',
                    cursor: work === 0 ? 'not-allowed' : 'pointer'
                  }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  <span>0</span><span>120 min</span>
                </div>
              </div>

              {/* Mood */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Smile size={15} /> Mood: <strong style={{ color: moodColors[mood] || 'var(--text-primary)', marginLeft: 4 }}>{moodLabels[mood]} ({mood}/10)</strong>
                </label>
                <input type="range" min="1" max="10" step="1" value={mood}
                  onChange={e => setMood(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: moodColors[mood] || '#22c55e' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  <span>Terrible</span><span>Amazing</span>
                </div>
              </div>
            </div>

            {(sleep + work + (breakTime / 60) > 24) && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> the total hrs (including breaks) exceed 24hrs enter valid details
              </div>
            )}

            {(work > 0 && breakTime > work * 60) && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> Break time cannot exceed total work/study hours
              </div>
            )}

            {/* Deadline Toggle */}
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                onClick={() => setDeadline(!deadline)}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background:  deadline ? 'var(--accent-purple)' : 'var(--track-bg)',
                  cursor:      'pointer', position: 'relative', transition: 'all 0.3s',
                  flexShrink:  0,
                }}
              >
                <div style={{
                  position:    'absolute', top: '3px',
                  left:        deadline ? '23px' : '3px',
                  width:       '18px', height: '18px',
                  borderRadius: '50%', background: 'white',
                  transition:  'all 0.3s',
                }} />
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                I have a deadline / exam within the next 48 hours
              </span>
            </div>
          </div>

          {/* ── Error ── */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem',
                  background: 'rgba(239,68,68,0.1)', padding: '12px',
                  borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)',
                }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Submit Button ── */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: 'var(--glow-purple)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading || done}
            className="btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            {loading ? (
              <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</>
            ) : done ? (
              <><CheckCircle size={18} /> Analysis Complete! Redirecting…</>
            ) : (
              <><Brain size={18} /> Analyze My Journal</>
            )}
          </motion.button>

        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}