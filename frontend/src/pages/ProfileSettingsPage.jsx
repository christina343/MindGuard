import { motion } from 'framer-motion'
import { ArrowLeft, User, Mail, Lock, Sun, Moon, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ProfileSettingsPage({ username, userEmail, navigate, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [loading, setLoading] = useState(false)

  // Ensure CSS variables are applied when component mounts
  useEffect(() => {
    // Trigger a small reflow to ensure styles are applied
    window.dispatchEvent(new Event('resize'))
  }, [activeTab])

  const handleChangePassword = async () => {
    setMessage('')
    setMessageType('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('All fields are required')
      setMessageType('error')
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match')
      setMessageType('error')
      return
    }

    if (newPassword.length < 6) {
      setMessage('New password must be at least 6 characters')
      setMessageType('error')
      return
    }

    if (newPassword === currentPassword) {
      setMessage('New password cannot be the same as current password')
      setMessageType('error')
      return
    }

    setLoading(true)
    try {
      // Call backend to change password
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          username,
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Password changed successfully!')
        setMessageType('success')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(data.message || 'Failed to change password')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error changing password: ' + error.message)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: theme === 'dark' ? Moon : Sun }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingTop: '40px',
        paddingBottom: '40px'
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          <motion.button
            onClick={() => navigate('dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid var(--border)`,
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '32px', fontWeight: 700 }}>
            Profile Settings
          </h1>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            borderBottom: `1px solid var(--border)`,
            paddingBottom: '0'
          }}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: activeTab === id
                  ? 'transparent'
                  : 'transparent',
                border: activeTab === id
                  ? `2px solid var(--accent-purple)`
                  : '2px solid transparent',
                borderBottom: activeTab === id
                  ? `2px solid var(--accent-purple)`
                  : `1px solid transparent`,
                color: activeTab === id ? 'var(--accent-purple)' : 'var(--text-secondary)',
                padding: '12px 16px',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
            >
              <Icon size={16} />
              {label}
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          key={activeTab}
        >
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: `1px solid var(--border)`
                }}
              >
                <h2 style={{ color: 'var(--text-primary)', marginBottom: '24px', fontSize: '20px', fontWeight: 600 }}>
                  Account Information
                </h2>

                {/* Username */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Username
                  </label>
                  <div style={{
                    background: 'var(--bg-primary)',
                    border: `1px solid var(--border)`,
                    borderRadius: '8px',
                    padding: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    {username}
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    <Mail size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Email Address
                  </label>
                  <div style={{
                    background: 'var(--bg-primary)',
                    border: `1px solid var(--border)`,
                    borderRadius: '8px',
                    padding: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    {userEmail}
                  </div>
                </div>


              </motion.div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                padding: '24px',
                border: `1px solid var(--border)`
              }}
            >
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '24px', fontSize: '20px', fontWeight: 600 }}>
                <Lock size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Change Password
              </h2>

              {/* Current Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid var(--border)`,
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid var(--border)`,
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid var(--border)`,
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: messageType === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: messageType === 'success' ? '#22c55e' : '#ef4444',
                    fontSize: '13px',
                    marginBottom: '16px',
                    border: `1px solid ${messageType === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                  }}
                >
                  {message}
                </motion.div>
              )}

              {/* Update Button */}
              <motion.button
                onClick={handleChangePassword}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading
                    ? 'rgba(139,92,246,0.5)'
                    : 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-mauve) 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </motion.button>
            </motion.div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Theme Preference */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: `1px solid var(--border)`
                }}
              >
                <h2 style={{ color: 'var(--text-primary)', marginBottom: '24px', fontSize: '20px', fontWeight: 600 }}>
                  Display Settings
                </h2>

                {/* Theme Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'var(--bg-primary)',
                  borderRadius: '8px',
                  border: `1px solid var(--border)`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {theme === 'dark' ? (
                      <Moon size={20} style={{ color: 'var(--accent-purple)' }} />
                    ) : (
                      <Sun size={20} style={{ color: 'var(--accent-yellow)' }} />
                    )}
                    <div>
                      <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    onClick={toggleTheme}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-mauve) 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: 'inherit'
                    }}
                  >
                    Toggle Theme
                  </motion.button>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '12px', fontStyle: 'italic' }}>
                  Your theme preference will be saved automatically and applied across the app.
                </p>
              </motion.div>


            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
