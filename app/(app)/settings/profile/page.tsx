import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { ProfileForm } from '@/components/settings/profile-form'
import { db } from '@/lib/db'
import { account } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'

export default async function ProfilePage() {
  const ctx = await getActiveOrganizationContext()
  const { user } = ctx.session

  const [credAccount] = await db
    .select({ password: account.password })
    .from(account)
    .where(and(eq(account.userId, user.id), eq(account.providerId, 'credential')))
    .limit(1)

  const hasPassword = !!credAccount?.password

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <h1 className="text-xl font-bold mb-6">Profil Saya</h1>
      <ProfileForm name={user.name ?? ''} email={user.email} hasPassword={hasPassword} />
    </div>
  )
}
