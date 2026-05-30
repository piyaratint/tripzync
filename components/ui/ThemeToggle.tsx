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
        top: 12,
        left: 195,
        zIndex: 9999,
        height: 28,
        padding: '0 10px',
        borderRadius: 14,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        fontSize: 11,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color: 'var(--muted, rgba(255,255,255,.5))',
        transition: 'border-color 0.2s, color 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted, rgba(255,255,255,.5))'
      }}
    >
      {isLight ? '🌙' : '☀️'}
      {isLight ? 'Dark' : 'Light'}
    </button>
  )
}
