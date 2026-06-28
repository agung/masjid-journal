'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, gt } from 'drizzle-orm'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { invitation, member, organization, session as authSession } from '@/drizzle/schema'
import { requireRole, requireAuth } from '@/lib/auth/guards'
import { z } from 'zod'

const createInviteSchema = z.object({
  email: z.string().email('Format email tidak valid').optional().or(z.literal('any')),
  role: z.enum(['owner', 'admin', 'treasurer', 'viewer'], {
    required_error: 'Peran wajib dipilih',
  }),
})

export async function createInvitationAction(data: {
  email?: string
  role: string
}): Promise<{ success: true; token: string } | { success: false; error: string }> {
  try {
    const session = await requireRole('owner')
    const orgId = session.activeOrganizationId!

    const validated = createInviteSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? 'Validasi gagal' }
    }

    const { email = 'any', role } = validated.data

    if (email !== 'any') {
      // Check if user is already a member
      const { user: userTable } = await import('@/drizzle/schema')
      const [existingUser] = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1)

      if (existingUser) {
        const [existingMember] = await db
          .select()
          .from(member)
          .where(and(eq(member.organizationId, orgId), eq(member.userId, existingUser.id)))
          .limit(1)

        if (existingMember) {
          return { success: false, error: 'Pengguna dengan email ini sudah menjadi anggota organisasi.' }
        }
      }

      // Check if there is already an active pending invitation for this email
      const [existingInvite] = await db
        .select()
        .from(invitation)
        .where(
          and(
            eq(invitation.organizationId, orgId),
            eq(invitation.email, email),
            eq(invitation.status, 'pending'),
            gt(invitation.expiresAt, new Date())
          )
        )
        .limit(1)

      if (existingInvite) {
        return { success: false, error: 'Undangan aktif untuk email ini sudah dibuat sebelumnya.' }
      }
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.insert(invitation).values({
      id: token,
      organizationId: orgId,
      email,
      role,
      status: 'pending',
      expiresAt,
      inviterId: session.user.id,
    })

    revalidatePath('/settings/members')
    return { success: true, token }
  } catch (err) {
    console.error('[createInvitationAction]', err)
    return { success: false, error: 'Gagal membuat undangan. Silakan coba lagi.' }
  }
}

export async function listInvitationsAction(): Promise<
  Array<{
    id: string
    email: string
    role: string
    status: string
    expiresAt: Date
  }>
> {
  try {
    const session = await requireRole('owner')
    const orgId = session.activeOrganizationId!

    const list = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .where(
        and(
          eq(invitation.organizationId, orgId),
          eq(invitation.status, 'pending'),
          gt(invitation.expiresAt, new Date())
        )
      )

    return list as Array<{
      id: string
      email: string
      role: string
      status: string
      expiresAt: Date
    }>
  } catch (err) {
    console.error('[listInvitationsAction]', err)
    return []
  }
}

export async function cancelInvitationAction(
  invitationId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireRole('owner')
    const orgId = session.activeOrganizationId!

    await db
      .delete(invitation)
      .where(and(eq(invitation.id, invitationId), eq(invitation.organizationId, orgId)))

    revalidatePath('/settings/members')
    return { success: true }
  } catch (err) {
    console.error('[cancelInvitationAction]', err)
    return { success: false, error: 'Gagal membatalkan undangan.' }
  }
}

export async function getInvitationAction(
  token: string
): Promise<
  | { success: true; email: string; role: string; organizationName: string }
  | { success: false; error: string }
> {
  try {
    const [invite] = await db
      .select({
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        orgName: organization.name,
      })
      .from(invitation)
      .innerJoin(organization, eq(invitation.organizationId, organization.id))
      .where(eq(invitation.id, token))
      .limit(1)

    if (!invite) {
      return { success: false, error: 'Tautan undangan tidak valid atau tidak ditemukan.' }
    }

    if (invite.status !== 'pending' || invite.expiresAt.getTime() < Date.now()) {
      return { success: false, error: 'Tautan undangan telah kedaluwarsa atau sudah digunakan.' }
    }

    return {
      success: true,
      email: invite.email,
      role: invite.role ?? 'treasurer',
      organizationName: invite.orgName,
    }
  } catch (err) {
    console.error('[getInvitationAction]', err)
    return { success: false, error: 'Terjadi kesalahan saat memproses undangan.' }
  }
}

export async function acceptInvitationAction(
  token: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireAuth()
    const userId = session.user.id
    const userEmail = session.user.email

    const [invite] = await db
      .select()
      .from(invitation)
      .where(eq(invitation.id, token))
      .limit(1)

    if (!invite) {
      return { success: false, error: 'Undangan tidak ditemukan.' }
    }

    if (invite.status !== 'pending' || invite.expiresAt.getTime() < Date.now()) {
      return { success: false, error: 'Undangan tidak valid atau sudah kedaluwarsa.' }
    }

    if (invite.email !== 'any' && invite.email.toLowerCase().trim() !== userEmail.toLowerCase().trim()) {
      return {
        success: false,
        error: `Undangan ini ditujukan untuk email ${invite.email}, tetapi Anda masuk sebagai ${userEmail}.`,
      }
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, invite.organizationId), eq(member.userId, userId)))
      .limit(1)

    await db.transaction(async (trx) => {
      if (!existingMember) {
        // Link user to organization
        await trx.insert(member).values({
          id: crypto.randomUUID(),
          organizationId: invite.organizationId,
          userId,
          role: invite.role ?? 'treasurer',
          createdAt: new Date(),
        })
      }

      // Mark invitation as accepted
      await trx
        .update(invitation)
        .set({ status: 'accepted' })
        .where(eq(invitation.id, token))

      // Update user's active session's organization
      const sessionId = (session.session as unknown as { id?: string }).id
      if (sessionId) {
        await trx
          .update(authSession)
          .set({ activeOrganizationId: invite.organizationId, updatedAt: new Date() })
          .where(eq(authSession.id, sessionId))
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/settings/members')
    return { success: true }
  } catch (err) {
    console.error('[acceptInvitationAction]', err)
    return { success: false, error: 'Gagal menerima undangan. Coba lagi.' }
  }
}
