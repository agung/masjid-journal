'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, sql } from 'drizzle-orm'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { masjidAccount } from '@/drizzle/schema'
import { requireRole } from '@/lib/auth/guards'
import {
  createCashHolderSchema,
  createBankAccountSchema,
  updateAccountSchema,
  type CreateCashHolderInput,
  type CreateBankAccountInput,
  type UpdateAccountInput,
} from '@/lib/validations/account'

// ============================================================
// QUERIES
// ============================================================

/**
 * Get the current balance for a single account directly from masjid_account.balance.
 */
export async function getAccountBalance(accountId: string): Promise<number> {
  const [acc] = await db
    .select({ balance: masjidAccount.balance })
    .from(masjidAccount)
    .where(eq(masjidAccount.id, accountId))
    .limit(1)

  return Number(acc?.balance ?? 0)
}

/**
 * List all accounts for the active organization, with current balance.
 */
export async function listAccounts(organizationId: string) {
  // Get latest balance_after per account using a lateral join approach.
  const accounts = await db
    .select({
      id: masjidAccount.id,
      organizationId: masjidAccount.organizationId,
      kind: masjidAccount.kind,
      name: masjidAccount.name,
      holderName: masjidAccount.holderName,
      holderUserId: masjidAccount.holderUserId,
      bankName: masjidAccount.bankName,
      accountNumber: masjidAccount.accountNumber,
      accountHolderName: masjidAccount.accountHolderName,
      balance: masjidAccount.balance,
      isActive: masjidAccount.isActive,
      createdAt: masjidAccount.createdAt,
    })
    .from(masjidAccount)
    .where(eq(masjidAccount.organizationId, organizationId))
    .orderBy(masjidAccount.kind, masjidAccount.name)

  return accounts.map((account: any) => ({
    ...account,
    currentBalance: Number(account.balance ?? 0),
  }))
}

// ============================================================
// MUTATIONS
// ============================================================

export async function createCashHolder(
  data: CreateCashHolderInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const session = await requireRole('admin')
    const orgId = session.activeOrganizationId!
    const validated = createCashHolderSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? 'Validasi gagal' }
    }
    const { name, holderName, balance } = validated.data
    const id = crypto.randomUUID()

    await db.insert(masjidAccount).values({
      id,
      organizationId: orgId,
      kind: 'cash_holder',
      name,
      holderName,
      balance,
      isActive: true,
      createdBy: session.user.id,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })

    revalidatePath('/accounts')
    return { success: true, id }
  } catch (err) {
    console.error('[createCashHolder]', err)
    return { success: false, error: 'Gagal membuat pemegang kas. Coba lagi.' }
  }
}

export async function createBankAccount(
  data: CreateBankAccountInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const session = await requireRole('admin')
    const orgId = session.activeOrganizationId!
    const validated = createBankAccountSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? 'Validasi gagal' }
    }
    const { name, bankName, accountNumber, accountHolderName, balance } = validated.data
    const id = crypto.randomUUID()

    await db.insert(masjidAccount).values({
      id,
      organizationId: orgId,
      kind: 'bank',
      name,
      bankName,
      accountNumber,
      accountHolderName,
      balance,
      isActive: true,
      createdBy: session.user.id,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })

    revalidatePath('/accounts')
    return { success: true, id }
  } catch (err) {
    console.error('[createBankAccount]', err)
    return { success: false, error: 'Gagal membuat akun bank. Coba lagi.' }
  }
}

export async function updateAccount(
  accountId: string,
  data: UpdateAccountInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireRole('admin')
    const orgId = session.activeOrganizationId!
    const validated = updateAccountSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? 'Validasi gagal' }
    }

    // Ensure account belongs to this org
    const [existing] = await db
      .select({ id: masjidAccount.id })
      .from(masjidAccount)
      .where(and(eq(masjidAccount.id, accountId), eq(masjidAccount.organizationId, orgId)))
      .limit(1)

    if (!existing) {
      return { success: false, error: 'Akun tidak ditemukan' }
    }

    await db
      .update(masjidAccount)
      .set({ ...validated.data, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(masjidAccount.id, accountId))

    revalidatePath('/accounts')
    return { success: true }
  } catch (err) {
    console.error('[updateAccount]', err)
    return { success: false, error: 'Gagal memperbarui akun. Coba lagi.' }
  }
}

export async function toggleAccountActive(
  accountId: string,
  isActive: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireRole('admin')
    const orgId = session.activeOrganizationId!

    // If deactivating, warn if balance > 0 (caller should handle)
    if (!isActive) {
      const balance = await getAccountBalance(accountId)
      if (balance > 0) {
        return {
          success: false,
          error: `Akun masih memiliki saldo ${balance.toLocaleString('id-ID')}. Transfer saldo ke akun lain sebelum menonaktifkan.`,
        }
      }
    }

    await db
      .update(masjidAccount)
      .set({ isActive, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(and(eq(masjidAccount.id, accountId), eq(masjidAccount.organizationId, orgId)))

    revalidatePath('/accounts')
    return { success: true }
  } catch (err) {
    console.error('[toggleAccountActive]', err)
    return { success: false, error: 'Gagal mengubah status akun. Coba lagi.' }
  }
}
