'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { organization, member, session as authSession } from '@/drizzle/schema'
import { requireAuth } from '@/lib/auth/guards'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createOrganizationAction(formData: FormData) {
  const session = await requireAuth()
  const name = String(formData.get('name') ?? '').trim()

  if (!name) {
    return { success: false, error: 'Nama masjid wajib diisi' }
  }

  const id = crypto.randomUUID()
  const slugBase = slugify(name) || 'masjid'
  const slug = `${slugBase}-${id.slice(0, 6)}`
  const now = new Date()

  await db.insert(organization).values({
    id,
    name,
    slug,
    createdAt: now,
  })

  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId: id,
    userId: session.user.id,
    role: 'owner',
    createdAt: now,
  })

  const sessionId = (session.session as unknown as { id?: string }).id
  if (sessionId) {
    await db
      .update(authSession)
      .set({ activeOrganizationId: id, updatedAt: now })
      .where(eq(authSession.id, sessionId))
  }

  revalidatePath('/dashboard')
  revalidatePath('/settings')
  redirect('/dashboard')
}

export async function updateOrganizationNameAction(formData: FormData) {
  const session = await requireAuth()
  const sessionData = session.session as unknown as { activeOrganizationId?: string | null }
  const orgId = sessionData.activeOrganizationId
  const name = String(formData.get('name') ?? '').trim()

  if (!orgId || !name) return { success: false, error: 'Data tidak lengkap' }

  await db.update(organization).set({ name }).where(eq(organization.id, orgId))
  revalidatePath('/settings/organization')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function listMembers(organizationId: string) {
  const { user } = await import('@/drizzle/schema')
  return db
    .select({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      userId: member.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId))
}
