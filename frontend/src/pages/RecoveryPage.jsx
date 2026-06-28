import { motion } from 'framer-motion'
import { Sun, Sunset, Moon, Star, BookOpen } from 'lucide-react'

const timeSlots = [
  { key: 'morning', label: 'Morning', icon: Sun, color: '#f59e0b', time: '6 AM – 12 PM' },
  { key: 'afternoon', label: 'Afternoon', icon: Sunset, color: '#6366f1', time: '12 PM – 6 PM' },
  { key: 'evening', label: 'Evening', icon: Moon, color: '#8b5cf6', time: '6 PM – 9 PM' },
  { key: 'night', label: 'Night', icon: Star, color: '#c084fc', time: '9 PM – Sleep' },
]

export default function RecoveryPage({ navigate, analysisResult }) {
  if (!analysisResult?.recovery_plan) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', paddingTop: '64px' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>No recovery plan yet</h2>
        <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('journal')} className="btn-primary"
          style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} /> Analyze First
        </motion.button>
      </div>
    )
  }

  const { daily_plan, plan_focus, risk_level } = analysisResult.recovery_plan
  const riskColor = risk_level === 'High' ? '#ef4444' : risk_level === 'Moderate' ? '#f59e0b' : '#22c55e'

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', padding: '80px 2rem 3rem' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Your <span className="glow-text">Recovery Plan</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Focus Mode:</span>
              <span style={{ background: `${riskColor}22`, border: `1px solid ${riskColor}44`, color: riskColor, borderRadius: '20px', padding: '4px 14px', fontSize: '0.85rem', fontWeight: 600 }}>
                {plan_focus}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {timeSlots.map(({ key, label, icon: Icon, color, time }, sectionIndex) => (
              daily_plan[key] && (
                <motion.div key={key} className="glass-card"
                  initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: sectionIndex * 0.12 }}
                  style={{ padding: '1.5rem', borderLeft: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{label}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{time}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {daily_plan[key].map((task, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: sectionIndex * 0.12 + i * 0.06 }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', background: `${color}15`, borderRadius: '10px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1.5px solid ${color}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color, fontWeight: 700 }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{task}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}