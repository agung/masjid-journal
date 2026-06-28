'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { organization, member, session as authSession } from '@/drizzle/schema'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import { addMemberSchema, type AddMemberInput } from '@/lib/validations/member'
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
    await db.insert(organization).values({
      id,
      name,
      slug,
      // Let database DEFAULT handle createdAt
    })

    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: id,
      userId: session.user.id,
      role: 'owner',
      // Let database DEFAULT handle createdAt
    })

    const sessionId = (session.session as unknown as { id?: string }).id
    if (sessionId) {
      await db
        .update(authSession)
        .set({ activeOrganizationId: id })
        .where(eq(authSession.id, sessionId))
    }

    revalidatePath('/dashboard')
    revalidatePath('/settings')
    redirect('/dashboard')
  } catch (error) {
    console.error('[createOrganization]', error)
    return { success: false, error: 'Gagal membuat organisasi. Silakan coba lagi.' }
  }
}

export async function updateOrganizationNameAction(formData: FormData): Promise<void> {
  const session = await requireAuth()
  const sessionData = session.session as unknown as { activeOrganizationId?: string | null }
  const orgId = sessionData.activeOrganizationId
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

export async function addMemberAction(
  data: AddMemberInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireRole('owner')
    const orgId = session.activeOrganizationId!

    const validated = addMemberSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? 'Validasi gagal' }
    }

    const { name, email, password, role } = validated.data

    // Check if the user already exists in the system
    const { user: userTable } = await import('@/drizzle/schema')
    const [existingUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1)

    let userId = existingUser?.id

    if (existingUser) {
      // Check if they are already a member of this organization
      const [existingMember] = await db
        .select()
        .from(member)
        .where(and(eq(member.organizationId, orgId), eq(member.userId, existingUser.id)))
        .limit(1)

      if (existingMember) {
        return { success: false, error: 'Pengguna dengan email ini sudah terdaftar sebagai anggota.' }
      }
    } else {
      // User doesn't exist, create them in Better Auth
      const { auth } = await import('@/lib/auth')
      try {
        const signupResult = await auth.api.signUpEmail({
          headers: await headers(),
          body: {
            name,
            email,
            password,
          },
        })
        userId = signupResult.user.id
      } catch (err) {
        console.error('[addMemberAction - signup]', err)
        return { success: false, error: 'Gagal mendaftarkan pengguna baru. Silakan coba lagi.' }
      }
    }

    if (!userId) {
      return { success: false, error: 'Gagal memproses pengguna.' }
    }

    // Link user to the organization
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId,
      role,
    })

    revalidatePath('/settings/members')
    return { success: true }
  } catch (err) {
    console.error('[addMemberAction]', err)
    return { success: false, error: 'Gagal menambahkan anggota. Coba lagi.' }
  }
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
