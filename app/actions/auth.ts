'use server'

import { signIn, signOut } from '@/lib/auth'

export async function googleSignIn() {
  await signIn('google', { redirectTo: '/dashboard' })
}

export async function googleSignOut() {
  await signOut({ redirectTo: '/' })
}
