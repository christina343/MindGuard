import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Wind, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react'

const BREATHING_METHODS = {
  relax: { 
    name: 'Relax', inhale: 4, hold: 4, exhale: 4, color: 'var(--accent-purple)',
    desc: 'Simple equal breathing to calm the nervous system and center yourself.'
  },
  box: { 
    name: 'Box', inhale: 4, hold: 4, exhale: 4, hold2: 4, color: '#818cf8',
    desc: 'Used by Navy SEALs to stay calm and focused under pressure. Clears the mind.'
  },
  '478': { 
    name: '4-7-8', inhale: 4, hold: 7, exhale: 8, color: '#a78bfa',
    desc: 'The gold standard for deep relaxation. Proven to help with anxiety and sleep.'
  }
}

const MINDFUL_TIPS = [
  "Relax your jaw...",
  "Drop your shoulders...",
  "Unclench your hands...",
  "Soften your gaze...",
  "Feel the weight of your body...",
  "Let go of the next thought...",
  "Observe your breath without judgment..."
]

export default function CalmPage({ navigate }) {
  const [method, setMethod] = useState('relax')
  const [phase, setPhase] = useState('Inhale')
  const [seconds, setSeconds] = useState(4)
  const [isActive, setIsActive] = useState(false)
  const [cycle, setCycle] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    let interval = null
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            const m = BREATHING_METHODS[method]
            if (phase === 'Inhale') {
              setPhase('Hold')
              return m.hold
            } else if (phase === 'Hold') {
              setPhase('Exhale')
              return m.exhale
            } else if (phase === 'Exhale' && m.hold2) {
              setPhase('Hold ') // Space for unique key
              return m.hold2
            } else {
              setPhase('Inhale')
              setCycle(c => c + 1)
              setTipIndex(prevTip => (prevTip + 1) % MINDFUL_TIPS.length)
              return m.inhale
            }
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isActive, phase, method])

  const changeMethod = (m) => {
    setMethod(m)
    setIsActive(false)
    setPhase('Inhale')
    setSeconds(BREATHING_METHODS[m].inhale)
    setCycle(0)
  }

  const toggleExercise = () => {
    setIsActive(!isActive)
    if (!isActive && cycle === 0) {
      setPhase('Inhale')
      setSeconds(BREATHING_METHODS[method].inhale)
    }
  }

  const resetExercise = () => {
    setIsActive(false)
    setPhase('Inhale')
    setSeconds(BREATHING_METHODS[method].inhale)
    setCycle(0)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Back Button */}
      <motion.button
        onClick={() => navigate('dashboard')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'absolute', top: '100px', left: '40px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '12px', color: 'var(--text-secondary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10
        }}
      >
        <ArrowLeft size={20} /> Back
      </motion.button>

      <div style={{ textAlign: 'center', maxWidth: '600px', zIndex: 5 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '2rem' }}
        >
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Guided <span className="glow-text">Breathing</span>
          </h1>
          
          {/* Method Selector */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '1.5rem', marginBottom: '1rem' }}>
            {Object.entries(BREATHING_METHODS).map(([key, m]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => changeMethod(key)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: method === key ? `2px solid ${m.color}` : '1px solid var(--border)',
                  background: method === key ? `${m.color}15` : 'var(--bg-card)',
                  color: method === key ? m.color : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {m.name}
              </motion.button>
            ))}
          </div>

          {/* Method Description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={method}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}
            >
              {BREATHING_METHODS[method].desc}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Breathing Circle Container */}
        <div style={{ 
          position: 'relative', width: '300px', height: '300px', 
          margin: '0 auto 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {/* Pulsating Glow */}
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ scale: (phase === 'Inhale') ? 0.8 : 1.2 }}
              animate={{ 
                scale: (phase === 'Inhale') ? 1.2 : (phase.startsWith('Hold')) ? 1.2 : 0.8,
                opacity: phase.startsWith('Hold') ? 0.4 : 0.2
              }}
              transition={{ 
                duration: (phase === 'Inhale') ? BREATHING_METHODS[method].inhale : 
                          (phase === 'Exhale') ? BREATHING_METHODS[method].exhale : 
                          (phase === 'Hold')   ? BREATHING_METHODS[method].hold : 
                          BREATHING_METHODS[method].hold2 || 4,
                ease: "easeInOut" 
              }}
              style={{
                position: 'absolute', width: '100%', height: '100%',
                borderRadius: '50%', background: BREATHING_METHODS[method].color,
                filter: 'blur(40px)', zIndex: 1
              }}
            />
          </AnimatePresence>

          {/* Main Circle */}
          <motion.div
            animate={{ 
              scale: (phase === 'Inhale') ? 1.2 : (phase.startsWith('Hold')) ? 1.2 : 0.8,
            }}
            transition={{ 
              duration: (phase === 'Inhale') ? BREATHING_METHODS[method].inhale : 
                        (phase === 'Exhale') ? BREATHING_METHODS[method].exhale : 
                        (phase === 'Hold')   ? BREATHING_METHODS[method].hold : 
                        BREATHING_METHODS[method].hold2 || 4,
              ease: "easeInOut" 
            }}
            style={{
              width: '200px', height: '200px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${BREATHING_METHODS[method].color}, var(--accent-mauve))`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: 'white', boxShadow: `0 20px 50px ${BREATHING_METHODS[method].color}44`,
              zIndex: 2, position: 'relative'
            }}
          >
            <Wind size={32} style={{ marginBottom: '8px', opacity: 0.8 }} />
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{phase.trim()}</span>
            <span style={{ fontSize: '1rem', opacity: 0.9 }}>{seconds}s</span>
          </motion.div>

          <svg width="300" height="300" style={{ position: 'absolute', transform: 'rotate(-90deg)', zIndex: 0 }}>
            <circle cx="150" cy="150" r="130" fill="none" stroke="var(--track-bg)" strokeWidth="4" />
          </svg>
        </div>

        {/* Mindful Tip */}
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ 
              height: '24px', color: 'var(--accent-purple)', 
              fontSize: '1rem', fontWeight: 500, marginBottom: '2.5rem',
              fontStyle: 'italic'
            }}
          >
            {isActive ? MINDFUL_TIPS[tipIndex] : "Ready to begin?"}
          </motion.p>
        </AnimatePresence>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={resetExercise}
            style={{
              padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '50%', color: 'var(--text-secondary)', cursor: 'pointer'
            }}
          >
            <RotateCcw size={20} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={toggleExercise}
            className="btn-primary"
            style={{
              padding: '16px 40px', fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', gap: '12px',
              minWidth: '180px', justifyContent: 'center'
            }}
          >
            {isActive ? <><Pause size={20} /> Pause</> : <><Play size={20} /> {cycle > 0 ? 'Resume' : 'Start Session'}</>}
          </motion.button>
          
          <div style={{ width: '44px' }} />
        </div>

        <motion.p 
          animate={{ opacity: cycle > 0 ? 1 : 0 }}
          style={{ marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}
        >
          Cycles completed: <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{cycle}</span>
        </motion.p>
      </div>
    </div>
  )
}
