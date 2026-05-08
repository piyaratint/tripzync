'use client'

import { useState, useEffect } from 'react'

const THEMES = [
  {
    id: '',
    name: 'Midnight',
    desc: 'Deep Navy · Cyan · Gold',
    bg: '#07080F', accent: '#00D4FF', hi: '#FFC947',
  },
  {
    id: 't-obsidian',
    name: 'Obsidian',
    desc: 'Charcoal · Violet · Amber',
    bg: '#09090B', accent: '#A78BFA', hi: '#F59E0B',
  },
  {
    id: 't-ember',
    name: 'Ember',
    desc: 'Warm Dark · Orange · Gold',
    bg: '#0D0906', accent: '#FF7B2F', hi: '#FFD447',
  },
  {
    id: 't-arctic',
    name: 'Arctic',
    desc: 'Light Mode · Blue · Coral',
    bg: '#F0F4FF', accent: '#0066FF', hi: '#FF6B35',
  },
  {
    id: 't-forest',
    name: 'Forest',
    desc: 'Deep Green · Neon · Yellow',
    bg: '#050F09', accent: '#00E676', hi: '#FFEB3B',
  },
  {
    id: 't-neon',
    name: 'Neon Rave',
    desc: 'Deep Purple · Fuchsia · Cyan',
    bg: '#06000F', accent: '#E040FB', hi: '#00E5FF',
  },
]

export default function SettingsPage() {
  const [activeTheme, setActiveTheme] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('tripzync_theme') || ''
    setActiveTheme(stored)
    applyTheme(stored)
  }, [])

  const applyTheme = (id: string) => {
    document.body.className = id
  }

  const handleTheme = (id: string) => {
    setActiveTheme(id)
    applyTheme(id)
    localStorage.setItem('tripzync_theme', id)
    setSaved(false)
    // Future: POST to /api/user/preferences
  }

  const handleSave = async () => {
    // Persist to server when API is available
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page">
      <header style={{ padding: '48px 0 32px', borderBottom: '1px solid var(--border)', marginBottom: '40px' }}>
        <div className="hero-eyebrow">
          <div className="eyebrow-dots"><span /><span className="r" /><span /></div>
          <span className="eyebrow-text">TripZync® · Settings</span>
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed'", fontSize: 'clamp(40px,8vw,72px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 0.9, marginTop: 8 }}>
          App <em style={{ color: 'var(--red)' }}>Settings</em>
        </h1>
      </header>

      {/* Theme / Vibe Section */}
      <section style={{ maxWidth: 820, marginBottom: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div className="section-line" style={{ flex: 'none', width: 32 }} />
          <span className="section-label">Theme / Vibe</span>
          <div className="section-line" />
        </div>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: 'var(--dim)', marginBottom: 24, letterSpacing: 1 }}>
          Pick your visual style — applied instantly across the whole app.
        </p>

        <div className="ob-theme-grid">
          {THEMES.map(t => (
            <div
              key={t.id}
              className={`ob-theme-card${activeTheme === t.id ? ' active' : ''}`}
              style={{
                background: t.bg,
                borderColor: activeTheme === t.id ? t.accent : 'rgba(255,255,255,.08)',
                cursor: 'pointer',
              }}
              onClick={() => handleTheme(t.id)}
            >
              <div className="ob-theme-name" style={{ color: t.accent }}>{t.name}</div>
              <div className="ob-theme-desc" style={{ color: '#fff' }}>{t.desc}</div>
              <div className="ob-theme-swatches">
                <div className="ob-theme-swatch" style={{ background: t.bg, border: '1px solid rgba(255,255,255,.2)' }} />
                <div className="ob-theme-swatch" style={{ background: t.accent }} />
                <div className="ob-theme-swatch" style={{ background: t.hi }} />
              </div>
              {activeTheme === t.id && (
                <div style={{ marginTop: 10, fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: 2, color: t.accent, textTransform: 'uppercase' }}>
                  ✓ Active
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={handleSave}
            style={{
              background: 'var(--red)', color: '#fff', border: 'none',
              borderRadius: 10, padding: '12px 28px',
              fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700,
              letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
              transition: 'background .2s',
            }}
          >
            {saved ? 'Saved ✓' : 'Save Preferences'}
          </button>
          <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, letterSpacing: '.1em', color: '#fff', textTransform: 'uppercase' }}>
            Theme applies immediately
          </span>
        </div>
      </section>

      {/* Divider */}
      <div className="section-head" style={{ marginBottom: 32 }}>
        <div className="section-line" />
        <span className="section-label">Account</span>
        <div className="section-line" />
      </div>

      <section style={{ maxWidth: 480, marginBottom: 60 }}>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: 'var(--dim)', marginBottom: 20 }}>
          Manage your TripZync account and connected services.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', color: '#fff' }}>
              Connected via Google OAuth
            </span>
            <span style={{ fontSize: 18 }}>🔗</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', color: '#fff' }}>
              Hotel Loyalty Programmes
            </span>
            <a href="/dashboard" style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--red)', textDecoration: 'none' }}>
              Manage →
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
