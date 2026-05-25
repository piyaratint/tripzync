import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TopNav } from '@/components/ui/TopNav'

// Auth check requires a live DB + session cookie — can never be static
export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  return (
    <>
      <TopNav name={session.user?.name} email={session.user?.email} image={session.user?.image} />
      <div style={{ paddingTop: 52 }}>{children}</div>
    </>
  )
}
