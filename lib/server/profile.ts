'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { account } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'

const updateNameSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama terlalu panjang'),
})

const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  })

export async function updateNameAction(
  data: { name: string }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const validated = updateNameSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? 'Validasi gagal' }
    }

    const res = await auth.api.updateUser({
      headers: await headers(),
      body: { name: validated.data.name },
    })

    if (!res) return { success: false, error: 'Gagal memperbarui nama' }

    revalidatePath('/settings')
    revalidatePath('/settings/profile')
    return { success: true }
  } catch (err) {
    console.error('[updateNameAction]', err)
    return { success: false, error: 'Gagal memperbarui nama. Silakan coba lagi.' }
  }
}

export async function changePasswordAction(
  data: { currentPassword?: string; newPassword: string; confirmPassword: string }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const validated = changePasswordSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? 'Validasi gagal' }
    }

    const { currentPassword, newPassword } = validated.data

    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session) {
      return { success: false, error: 'Sesi tidak valid' }
    }

    // Check if the user already has a password set
    const [credAccount] = await db
      .select({ password: account.password })
      .from(account)
      .where(and(eq(account.userId, session.user.id), eq(account.providerId, 'credential')))
      .limit(1)

    const hasPassword = !!credAccount?.password

    if (hasPassword) {
      if (!currentPassword) {
        return { success: false, error: 'Password saat ini wajib diisi' }
      }

      await auth.api.changePassword({
        headers: await headers(),
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        },
      })
    } else {
      // SSO user setting password for the first time
      await auth.api.setPassword({
        headers: await headers(),
        body: {
          newPassword,
        },
      })
    }

    revalidatePath('/settings/profile')
    return { success: true }
  } catch (err) {
    console.error('[changePasswordAction]', err)
    const msg = err instanceof Error ? err.message : ''
    if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('incorrect')) {
      return { success: false, error: 'Password saat ini tidak benar' }
    }
    return { success: false, error: 'Gagal mengubah password. Silakan coba lagi.' }
  }
}
