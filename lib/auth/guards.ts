import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { hasMinRole, type Role } from '@/lib/auth/roles'

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return session
}

export async function requireRole(role: Role) {
  const session = await requireAuth()

  // Better Auth organization plugin stores active organization role in session data.
  // Exact shape is plugin-driven, so we keep this guarded and explicit.
  const activeMember = (session.session as unknown as {
    activeOrganizationId?: string
    activeOrganizationRole?: Role
  })

  const currentRole = activeMember.activeOrganizationRole

  if (!currentRole || !hasMinRole(currentRole, role)) {
    redirect('/dashboard')
  }

  return {
    ...session,
    activeOrganizationId: activeMember.activeOrganizationId,
    activeOrganizationRole: currentRole,
  }
}
