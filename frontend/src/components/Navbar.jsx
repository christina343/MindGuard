import { motion } from 'framer-motion'
import { Brain, LayoutDashboard, BookOpen, TrendingUp, Calendar, LogOut, User, Moon, Sun, Settings, Wind } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'insights', label: 'Insights', icon: TrendingUp },
  { id: 'recovery', label: 'Recovery', icon: Calendar },
  { id: 'calm', label: 'Calm', icon: Wind },
]

export default function Navbar({ currentPage, navigate, onLogout, username, userEmail }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Apply or remove dark-mode class from body
    if (newTheme === 'dark') {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid var(--border)`,
        padding: '0 2rem',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={() => navigate('landing')}>
        <Brain size={24} style={{ color: 'var(--accent-purple)' }} />
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }} className="glow-text">MindGuard</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            onClick={() => navigate(id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: currentPage === id
                ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(192,132,252,0.15))'
                : 'transparent',
              border: currentPage === id ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
              borderRadius: '10px',
              color: currentPage === id ? 'var(--accent-purple)' : 'var(--text-secondary)',
              padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: '6px',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <Icon size={16} />
            {label}
          </motion.button>
        ))}

        {username && (
          <div style={{
            marginLeft: '20px',
            paddingLeft: '20px',
            borderLeft: `1px solid var(--border)`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative'
          }}>
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid var(--border)`,
                borderRadius: '8px',
                color: 'var(--accent-purple)',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </motion.button>

            {/* Profile Dropdown Button */}
            <div style={{ position: 'relative' }}>
              <motion.button
                onClick={() => setProfileOpen(!profileOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid var(--border)`,
                  borderRadius: '50%',
                  color: 'var(--accent-purple)',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                <User size={18} />
              </motion.button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: '50px',
                    right: 0,
                    background: 'var(--bg-secondary)',
                    border: `1px solid var(--border)`,
                    borderRadius: '12px',
                    minWidth: '240px',
                    padding: '12px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    zIndex: 1000
                  }}
                >
                  {/* Username Display */}
                  <div style={{
                    padding: '10px 12px',
                    borderBottom: `1px solid var(--border)`,
                    marginBottom: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    {username}
                  </div>

                  {/* Settings Option */}
                  <motion.button
                    onClick={() => {
                      navigate('profile-settings')
                      setProfileOpen(false)
                    }}
                    whileHover={{ background: 'var(--bg-card)' }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                  >
                    <Settings size={16} />
                    Profile Settings
                  </motion.button>

                  {/* Logout */}
                  <motion.button
                    onClick={() => {
                      setProfileOpen(false)
                      onLogout()
                    }}
                    whileHover={{ background: 'rgba(239,68,68,0.15)' }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.85rem',
                      marginTop: '8px',
                      paddingTop: '12px',
                      borderTop: `1px solid var(--border)`,
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                  >
                    <LogOut size={16} />
                    Logout
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  )
}