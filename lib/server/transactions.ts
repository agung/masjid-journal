'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, desc, sql } from 'drizzle-orm'
import crypto from 'crypto'
import { db } from '@/lib/db'
import {
  transaction,
  transactionMovement,
  masjidAccount,
  auditLog,
} from '@/drizzle/schema'
import { requireRole } from '@/lib/auth/guards'
import {
  createTransactionSchema,
  type CreateTransactionInput,
} from '@/lib/validations/transaction'

// ============================================================
// HELPERS
// ============================================================

const TX_PREFIX: Record<string, string> = {
  income: 'INC',
  expense: 'EXP',
  transfer: 'TRF',
  deposit: 'DEP',
  withdrawal: 'WDR',
  adjustment: 'ADJ',
}

/**
 * Generate next sequential transaction number for an org + type + month.
 * Format: INC-202506-0001
 */
async function generateTransactionNo(
  organizationId: string,
  type: string,
  date: Date
): Promise<string> {
  const prefix = TX_PREFIX[type] ?? 'TXN'
  const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
  const likePattern = `${prefix}-${yyyymm}-%`

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transaction)
    .where(
      and(
        eq(transaction.organizationId, organizationId),
        sql`${transaction.transactionNo} LIKE ${likePattern}`
      )
    )

  const seq = ((result?.count ?? 0) as number) + 1
  return `${prefix}-${yyyymm}-${String(seq).padStart(4, '0')}`
}

/**
 * Get the latest balance for an account to use as balance_before.
 * Falls back to initial_balance.
 */
async function getLatestBalance(accountId: string): Promise<number> {
  const [latest] = await db
    .select({ balanceAfter: transactionMovement.balanceAfter })
    .from(transactionMovement)
    .where(eq(transactionMovement.accountId, accountId))
    .orderBy(desc(transactionMovement.createdAt))
    .limit(1)

  if (latest) return latest.balanceAfter

  const [acc] = await db
    .select({ initialBalance: masjidAccount.initialBalance })
    .from(masjidAccount)
    .where(eq(masjidAccount.id, accountId))
    .limit(1)

  return acc?.initialBalance ?? 0
}

/**
 * Validate that accounts belong to the organization and are active.
 */
async function validateAccounts(
  organizationId: string,
  accountIds: string[]
): Promise<{ valid: true } | { valid: false; error: string }> {
  for (const id of accountIds) {
    const [acc] = await db
      .select({ isActive: masjidAccount.isActive, orgId: masjidAccount.organizationId })
      .from(masjidAccount)
      .where(eq(masjidAccount.id, id))
      .limit(1)

    if (!acc) return { valid: false, error: `Akun ${id} tidak ditemukan` }
    if (acc.orgId !== organizationId) return { valid: false, error: `Akun ${id} bukan milik organisasi ini` }
    if (!acc.isActive) return { valid: false, error: `Akun ${id} tidak aktif` }
  }
  return { valid: true }
}

// ============================================================
// CREATE TRANSACTION
// ============================================================

export async function createTransaction(
  input: CreateTransactionInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const session = await requireRole('treasurer')
    const orgId = session.activeOrganizationId!

    // Validate input
    const parsed = createTransactionSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Validasi gagal' }
    }
    const data = parsed.data

    // Collect all account IDs involved
    const accountIds: string[] = []
    if ('sourceAccountId' in data) accountIds.push(data.sourceAccountId)
    if ('targetAccountId' in data) accountIds.push(data.targetAccountId)

    // Validate accounts
    const accountCheck = await validateAccounts(orgId, accountIds)
    if (!accountCheck.valid) return { success: false, error: accountCheck.error }

    const txDate = new Date(data.transactionDate)
    const txId = crypto.randomUUID()
    const txNo = await generateTransactionNo(orgId, data.type as string, txDate)
    const now = new Date()

    // Build movements based on transaction type
    type MovementInput = {
      accountId: string
      direction: 'in' | 'out'
      amount: number
    }
    let movements: MovementInput[] = []

    switch (data.type) {
      case 'income':
        movements = [{ accountId: data.targetAccountId, direction: 'in', amount: data.amount }]
        break
      case 'expense':
        movements = [{ accountId: data.sourceAccountId, direction: 'out', amount: data.amount }]
        break
      case 'transfer':
      case 'deposit':
      case 'withdrawal':
        movements = [
          { accountId: data.sourceAccountId, direction: 'out', amount: data.amount },
          { accountId: data.targetAccountId, direction: 'in', amount: data.amount },
        ]
        break
      case 'adjustment':
        movements = [{ accountId: data.targetAccountId, direction: data.direction, amount: data.amount }]
        break
    }

    // Resolve balance_before / balance_after for each movement
    const resolvedMovements = await Promise.all(
      movements.map(async (m) => {
        const balanceBefore = await getLatestBalance(m.accountId)
        const signedAmount = m.direction === 'in' ? m.amount : -m.amount
        const balanceAfter = balanceBefore + signedAmount
        return {
          id: crypto.randomUUID(),
          organizationId: orgId,
          transactionId: txId,
          accountId: m.accountId,
          direction: m.direction,
          amount: m.amount,
          signedAmount,
          balanceBefore,
          balanceAfter,
          createdAt: now,
        }
      })
    )

    // Validate sufficient balance for outgoing movements
    for (const m of resolvedMovements) {
      if (m.direction === 'out' && m.balanceBefore < m.amount) {
        const [acc] = await db
          .select({ name: masjidAccount.name })
          .from(masjidAccount)
          .where(eq(masjidAccount.id, m.accountId))
          .limit(1)
        return {
          success: false,
          error: `Saldo ${acc?.name ?? 'akun'} tidak mencukupi (saldo: ${m.balanceBefore.toLocaleString('id-ID')}, diperlukan: ${m.amount.toLocaleString('id-ID')})`,
        }
      }
    }

    // Persist transaction header + movements in one batch
    await db.insert(transaction).values({
      id: txId,
      organizationId: orgId,
      transactionNo: txNo,
      type: data.type as 'income' | 'expense' | 'transfer' | 'deposit' | 'withdrawal' | 'adjustment',
      transactionDate: data.transactionDate,
      amount: data.amount,
      categoryId: 'categoryId' in data ? data.categoryId : null,
      description: data.description,
      notes: data.notes ?? null,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(transactionMovement).values(resolvedMovements)

    // Audit log
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      actorUserId: session.user.id,
      action: 'create',
      entityType: 'transaction',
      entityId: txId,
      before: null,
      after: { transactionNo: txNo, type: data.type, amount: data.amount },
      createdAt: now,
    })

    revalidatePath('/transactions')
    revalidatePath('/dashboard')

    return { success: true, id: txId }
  } catch (err) {
    console.error('[createTransaction]', err)
    return { success: false, error: 'Gagal menyimpan transaksi. Coba lagi.' }
  }
}

