import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import JournalPage from './pages/JournalPage'
import InsightsPage from './pages/InsightsPage'
import RecoveryPage from './pages/RecoveryPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import CalmPage from './pages/CalmPage'
import Navbar from './components/Navbar'
import { Cloud, Leaf, Star, Wind } from 'lucide-react'

// ── Background Visuals Component ─────────────────────────────────────────────
function BackgroundVisuals() {
  return (
    <div className="bg-visuals">
      {/* Organic Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      <div className="blob blob-4"></div>
      <div className="blob blob-5"></div>
      <div className="blob blob-6"></div>

      {/* Tiny Sparkles */}
      {[...Array(10)].map((_, i) => (
        <div key={`s-${i}`} className="sparkle" style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`
        }} />
      ))}

      {/* Calming Emojis */}
      {[
        { e: '✨', t: '5%', l: '15%' }, { e: '☁️', t: '20%', r: '10%' },
        { e: '🌸', b: '15%', l: '8%' }, { e: '🌿', b: '10%', r: '20%' },
        { e: '✨', t: '45%', r: '5%' }, { e: '🌙', t: '80%', l: '40%' },
        { e: '✨', b: '30%', r: '40%' }, { e: '🦋', t: '60%', l: '15%' },
        { e: '🍵', b: '40%', l: '25%' }, { e: '🕯️', t: '30%', l: '50%' },
        { e: '🦢', b: '5%', r: '45%' }, { e: '🌊', t: '15%', l: '35%' },
        { e: '🌸', t: '70%', r: '10%' }
      ].map((item, i) => (
        <div key={`e-${i}`} className="emoji-bg" style={{
          top: item.t, left: item.l, right: item.r, bottom: item.b,
          animationDelay: `${i * -3}s`,
          fontSize: i % 3 === 0 ? '22px' : i % 3 === 1 ? '30px' : '18px'
        }}>{item.e}</div>
      ))}

      {/* Subtle Mood Icons */}
      <Cloud className="mood-icon-bg" size={120} style={{ top: '15%', left: '10%' }} />
      <Leaf className="mood-icon-bg" size={80} style={{ top: '65%', right: '15%', animationDelay: '-10s' }} />
      <Star className="mood-icon-bg" size={40} style={{ bottom: '20%', left: '30%', animationDelay: '-20s' }} />
      <Cloud className="mood-icon-bg" size={100} style={{ top: '40%', right: '30%', animationDelay: '-40s' }} />
    </div>
  )
}
import './index.css'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [username, setUsername] = useState(null)
  const [userEmail, setUserEmail] = useState(null)

  useEffect(() => {
    // Check if user has auth token on mount
    const authToken = sessionStorage.getItem('authToken')
    const storedUsername = sessionStorage.getItem('username')
    const storedEmail = sessionStorage.getItem('userEmail')
    const theme = localStorage.getItem('theme') || 'light'
    
    // Apply theme
    if (theme === 'dark') {
      document.body.classList.add('dark-mode')
    }
    
    // Check if we have proper authentication
    // Must have both authToken AND username (for new system)
    if (authToken && storedUsername) {
      setIsAuthenticated(true)
      setUsername(storedUsername)
      setUserEmail(storedEmail)
    } else {
      // Clear old/invalid data and redirect to login
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('userEmail')
      sessionStorage.removeItem('username')
      window.location.href = '/LoginPage.html'
    }
    setIsChecking(false)
    
    // Clean up auth when page is closed/refreshed
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('username')
      sessionStorage.removeItem('userEmail')
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const navigate = (page) => setCurrentPage(page)

  const handleLogout = () => {
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('userEmail')
    sessionStorage.removeItem('username')
    setIsAuthenticated(false)
    window.location.href = '/LoginPage.html'
  }

  // Show loading while checking auth
  if (isChecking) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} />
  }

  // Should not reach here if not authenticated (redirected above)
  if (!isAuthenticated) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} />
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Background Visuals (rendered on all internal pages) */}
      <BackgroundVisuals />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {currentPage !== 'landing' && currentPage !== 'profile-settings' && (
          <Navbar currentPage={currentPage} navigate={navigate} onLogout={handleLogout} username={username} userEmail={userEmail} />
        )}

        <AnimatePresence mode="wait">
          <motion.div key={currentPage} variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {currentPage === 'landing' && <LandingPage navigate={navigate} onLogout={handleLogout} />}
            {currentPage === 'dashboard' && <Dashboard navigate={navigate} analysisResult={analysisResult} />}
            {currentPage === 'journal' && <JournalPage navigate={navigate} setAnalysisResult={setAnalysisResult} />}
            {currentPage === 'insights' && <InsightsPage navigate={navigate} />}
            {currentPage === 'recovery' && <RecoveryPage navigate={navigate} analysisResult={analysisResult} />}
            {currentPage === 'calm' && <CalmPage navigate={navigate} />}
            {currentPage === 'profile-settings' && <ProfileSettingsPage navigate={navigate} onLogout={handleLogout} username={username} userEmail={userEmail} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App