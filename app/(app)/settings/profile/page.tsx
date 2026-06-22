import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { ProfileForm } from '@/components/settings/profile-form'

export default async function ProfilePage() {
  const ctx = await getActiveOrganizationContext()
  const { user } = ctx.session

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <h1 className="text-xl font-bold mb-6">Profil Saya</h1>
      <ProfileForm name={user.name ?? ''} email={user.email} />
    </div>
  )
}
