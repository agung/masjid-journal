'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, desc, sql, gt } from 'drizzle-orm'
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

  const seq = Number(result?.count ?? 0) + 1
  return `${prefix}-${yyyymm}-${String(seq).padStart(4, '0')}`
}

/**
 * Get the current balance for an account directly from masjid_account.balance.
 * balance is kept in sync on every transaction write.
 */
async function getLatestBalance(accountId: string): Promise<number> {
  const [acc] = await db
    .select({ balance: masjidAccount.balance })
    .from(masjidAccount)
    .where(eq(masjidAccount.id, accountId))
    .limit(1)

  return Number(acc?.balance ?? 0)
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
    const userRole = session.activeOrganizationRole!
    const userId = session.user.id

    // Restrict admin/treasurer transactions to their own cash holder account
    if (userRole === 'admin' || userRole === 'treasurer') {
      if (input.type !== 'income' && input.type !== 'expense') {
        return { success: false, error: 'Tipe transaksi tidak diperbolehkan untuk peran Anda.' }
      }

      // Fetch user's cash holder account
      const [userCashAccount] = await db
        .select()
        .from(masjidAccount)
        .where(
          and(
            eq(masjidAccount.organizationId, orgId),
            eq(masjidAccount.holderUserId, userId),
            eq(masjidAccount.kind, 'cash_holder'),
            eq(masjidAccount.isActive, true)
          )
        )
        .limit(1)

      if (!userCashAccount) {
        return { success: false, error: 'Anda belum memiliki akun pemegang kas yang aktif.' }
      }

      // Enforce matching target/source account and validate balance for expenses
      if (input.type === 'income') {
        input.targetAccountId = userCashAccount.id
      } else if (input.type === 'expense') {
        input.sourceAccountId = userCashAccount.id

        const rawAmount = typeof input.amount === 'number' 
          ? input.amount 
          : parseInt(String(input.amount).replace(/[^0-9]/g, ''), 10) || 0

        if (userCashAccount.balance < rawAmount) {
          return { success: false, error: 'Saldo Anda tidak mencukupi. Saldo kas Anda saat ini: ' + userCashAccount.balance.toLocaleString('id-ID') }
        }
      }
    }

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
      proofStoragePath: data.proofStoragePath ?? null,
      proofPublicUrl: data.proofPublicUrl ?? null,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(transactionMovement).values(resolvedMovements)

    // Update balance on each affected account
    for (const m of resolvedMovements) {
      await db
        .update(masjidAccount)
        .set({ balance: m.balanceAfter })
        .where(eq(masjidAccount.id, m.accountId))
    }

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
    revalidatePath('/accounts')

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
  startDate,
  endDate,
  accountId,
  type,
  page = 1,
  pageSize = 50,
}: {
  organizationId: string
  startDate: string
  endDate: string
  accountId?: string
  type?: string
  page?: number
  pageSize?: number
}) {
  const offset = (page - 1) * pageSize

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

// ============================================================
// DELETE TRANSACTION
// ============================================================

export async function deleteTransaction(
  transactionId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireRole('admin')
    const orgId = session.activeOrganizationId!
    const userId = session.user.id

    // Fetch existing transaction
    const tx = await getTransactionById(transactionId, orgId)
    if (!tx) {
      return { success: false, error: 'Transaksi tidak ditemukan.' }
    }

    // Verify 1 hour window
    const now = new Date()
    const diffInMs = now.getTime() - tx.createdAt.getTime()
    if (diffInMs > 60 * 60 * 1000) {
      return {
        success: false,
        error: 'Transaksi tidak dapat dihapus karena sudah lebih dari 1 jam sejak dibuat.',
      }
    }

    // Begin transaction
    await db.transaction(async (trx) => {
      // Group old movements by accountId to compute net delta
      const deltas: Record<string, { delta: number; minCreatedAt: Date }> = {}
      for (const m of tx.movements) {
        const delta = -m.signedAmount
        // Query the actual movement created_at from the database
        const [mov] = await trx
          .select({ createdAt: transactionMovement.createdAt })
          .from(transactionMovement)
          .where(eq(transactionMovement.id, m.id))
          .limit(1)
        
        const movCreatedAt = mov?.createdAt ?? tx.createdAt

        if (deltas[m.accountId]) {
          deltas[m.accountId].delta += delta
          if (movCreatedAt < deltas[m.accountId].minCreatedAt) {
            deltas[m.accountId].minCreatedAt = movCreatedAt
          }
        } else {
          deltas[m.accountId] = { delta, minCreatedAt: movCreatedAt }
        }
      }

      // Check balance constraints
      for (const [accountId, { delta, minCreatedAt }] of Object.entries(deltas)) {
        if (delta === 0) continue

        const [acc] = await trx
          .select({ name: masjidAccount.name, balance: masjidAccount.balance })
          .from(masjidAccount)
          .where(eq(masjidAccount.id, accountId))
          .limit(1)

        if (!acc) throw new Error(`Akun tidak ditemukan: ${accountId}`)

        // Check if balance becomes negative
        if (Number(acc.balance) + delta < 0) {
          throw new Error(
            `Saldo ${acc.name} tidak mencukupi (saldo saat ini: Rp ${acc.balance.toLocaleString('id-ID')}, perubahan: Rp ${delta.toLocaleString('id-ID')})`
          )
        }

        // Check subsequent movements
        const subsequent = await trx
          .select({
            id: transactionMovement.id,
            balanceBefore: transactionMovement.balanceBefore,
            balanceAfter: transactionMovement.balanceAfter,
          })
          .from(transactionMovement)
          .where(
            and(
              eq(transactionMovement.accountId, accountId),
              gt(transactionMovement.createdAt, minCreatedAt)
            )
          )

        for (const subM of subsequent) {
          if (Number(subM.balanceBefore) + delta < 0 || Number(subM.balanceAfter) + delta < 0) {
            throw new Error(
              `Penghapusan ini akan menyebabkan saldo negatif pada riwayat transaksi berikutnya untuk akun ${acc.name}`
            )
          }
        }
      }

      // Apply deltas and update subsequent movements
      for (const [accountId, { delta, minCreatedAt }] of Object.entries(deltas)) {
        // Update account balance
        await trx
          .update(masjidAccount)
          .set({ balance: sql`${masjidAccount.balance} + ${delta}` })
          .where(eq(masjidAccount.id, accountId))

        // Update subsequent movements
        await trx
          .update(transactionMovement)
          .set({
            balanceBefore: sql`${transactionMovement.balanceBefore} + ${delta}`,
            balanceAfter: sql`${transactionMovement.balanceAfter} + ${delta}`,
          })
          .where(
            and(
              eq(transactionMovement.accountId, accountId),
              gt(transactionMovement.createdAt, minCreatedAt)
            )
          )
      }

      // Delete transaction header (cascade will delete movements)
      await trx.delete(transaction).where(eq(transaction.id, transactionId))

      // Audit Log
      await trx.insert(auditLog).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        actorUserId: userId,
        action: 'delete',
        entityType: 'transaction',
        entityId: transactionId,
        before: {
          transactionNo: tx.transactionNo,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
        },
        after: null,
        createdAt: now,
      })
    })

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')

    return { success: true }
  } catch (err: unknown) {
    console.error('[deleteTransaction]', err)
    const errMsg = err instanceof Error ? err.message : 'Gagal menghapus transaksi.'
    return { success: false, error: errMsg }
  }
}

