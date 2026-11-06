import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { ClerkProfile } from '@/components/auth/clerk-profile'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const ctx = await getActiveOrganizationContext()

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <h1 className="text-xl font-bold mb-6">Profil Saya</h1>
      <ClerkProfile />
    </div>
  )
}
