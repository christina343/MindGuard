import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Flame, Calendar } from 'lucide-react'

export default function StreakTracker({ history = [] }) {
  const [streak, setStreak]       = useState(0)
  const [totalDays, setTotalDays] = useState(0)
  const numberRef = useRef(null)
  const flameRef  = useRef(null)

  useEffect(() => {
    if (!history.length) return

    // Calculate streak — consecutive days with at least one entry
    const dates = history
      .map(e => new Date(e.timestamp).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)  // unique dates
      .sort((a, b) => new Date(b) - new Date(a)) // latest first

    let currentStreak = 0
    const today = new Date()

    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today)
      expected.setDate(today.getDate() - i)
      if (dates[i] === expected.toDateString()) {
        currentStreak++
      } else {
        break
      }
    }

    setStreak(currentStreak)
    setTotalDays(dates.length)

    // GSAP number count-up animation
    if (numberRef.current) {
      gsap.from({ val: 0 }, {
        val: currentStreak,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: function () {
          if (numberRef.current)
            numberRef.current.textContent = Math.round(this.targets()[0].val)
        }
      })
    }

    // Flame flicker animation
    if (currentStreak > 0 && flameRef.current) {
      gsap.to(flameRef.current, {
        scale: 1.2,
        rotate: 5,
        repeat: -1,
        yoyo: true,
        duration: 0.6,
        ease: 'sine.inOut'
      })
    }
  }, [history])

  const getBadge = () => {
    if (streak >= 30) return { label: '🏆 Month Master',   color: '#f59e0b' }
    if (streak >= 14) return { label: '⚡ Two Week Hero',  color: '#8b5cf6' }
    if (streak >= 7)  return { label: '🔥 Week Warrior',   color: '#ef4444' }
    if (streak >= 3)  return { label: '✨ On a Roll',       color: '#3b82f6' }
    if (streak >= 1)  return { label: '🌱 Getting Started', color: '#22c55e' }
    return null
  }

  const badge = getBadge()

  if (!history.length) return null

  return (
    <div className="glass-card" style={{
      padding: '1.2rem 1.5rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      flexWrap: 'wrap'
    }}>

      {/* Streak Count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span ref={flameRef} style={{ fontSize: '1.8rem' }}>
          <Flame size={28} style={{ color: streak > 0 ? '#f97316' : '#475569' }} />
        </span>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span ref={numberRef} style={{
              fontSize: '2rem', fontWeight: 800,
              color: streak > 0 ? '#f97316' : 'var(--text-secondary)'
            }}>
              {streak}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              day streak
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '40px', background: 'var(--border)' }} />

      {/* Total Days */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={18} style={{ color: '#3b82f6' }} />
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>
            {totalDays}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            total days
          </div>
        </div>
      </div>

      {/* Badge */}
      {badge && (
        <>
          <div style={{ width: '1px', height: '40px', background: 'var(--border)' }} />
          <div style={{
            padding: '5px 14px', borderRadius: '20px',
            background: `${badge.color}18`,
            border: `1px solid ${badge.color}33`,
            color: badge.color,
            fontSize: '0.82rem', fontWeight: 600
          }}>
            {badge.label}
          </div>
        </>
      )}

      {/* Streak tip */}
      {streak === 0 && (
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
          Journal today to start your streak!
        </span>
      )}
    </div>
  )
}