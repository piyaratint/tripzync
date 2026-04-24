'use client'

import { signOut } from 'next-auth/react'

interface Props {
  style?: React.CSSProperties
  className?: string
}

export function SignOutButton({ style, className }: Props) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      style={style}
      className={className}
    >
      Sign Out
    </button>
  )
}