// ============================================================
// UPDATE TRANSACTION
// ============================================================

export async function updateTransaction(
  transactionId: string,
  input: CreateTransactionInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireRole('treasurer')
    const orgId = session.activeOrganizationId!
    const userRole = session.activeOrganizationRole!
    const userId = session.user.id

    // Restrict admin/treasurer transactions to their own cash holder account
    if (userRole === 'admin' || userRole === 'treasurer') {
      if (input.type !== 'income' && input.type !== 'expense') {
        return { success: false, error: 'Tipe transaksi tidak diperbolehkan untuk peran Anda.' }
      }

      // Fetch user's cash holder account
      const [userCashAccount] = await db
        .select()
        .from(masjidAccount)
        .where(
          and(
            eq(masjidAccount.organizationId, orgId),
            eq(masjidAccount.holderUserId, userId),
            eq(masjidAccount.kind, 'cash_holder'),
            eq(masjidAccount.isActive, true)
          )
        )
        .limit(1)

      if (!userCashAccount) {
        return { success: false, error: 'Anda belum memiliki akun pemegang kas yang aktif.' }
      }

      // Enforce matching target/source account
      if (input.type === 'income') {
        input.targetAccountId = userCashAccount.id
      } else if (input.type === 'expense') {
        input.sourceAccountId = userCashAccount.id
      }
    }

    // Validate input
    const parsed = createTransactionSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Validasi gagal' }
    }
    const data = parsed.data

    // Fetch existing transaction
    const tx = await getTransactionById(transactionId, orgId)
    if (!tx) {
      return { success: false, error: 'Transaksi tidak ditemukan.' }
    }

    // Verify 1 hour window
    const now = new Date()
    const diffInMs = now.getTime() - tx.createdAt.getTime()
    if (diffInMs > 60 * 60 * 1000) {
      return {
        success: false,
        error: 'Transaksi tidak dapat diubah karena sudah lebih dari 1 jam sejak dibuat.',
      }
    }

    // Validate accounts
    const accountIds: string[] = []
    if ('sourceAccountId' in data) accountIds.push(data.sourceAccountId)
    if ('targetAccountId' in data) accountIds.push(data.targetAccountId)
    const accountCheck = await validateAccounts(orgId, accountIds)
    if (!accountCheck.valid) return { success: false, error: accountCheck.error }

    // Generate transactionNo if type or month/year of transactionDate changed
    const oldDate = new Date(tx.transactionDate)
    const newDate = new Date(data.transactionDate)
    const isMonthOrYearChanged =
      oldDate.getFullYear() !== newDate.getFullYear() ||
      oldDate.getMonth() !== newDate.getMonth()

    let transactionNo = tx.transactionNo
    if (tx.type !== data.type || isMonthOrYearChanged) {
      transactionNo = await generateTransactionNo(orgId, data.type, newDate)
    }

    // Build new movement definitions
    type MovementInput = {
      accountId: string
      direction: 'in' | 'out'
      amount: number
    }
    let newMovements: MovementInput[] = []
    switch (data.type) {
      case 'income':
        newMovements = [{ accountId: data.targetAccountId, direction: 'in', amount: data.amount }]
        break
      case 'expense':
        newMovements = [{ accountId: data.sourceAccountId, direction: 'out', amount: data.amount }]
        break
      case 'transfer':
      case 'deposit':
      case 'withdrawal':
        newMovements = [
          { accountId: data.sourceAccountId, direction: 'out', amount: data.amount },
          { accountId: data.targetAccountId, direction: 'in', amount: data.amount },
        ]
        break
      case 'adjustment':
        newMovements = [{ accountId: data.targetAccountId, direction: data.direction, amount: data.amount }]
        break
    }

    // Assign roles to old movements
    const oldMovementsWithRoles = tx.movements.map((m) => {
      let role: 'source' | 'target'
      if (tx.type === 'income') role = 'target'
      else if (tx.type === 'expense') role = 'source'
      else if (tx.type === 'adjustment') role = 'target'
      else {
        role = m.direction === 'out' ? 'source' : 'target'
      }
      return { ...m, role }
    })

    // Assign roles to new movements
    const newMovementsWithRoles = newMovements.map((m) => {
      let role: 'source' | 'target'
      if (data.type === 'income') role = 'target'
      else if (data.type === 'expense') role = 'source'
      else if (data.type === 'adjustment') role = 'target'
      else {
        role = m.direction === 'out' ? 'source' : 'target'
      }
      const signedAmount = m.direction === 'in' ? m.amount : -m.amount
      return { ...m, signedAmount, role }
    })

    // Begin database transaction
    await db.transaction(async (trx) => {
      const accountChanges: Record<string, { delta: number; minCreatedAt: Date }> = {}
      const addChange = (accountId: string, delta: number, createdAt: Date) => {
        if (!accountChanges[accountId]) {
          accountChanges[accountId] = { delta, minCreatedAt: createdAt }
        } else {
          accountChanges[accountId].delta += delta
          if (createdAt < accountChanges[accountId].minCreatedAt) {
            accountChanges[accountId].minCreatedAt = createdAt
          }
        }
      }

      const oldSourceM = oldMovementsWithRoles.find((m) => m.role === 'source')
      const oldTargetM = oldMovementsWithRoles.find((m) => m.role === 'target')

      const newSourceM = newMovementsWithRoles.find((m) => m.role === 'source')
      const newTargetM = newMovementsWithRoles.find((m) => m.role === 'target')

      // Fetch the actual createdAt from database for existing movements
      const getMovCreatedAt = async (mId: string) => {
        const [mov] = await trx
          .select({ createdAt: transactionMovement.createdAt })
          .from(transactionMovement)
          .where(eq(transactionMovement.id, mId))
          .limit(1)
        return mov?.createdAt ?? tx.createdAt
      }

      const oldSourceCreatedAt = oldSourceM ? await getMovCreatedAt(oldSourceM.id) : tx.createdAt
      const oldTargetCreatedAt = oldTargetM ? await getMovCreatedAt(oldTargetM.id) : tx.createdAt

      const movementsToUpdate: { id: string; accountId: string; direction: 'in' | 'out'; amount: number; signedAmount: number; balanceBefore: number; balanceAfter: number }[] = []
      const movementsToDelete: string[] = []
      const movementsToInsert: { id: string; organizationId: string; transactionId: string; accountId: string; direction: 'in' | 'out'; amount: number; signedAmount: number; balanceBefore: number; balanceAfter: number; createdAt: Date }[] = []

      // Helper function to query balance immediately prior to a timestamp
      const getBalanceBefore = async (accId: string, timestamp: Date) => {
        const [priorM] = await trx
          .select({ balanceAfter: transactionMovement.balanceAfter })
          .from(transactionMovement)
          .where(
            and(
              eq(transactionMovement.accountId, accId),
              sql`${transactionMovement.createdAt} < ${timestamp}`
            )
          )
          .orderBy(desc(transactionMovement.createdAt))
          .limit(1)
        return Number(priorM?.balanceAfter ?? 0)
      }

      // Process 'source' role
      if (oldSourceM && newSourceM) {
        if (oldSourceM.accountId === newSourceM.accountId) {
          const delta = newSourceM.signedAmount - oldSourceM.signedAmount
          addChange(oldSourceM.accountId, delta, oldSourceCreatedAt)
          movementsToUpdate.push({
            id: oldSourceM.id,
            accountId: oldSourceM.accountId,
            direction: newSourceM.direction,
            amount: newSourceM.amount,
            signedAmount: newSourceM.signedAmount,
            balanceBefore: oldSourceM.balanceBefore,
            balanceAfter: oldSourceM.balanceBefore + newSourceM.signedAmount,
          })
        } else {
          addChange(oldSourceM.accountId, -oldSourceM.signedAmount, oldSourceCreatedAt)
          const balanceBefore = await getBalanceBefore(newSourceM.accountId, oldSourceCreatedAt)
          addChange(newSourceM.accountId, newSourceM.signedAmount, oldSourceCreatedAt)
          movementsToUpdate.push({
            id: oldSourceM.id,
            accountId: newSourceM.accountId,
            direction: newSourceM.direction,
            amount: newSourceM.amount,
            signedAmount: newSourceM.signedAmount,
            balanceBefore,
            balanceAfter: balanceBefore + newSourceM.signedAmount,
          })
        }
      } else if (oldSourceM && !newSourceM) {
        addChange(oldSourceM.accountId, -oldSourceM.signedAmount, oldSourceCreatedAt)
        movementsToDelete.push(oldSourceM.id)
      } else if (!oldSourceM && newSourceM) {
        const balanceBefore = await getBalanceBefore(newSourceM.accountId, tx.createdAt)
        addChange(newSourceM.accountId, newSourceM.signedAmount, tx.createdAt)
        movementsToInsert.push({
          id: crypto.randomUUID(),
          organizationId: orgId,
          transactionId,
          accountId: newSourceM.accountId,
          direction: newSourceM.direction,
          amount: newSourceM.amount,
          signedAmount: newSourceM.signedAmount,
          balanceBefore,
          balanceAfter: balanceBefore + newSourceM.signedAmount,
          createdAt: tx.createdAt,
        })
      }

      // Process 'target' role
      if (oldTargetM && newTargetM) {
        if (oldTargetM.accountId === newTargetM.accountId) {
          const delta = newTargetM.signedAmount - oldTargetM.signedAmount
          addChange(oldTargetM.accountId, delta, oldTargetCreatedAt)
          movementsToUpdate.push({
            id: oldTargetM.id,
            accountId: oldTargetM.accountId,
            direction: newTargetM.direction,
            amount: newTargetM.amount,
            signedAmount: newTargetM.signedAmount,
            balanceBefore: oldTargetM.balanceBefore,
            balanceAfter: oldTargetM.balanceBefore + newTargetM.signedAmount,
          })
        } else {
          addChange(oldTargetM.accountId, -oldTargetM.signedAmount, oldTargetCreatedAt)
          const balanceBefore = await getBalanceBefore(newTargetM.accountId, oldTargetCreatedAt)
          addChange(newTargetM.accountId, newTargetM.signedAmount, oldTargetCreatedAt)
          movementsToUpdate.push({
            id: oldTargetM.id,
            accountId: newTargetM.accountId,
            direction: newTargetM.direction,
            amount: newTargetM.amount,
            signedAmount: newTargetM.signedAmount,
            balanceBefore,
            balanceAfter: balanceBefore + newTargetM.signedAmount,
          })
        }
      } else if (oldTargetM && !newTargetM) {
        addChange(oldTargetM.accountId, -oldTargetM.signedAmount, oldTargetCreatedAt)
        movementsToDelete.push(oldTargetM.id)
      } else if (!oldTargetM && newTargetM) {
        const balanceBefore = await getBalanceBefore(newTargetM.accountId, tx.createdAt)
        addChange(newTargetM.accountId, newTargetM.signedAmount, tx.createdAt)
        movementsToInsert.push({
          id: crypto.randomUUID(),
          organizationId: orgId,
          transactionId,
          accountId: newTargetM.accountId,
          direction: newTargetM.direction,
          amount: newTargetM.amount,
          signedAmount: newTargetM.signedAmount,
          balanceBefore,
          balanceAfter: balanceBefore + newTargetM.signedAmount,
          createdAt: tx.createdAt,
        })
      }

      // Check balance constraints for all affected accounts
      for (const [accountId, { delta, minCreatedAt }] of Object.entries(accountChanges)) {
        if (delta === 0) continue

        const [acc] = await trx
          .select({ name: masjidAccount.name, balance: masjidAccount.balance })
          .from(masjidAccount)
          .where(eq(masjidAccount.id, accountId))
          .limit(1)

        if (!acc) throw new Error(`Akun tidak ditemukan: ${accountId}`)

        if (Number(acc.balance) + delta < 0) {
          throw new Error(
            `Saldo ${acc.name} tidak mencukupi (saldo saat ini: Rp ${acc.balance.toLocaleString('id-ID')}, perubahan: Rp ${delta.toLocaleString('id-ID')})`
          )
        }

        const subsequent = await trx
          .select({
            id: transactionMovement.id,
            balanceBefore: transactionMovement.balanceBefore,
            balanceAfter: transactionMovement.balanceAfter,
          })
          .from(transactionMovement)
          .where(
            and(
              eq(transactionMovement.accountId, accountId),
              gt(transactionMovement.createdAt, minCreatedAt)
            )
          )

        for (const subM of subsequent) {
          if (Number(subM.balanceBefore) + delta < 0 || Number(subM.balanceAfter) + delta < 0) {
            throw new Error(
              `Perubahan ini akan menyebabkan saldo negatif pada riwayat transaksi berikutnya untuk akun ${acc.name}`
            )
          }
        }
      }

      // Apply changes to database
      if (movementsToDelete.length > 0) {
        for (const mId of movementsToDelete) {
          await trx.delete(transactionMovement).where(eq(transactionMovement.id, mId))
        }
      }

      for (const m of movementsToUpdate) {
        await trx
          .update(transactionMovement)
          .set({
            accountId: m.accountId,
            direction: m.direction,
            amount: m.amount,
            signedAmount: m.signedAmount,
            balanceBefore: m.balanceBefore,
            balanceAfter: m.balanceAfter,
          })
          .where(eq(transactionMovement.id, m.id))
      }

      if (movementsToInsert.length > 0) {
        await trx.insert(transactionMovement).values(movementsToInsert)
      }

      for (const [accountId, { delta, minCreatedAt }] of Object.entries(accountChanges)) {
        if (delta === 0) continue

        await trx
          .update(masjidAccount)
          .set({ balance: sql`${masjidAccount.balance} + ${delta}` })
          .where(eq(masjidAccount.id, accountId))

        await trx
          .update(transactionMovement)
          .set({
            balanceBefore: sql`${transactionMovement.balanceBefore} + ${delta}`,
            balanceAfter: sql`${transactionMovement.balanceAfter} + ${delta}`,
          })
          .where(
            and(
              eq(transactionMovement.accountId, accountId),
              gt(transactionMovement.createdAt, minCreatedAt)
            )
          )
      }

      await trx
        .update(transaction)
        .set({
          transactionNo,
          type: data.type as 'income' | 'expense' | 'transfer' | 'deposit' | 'withdrawal' | 'adjustment',
          transactionDate: data.transactionDate,
          amount: data.amount,
          categoryId: 'categoryId' in data ? data.categoryId : null,
          description: data.description,
          notes: data.notes ?? null,
          proofStoragePath: data.proofStoragePath ?? null,
          proofPublicUrl: data.proofPublicUrl ?? null,
          updatedBy: userId,
          updatedAt: now,
        })
        .where(eq(transaction.id, transactionId))

      await trx.insert(auditLog).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        actorUserId: userId,
        action: 'update',
        entityType: 'transaction',
        entityId: transactionId,
        before: {
          transactionNo: tx.transactionNo,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
        },
        after: {
          transactionNo,
          type: data.type,
          amount: data.amount,
          description: data.description,
        },
        createdAt: now,
      })
    })

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')

    return { success: true }
  } catch (err: unknown) {
    console.error('[updateTransaction]', err)
    const errMsg = err instanceof Error ? err.message : 'Gagal memperbarui transaksi.'
    return { success: false, error: errMsg }
  }
}
