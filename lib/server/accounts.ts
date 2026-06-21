'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, desc, sql } from 'drizzle-orm'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { masjidAccount, transactionMovement } from '@/drizzle/schema'
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
 * Get the latest balance for a single account.
 * Falls back to initialBalance if no movements exist.
 */
export async function getAccountBalance(accountId: string): Promise<number> {
  const [latest] = await db
    .select({ balanceAfter: transactionMovement.balanceAfter })
    .from(transactionMovement)
    .where(eq(transactionMovement.accountId, accountId))
    .orderBy(desc(transactionMovement.createdAt))
    .limit(1)

  if (latest) return Number(latest.balanceAfter ?? 0)

  const [acc] = await db
    .select({ initialBalance: masjidAccount.initialBalance })
    .from(masjidAccount)
    .where(eq(masjidAccount.id, accountId))
    .limit(1)

  return Number(acc?.initialBalance ?? 0)
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
      bankName: masjidAccount.bankName,
      accountNumber: masjidAccount.accountNumber,
      accountHolderName: masjidAccount.accountHolderName,
      initialBalance: masjidAccount.initialBalance,
      isActive: masjidAccount.isActive,
      createdAt: masjidAccount.createdAt,
      // Latest balance: subquery
      currentBalance: sql<number>`
        COALESCE(
          (
            SELECT tm.balance_after
            FROM transaction_movement tm
            WHERE tm.account_id = "masjid_account"."id"
            ORDER BY tm.created_at DESC
            LIMIT 1
          ),
          "masjid_account"."initial_balance"
        )
      `.as('current_balance'),
    })
    .from(masjidAccount)
    .where(eq(masjidAccount.organizationId, organizationId))
    .orderBy(masjidAccount.kind, masjidAccount.name)

  return accounts.map((account) => ({
    ...account,
    currentBalance: Number(account.currentBalance ?? 0),
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
    const { name, holderName, initialBalance } = validated.data
    const id = crypto.randomUUID()

    await db.insert(masjidAccount).values({
      id,
      organizationId: orgId,
      kind: 'cash_holder',
      name,
      holderName,
      initialBalance,
      isActive: true,
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const { name, bankName, accountNumber, accountHolderName, initialBalance } = validated.data
    const id = crypto.randomUUID()

    await db.insert(masjidAccount).values({
      id,
      organizationId: orgId,
      kind: 'bank',
      name,
      bankName,
      accountNumber,
      accountHolderName,
      initialBalance,
      isActive: true,
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      .set({ ...validated.data, updatedAt: new Date() })
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
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(masjidAccount.id, accountId), eq(masjidAccount.organizationId, orgId)))

    revalidatePath('/accounts')
    return { success: true }
  } catch (err) {
    console.error('[toggleAccountActive]', err)
    return { success: false, error: 'Gagal mengubah status akun. Coba lagi.' }
  }
}
