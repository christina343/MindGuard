import { motion } from 'framer-motion'
import { Brain, ArrowRight, Shield, TrendingUp, Zap, ShieldAlert, Award, LifeBuoy } from 'lucide-react'
import BrainOrb from '../components/BrainOrb'

const features = [
  { icon: Brain, title: 'NLP Journal Analysis', desc: 'AI reads your words and extracts emotional patterns, stress signals, and cognitive load in real time.' },
  { icon: ShieldAlert, title: 'Smart Masking Detection', desc: 'Advanced AI flags contradictions between a positive writing tone and hidden stress-masking keywords.' },
  { icon: LifeBuoy, title: 'Direct Crisis Support', desc: 'Integrated emergency reach-out for severe cases, connecting you instantly to university counseling resources.' },
  { icon: Shield, title: 'Burnout Prediction', desc: 'ML model predicts your burnout risk with explainable AI — you always know exactly WHY.' },
  { icon: Zap, title: 'Smart Recovery Plans', desc: 'Personalized daily plans — morning to night — adapted to your exact psychological condition.' },
]

function CalmWave() {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: '40px', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0 }}>
        {/* Deep Wave */}
        <motion.path
          initial={{ d: "M0,100 C150,150 350,50 500,100 C650,150 850,50 1000,100 L1000,200 L0,200 Z" }}
          animate={{
            d: [
              "M0,100 C150,150 350,50 500,100 C650,150 850,50 1000,100 L1000,200 L0,200 Z",
              "M0,100 C150,50 350,150 500,100 C650,50 850,150 1000,100 L1000,200 L0,200 Z",
              "M0,100 C150,150 350,50 500,100 C650,150 850,50 1000,100 L1000,200 L0,200 Z"
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          fill="rgba(139, 92, 246, 0.1)"
        />
        {/* Mid Wave */}
        <motion.path
          initial={{ d: "M0,120 C200,80 400,160 600,120 C800,80 1000,160 1000,120 L1000,200 L0,200 Z" }}
          animate={{
            d: [
              "M0,120 C200,80 400,160 600,120 C800,80 1000,160 1000,120 L1000,200 L0,200 Z",
              "M0,120 C200,160 400,80 600,120 C800,160 1000,80 1000,120 L1000,200 L0,200 Z",
              "M0,120 C200,80 400,160 600,120 C800,80 1000,160 1000,120 L1000,200 L0,200 Z"
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          fill="rgba(139, 92, 246, 0.15)"
        />
        {/* Top Wave */}
        <motion.path
          initial={{ d: "M0,140 C250,180 500,100 750,140 C1000,180 1250,100 1500,140 L1000,200 L0,200 Z" }}
          animate={{
            d: [
              "M0,140 C250,180 500,100 750,140 C1000,180 1250,100 1500,140 L1000,200 L0,200 Z",
              "M0,140 C250,100 500,180 750,140 C1000,100 1250,180 1500,140 L1000,200 L0,200 Z",
              "M0,140 C250,180 500,100 750,140 C1000,180 1250,100 1500,140 L1000,200 L0,200 Z"
            ]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          fill="url(#waveGradient)"
        />
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="var(--accent-mauve)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export default function LandingPage({ navigate }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.1) 0%, transparent 70%)',
        padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          style={{ position: 'relative', zIndex: 1, maxWidth: '900px' }}>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
            <span className="glow-text">Predict. Prevent.</span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>Recover.</span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.7 }}>
            MindGuard uses AI and NLP to detect early burnout signs with intelligent safety guardrails.
            Get perceptive insights and professional support before exhaustion takes over.
          </p>

          {/* Calm Wave Animation */}
          <div style={{ margin: '0 auto 3rem', width: '100%', maxWidth: '600px', height: '160px', position: 'relative' }}>
            <CalmWave />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(59,130,246,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('journal')}
              className="btn-primary"
              style={{ padding: '14px 32px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Start Analysis <ArrowRight size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('dashboard')}
              style={{
                padding: '14px 32px', fontSize: '1rem',
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: '12px', color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', transition: 'all 0.3s'
              }}>
              View Dashboard
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <div style={{ padding: '6rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <motion.h2
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: '3rem' }}>
          Everything you need to <span className="glow-text">stay ahead of burnout</span>
        </motion.h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={i} className="glass-card"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: 'var(--glow-blue)' }}
              style={{ padding: '2rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
              }}>
                <Icon size={22} style={{ color: 'var(--accent-purple)' }} />
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}