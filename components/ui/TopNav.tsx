'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useEffect } from 'react'

interface Props {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function TopNav({ name, email, image }: Props) {
  const displayName = name ?? email ?? ''
  const initial = displayName[0]?.toUpperCase() ?? '?'

  // Apply stored theme on mount
  useEffect(() => {
    const theme = localStorage.getItem('tripzync_theme') || ''
    if (theme) document.body.className = theme
  }, [])

  return (
    <nav className="top-nav">
      <Link href="/dashboard" className="top-nav-logo">
        <div className="eyebrow-dots">
          <span />
          <span className="r" />
          <span />
        </div>
        <span className="eyebrow-text">TripZync® · {new Date().getFullYear()}</span>
      </Link>

      <div className="top-nav-user">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={displayName} className="top-nav-avatar" />
        ) : (
          <div className="top-nav-avatar top-nav-avatar-fallback">{initial}</div>
        )}
        <span className="top-nav-name">{displayName}</span>
        <Link
          href="/settings"
          className="top-nav-signout"
          style={{ marginRight: 4 }}
          title="Settings"
        >
          Settings
        </Link>
        <button
          className="top-nav-signout"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
