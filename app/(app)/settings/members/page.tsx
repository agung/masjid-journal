import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { listMembers } from '@/lib/server/organizations'
import { listInvitationsAction } from '@/lib/server/invitations'
import { redirect } from 'next/navigation'
import { MemberManager } from '@/components/organization/member-manager'

export default async function MembersPage() {
  const ctx = await getActiveOrganizationContext()

  if (!ctx.organization || !ctx.activeOrganizationId) {
    redirect('/dashboard')
  }

  const [members, invitations] = await Promise.all([
    listMembers(ctx.activeOrganizationId),
    listInvitationsAction(),
  ])
  const isOwner = ctx.role === 'owner'
  const currentUserId = ctx.session.user.id

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <MemberManager
        initialMembers={members}
        initialInvitations={invitations}
        isOwner={isOwner}
        currentUserId={currentUserId}
      />
    </div>
  )
}
