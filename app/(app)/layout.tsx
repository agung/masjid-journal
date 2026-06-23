import { BottomNav } from '@/components/layout/bottom-nav'
import { TopBar } from '@/components/layout/top-bar'
import { getActiveOrganizationContext } from '@/lib/auth/guards'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getActiveOrganizationContext()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar orgName={ctx.organization?.name} />
      <main className="pb-safe">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
