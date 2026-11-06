'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { organization, member, user } from '@/drizzle/schema'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { type Role } from '@/lib/auth/roles'

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

  try {
    // Create the organization, owner membership and active organization together.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statements: [any, ...any[]] = [
      db.insert(organization).values({ id, name, slug }),
      db.insert(member).values({ id: crypto.randomUUID(), organizationId: id, userId: session.user.id, role: 'owner' }),
      db.update(user).set({ activeOrganizationId: id }).where(eq(user.id, session.user.id)),
    ]
    await db.batch(statements)
  } catch (error) {
    console.error('[createOrganization]', error)
    return { success: false, error: 'Gagal membuat organisasi. Silakan coba lagi.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/settings')
  redirect('/dashboard')
}

export async function updateOrganizationNameAction(formData: FormData): Promise<void> {
  const session = await requireAuth()
  const orgId = session.session.activeOrganizationId
  const name = String(formData.get('name') ?? '').trim()

  if (!orgId || !name) return

  await db.update(organization).set({ name }).where(eq(organization.id, orgId))
  revalidatePath('/settings/organization')
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  redirect('/settings/organization?saved=1')
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

export async function updateMemberRoleAction(
  memberId: string,
  newRole: Role
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireRole('owner')
    const orgId = session.activeOrganizationId!

    // Find the member record
    const [existingMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.id, memberId), eq(member.organizationId, orgId)))
      .limit(1)

    if (!existingMember) {
      return { success: false, error: 'Anggota tidak ditemukan.' }
    }

    // Check if the owner is trying to edit their own role
    if (existingMember.userId === session.user.id) {
      return { success: false, error: 'Anda tidak dapat mengubah peran Anda sendiri.' }
    }

    // Update the role
    await db
      .update(member)
      .set({ role: newRole })
      .where(eq(member.id, memberId))

    revalidatePath('/settings/members')
    return { success: true }
  } catch (err) {
    console.error('[updateMemberRoleAction]', err)
    return { success: false, error: 'Gagal mengubah peran anggota. Coba lagi.' }
  }
}

export async function removeMemberAction(
  memberId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireRole('owner')
    const orgId = session.activeOrganizationId!

    // Find the member record
    const [existingMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.id, memberId), eq(member.organizationId, orgId)))
      .limit(1)

    if (!existingMember) {
      return { success: false, error: 'Anggota tidak ditemukan.' }
    }

    // Check if the owner is trying to remove themselves
    if (existingMember.userId === session.user.id) {
      return { success: false, error: 'Anda tidak dapat mengeluarkan diri Anda sendiri dari organisasi.' }
    }

    // Delete membership link
    await db
      .delete(member)
      .where(eq(member.id, memberId))

    revalidatePath('/settings/members')
    return { success: true }
  } catch (err) {
    console.error('[removeMemberAction]', err)
    return { success: false, error: 'Gagal mengeluarkan anggota. Coba lagi.' }
  }
}
