import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { member, organization, session as authSession } from '@/drizzle/schema'
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

export async function getActiveOrganizationContext() {
  const session = await requireAuth()
  const sessionData = session.session as unknown as {
    id?: string
    activeOrganizationId?: string | null
  }

  let activeOrganizationId = sessionData.activeOrganizationId ?? null

  // If no active organization is set, use the first membership as fallback.
  if (!activeOrganizationId) {
    const [firstMembership] = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, session.user.id))
      .limit(1)

    if (firstMembership?.organizationId) {
      activeOrganizationId = firstMembership.organizationId

      // Best effort: persist active org to current session record.
      if (sessionData.id) {
        await db
          .update(authSession)
          .set({ activeOrganizationId, updatedAt: new Date() })
          .where(eq(authSession.id, sessionData.id))
      }
    }
  }

  if (!activeOrganizationId) {
    return {
      session,
      organization: null,
      role: null,
      activeOrganizationId: null,
    }
  }

  const [membership] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, activeOrganizationId)
      )
    )
    .limit(1)

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, activeOrganizationId))
    .limit(1)

  return {
    session,
    organization: org ?? null,
    role: (membership?.role as Role | undefined) ?? null,
    activeOrganizationId,
  }
}

export async function requireOrganization() {
  const ctx = await getActiveOrganizationContext()

  if (!ctx.organization || !ctx.role || !ctx.activeOrganizationId) {
    redirect('/dashboard')
  }

  return {
    ...ctx.session,
    organization: ctx.organization,
    activeOrganizationId: ctx.activeOrganizationId,
    activeOrganizationRole: ctx.role,
  }
}

export async function requireRole(role: Role) {
  const ctx = await getActiveOrganizationContext()

  if (!ctx.organization || !ctx.role || !ctx.activeOrganizationId || !hasMinRole(ctx.role, role)) {
    redirect('/dashboard')
  }

  return {
    ...ctx.session,
    organization: ctx.organization,
    activeOrganizationId: ctx.activeOrganizationId,
    activeOrganizationRole: ctx.role,
  }
}
