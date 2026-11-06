import { cache } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { createClerkClient } from '@clerk/backend'
import { env } from 'cloudflare:workers'
import { db } from '@/lib/db'
import { member, organization, user as userTable } from '@/drizzle/schema'
import { hasMinRole, type Role } from '@/lib/auth/roles'

export type AppSession = {
  user: { id: string; name: string; email: string; image: string | null }
  session: { activeOrganizationId: string | null }
}

export const getSession = cache(async (): Promise<AppSession | null> => {
  const requestHeaders = await headers()
  const forwardedProto = requestHeaders.get('x-forwarded-proto')
  const proto = forwardedProto?.split(',')[0]?.trim() || (process.env.NODE_ENV === 'development' ? 'http' : 'https')
  const host = requestHeaders.get('x-forwarded-host')?.split(',')[0]?.trim() || requestHeaders.get('host') || 'localhost:5173'
  const request = new Request(`${proto}://${host}/`, { headers: requestHeaders })
  const client = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    jwtKey: env.CLERK_JWT_KEY,
  })
  const configuredParties = env.NEXT_PUBLIC_APP_URL ? [new URL(env.NEXT_PUBLIC_APP_URL).origin] : []
  if (process.env.NODE_ENV !== 'development' && configuredParties.length === 0) {
    throw new Error('NEXT_PUBLIC_APP_URL must be set to the deployed application origin for Clerk session validation.')
  }
  const authorizedParties = process.env.NODE_ENV === 'development'
    ? [...configuredParties, `${proto}://${host}`]
    : configuredParties
  const state = await client.authenticateRequest(request, {
    ...(authorizedParties.length ? { authorizedParties } : {}),
  })
  if (!state.isAuthenticated) return null
  const { userId } = state.toAuth()
  if (!userId) return null

  const clerkUser = await client.users.getUser(userId)
  const primaryEmail = clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)
  const email = primaryEmail?.emailAddress
  if (!email || primaryEmail?.verification?.status !== 'verified') return null

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email
  const image = clerkUser.imageUrl || null
  const [byClerkId] = await db.select().from(userTable).where(eq(userTable.clerkId, userId)).limit(1)
  let appUser = byClerkId

  if (!appUser) {
    const [byEmail] = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1)
    if (byEmail) {
      if (byEmail.clerkId && byEmail.clerkId !== userId) return null
      await db.update(userTable).set({ clerkId: userId, name, image, email, updatedAt: new Date() }).where(eq(userTable.id, byEmail.id))
      appUser = { ...byEmail, clerkId: userId, name, image, email }
    } else {
      const newUser = {
        id: crypto.randomUUID(), clerkId: userId, name, email, image,
        emailVerified: true, createdAt: new Date(), updatedAt: new Date(), activeOrganizationId: null,
      }
      await db.insert(userTable).values(newUser)
      appUser = newUser
    }
  } else if (appUser.email !== email || appUser.name !== name || appUser.image !== image) {
    await db.update(userTable).set({ email, name, image, updatedAt: new Date() }).where(eq(userTable.id, appUser.id))
    appUser = { ...appUser, email, name, image }
  }

  return {
    user: { id: appUser.id, name: appUser.name, email: appUser.email, image: appUser.image },
    session: { activeOrganizationId: appUser.activeOrganizationId },
  }
})

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return session
}

// cache() memoizes per-request: layout + page calling this gets the same result
// without any additional DB queries.
export const getActiveOrganizationContext = cache(async function getActiveOrganizationContext() {
  const session = await requireAuth()
  let activeOrganizationId = session.session.activeOrganizationId ?? null

  // If no active organization is set, use the first membership as fallback.
  if (!activeOrganizationId) {
    const [firstMembership] = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, session.user.id))
      .limit(1)

    if (firstMembership?.organizationId) {
      activeOrganizationId = firstMembership.organizationId

      await db.update(userTable).set({ activeOrganizationId }).where(eq(userTable.id, session.user.id))
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

  // Run membership + organization queries in parallel to save one round-trip.
  const [[membership], [org]] = await Promise.all([
    db
      .select({ role: member.role })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, activeOrganizationId)
        )
      )
      .limit(1),
    db
      .select()
      .from(organization)
      .where(eq(organization.id, activeOrganizationId))
      .limit(1),
  ])

  return {
    session,
    organization: org ?? null,
    role: (membership?.role as Role | undefined) ?? null,
    activeOrganizationId,
  }
})

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