// ============================================================
// LIST TRANSACTIONS (for ledger)
// ============================================================

export async function listTransactionMovements({
  organizationId,
  year,
  month,
  accountId,
  type,
  page = 1,
  pageSize = 50,
}: {
  organizationId: string
  year: number
  month: number
  accountId?: string
  type?: string
  page?: number
  pageSize?: number
}) {
  const offset = (page - 1) * pageSize

  // Build date range for the month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0] // last day of month

  const rows = await db
    .select({
      // Movement fields
      movementId: transactionMovement.id,
      direction: transactionMovement.direction,
      amount: transactionMovement.amount,
      signedAmount: transactionMovement.signedAmount,
      balanceBefore: transactionMovement.balanceBefore,
      balanceAfter: transactionMovement.balanceAfter,
      movementCreatedAt: transactionMovement.createdAt,
      // Account
      accountId: masjidAccount.id,
      accountName: masjidAccount.name,
      accountKind: masjidAccount.kind,
      // Transaction header
      transactionId: transaction.id,
      transactionNo: transaction.transactionNo,
      transactionType: transaction.type,
      transactionDate: transaction.transactionDate,
      description: transaction.description,
      notes: transaction.notes,
      proofPublicUrl: transaction.proofPublicUrl,
      categoryId: transaction.categoryId,
      createdBy: transaction.createdBy,
    })
    .from(transactionMovement)
    .innerJoin(transaction, eq(transactionMovement.transactionId, transaction.id))
    .innerJoin(masjidAccount, eq(transactionMovement.accountId, masjidAccount.id))
    .where(
      and(
        eq(transactionMovement.organizationId, organizationId),
        sql`${transaction.transactionDate} >= ${startDate}`,
        sql`${transaction.transactionDate} <= ${endDate}`,
        accountId ? eq(transactionMovement.accountId, accountId) : undefined,
        type ? eq(transaction.type, type as 'income' | 'expense' | 'transfer' | 'deposit' | 'withdrawal' | 'adjustment') : undefined
      )
    )
    .orderBy(desc(transaction.transactionDate), desc(transactionMovement.createdAt))
    .limit(pageSize)
    .offset(offset)

  return rows
}

export async function getTransactionById(transactionId: string, organizationId: string) {
  const [tx] = await db
    .select()
    .from(transaction)
    .where(
      and(
        eq(transaction.id, transactionId),
        eq(transaction.organizationId, organizationId)
      )
    )
    .limit(1)

  if (!tx) return null

  const movements = await db
    .select({
      id: transactionMovement.id,
      direction: transactionMovement.direction,
      amount: transactionMovement.amount,
      signedAmount: transactionMovement.signedAmount,
      balanceBefore: transactionMovement.balanceBefore,
      balanceAfter: transactionMovement.balanceAfter,
      accountId: masjidAccount.id,
      accountName: masjidAccount.name,
      accountKind: masjidAccount.kind,
    })
    .from(transactionMovement)
    .innerJoin(masjidAccount, eq(transactionMovement.accountId, masjidAccount.id))
    .where(eq(transactionMovement.transactionId, transactionId))
    .orderBy(transactionMovement.createdAt)

  return { ...tx, movements }
}
