'use client'

import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('tripzync_theme') || ''
    const light = stored === 't-arctic'
    setIsLight(light)
    if (light) document.body.className = 't-arctic'
  }, [])

  const toggle = () => {
    const next = !isLight
    setIsLight(next)
    const themeId = next ? 't-arctic' : ''
    document.body.className = themeId
    localStorage.setItem('tripzync_theme', themeId)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className="theme-toggle"
      style={{
        position: 'fixed',
        top: 10,
        right: 200,
        zIndex: 9999,
        height: 32,
        padding: '0 12px',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontSize: 12,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: 'var(--text, #fff)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        transition: 'border-color 0.2s, color 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text, #fff)'
      }}
    >
      {isLight ? '🌙' : '☀️'}
      {isLight ? 'Dark' : 'Light'}
    </button>
  )
}
