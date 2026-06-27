'use server'

import { eq, and, sql, gte, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { transaction, transactionMovement, masjidAccount, category } from '@/drizzle/schema'

/**
 * Get total current balance per account kind for an organization.
 */
export async function getAccountSummary(organizationId: string) {
  const accounts = await db
    .select({
      id: masjidAccount.id,
      kind: masjidAccount.kind,
      name: masjidAccount.name,
      isActive: masjidAccount.isActive,
      currentBalance: masjidAccount.balance,
    })
    .from(masjidAccount)
    .where(
      and(
        eq(masjidAccount.organizationId, organizationId),
        eq(masjidAccount.isActive, true)
      )
    )

  const cashHolders = accounts.filter((a) => a.kind === 'cash_holder')
  const banks = accounts.filter((a) => a.kind === 'bank')

  // PostgreSQL bigint/numeric comes back as strings — cast to Number before summing.
  const totalCash = cashHolders.reduce((sum, a) => sum + Number(a.currentBalance ?? 0), 0)
  const totalBank = banks.reduce((sum, a) => sum + Number(a.currentBalance ?? 0), 0)

  return {
    cashHolders,
    banks,
    totalCash,
    totalBank,
    totalAll: totalCash + totalBank,
  }
}

/**
 * Get monthly income and expense totals for an org.
 */
export async function getMonthlyFlow(
  organizationId: string,
  year: number,
  month: number
) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const [result] = await db
    .select({
      totalIncome: sql<number>`
        COALESCE(SUM(CASE WHEN ${transaction.type} = 'income' THEN ${transaction.amount} ELSE 0 END), 0)
      `.as('total_income'),
      totalExpense: sql<number>`
        COALESCE(SUM(CASE WHEN ${transaction.type} = 'expense' THEN ${transaction.amount} ELSE 0 END), 0)
      `.as('total_expense'),
      transactionCount: sql<number>`COUNT(*)`.as('transaction_count'),
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.organizationId, organizationId),
        gte(transaction.transactionDate, startDate),
        lte(transaction.transactionDate, endDate)
      )
    )

  return {
    totalIncome: Number(result?.totalIncome ?? 0),
    totalExpense: Number(result?.totalExpense ?? 0),
    transactionCount: Number(result?.transactionCount ?? 0),
    netFlow: Number(result?.totalIncome ?? 0) - Number(result?.totalExpense ?? 0),
  }
}

/**
 * Get monthly report with category breakdown.
 */
export async function getMonthlyReport(
  organizationId: string,
  year: number,
  month: number
) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // All transactions in range
  const transactions = await db
    .select({
      id: transaction.id,
      transactionNo: transaction.transactionNo,
      type: transaction.type,
      transactionDate: transaction.transactionDate,
      amount: transaction.amount,
      description: transaction.description,
      categoryId: transaction.categoryId,
      categoryName: category.name,
      categoryType: category.type,
    })
    .from(transaction)
    .leftJoin(category, eq(transaction.categoryId, category.id))
    .where(
      and(
        eq(transaction.organizationId, organizationId),
        gte(transaction.transactionDate, startDate),
        lte(transaction.transactionDate, endDate)
      )
    )
    .orderBy(transaction.transactionDate)

  // Aggregate by category
  const categoryMap = new Map<string, { name: string; type: string; total: number; count: number }>()

  for (const tx of transactions) {
    if (tx.type !== 'income' && tx.type !== 'expense') continue
    const key = tx.categoryId ?? '__uncategorized__'
    const name = tx.categoryName ?? 'Tanpa Kategori'
    const amount = Number(tx.amount ?? 0)
    const existing = categoryMap.get(key)
    if (existing) {
      existing.total += amount
      existing.count += 1
    } else {
      categoryMap.set(key, { name, type: tx.categoryType ?? tx.type, total: amount, count: 1 })
    }
  }

  const incomeByCategory = [...categoryMap.values()].filter((c) => c.type === 'income')
  const expenseByCategory = [...categoryMap.values()].filter((c) => c.type === 'expense')

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount ?? 0), 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount ?? 0), 0)

  // Opening balance: total of all account balances at start of month
  // Approximate: currentBalance - netFlow
  const summary = await getAccountSummary(organizationId)
  const openingBalance = summary.totalAll - (totalIncome - totalExpense)

  return {
    year,
    month,
    transactions: transactions.slice(0, 50),
    totalTransactionsCount: transactions.length,
    totalIncome,
    totalExpense,
    netFlow: totalIncome - totalExpense,
    openingBalance,
    closingBalance: summary.totalAll,
    incomeByCategory,
    expenseByCategory,
  }
}

/**
 * Get recent movements for dashboard (last N movements across all accounts).
 */
export async function getRecentMovements(organizationId: string, limit = 5) {
  return db
    .select({
      movementId: transactionMovement.id,
      direction: transactionMovement.direction,
      amount: transactionMovement.amount,
      balanceBefore: transactionMovement.balanceBefore,
      balanceAfter: transactionMovement.balanceAfter,
      accountName: masjidAccount.name,
      accountKind: masjidAccount.kind,
      transactionId: transaction.id,
      transactionNo: transaction.transactionNo,
      transactionType: transaction.type,
      transactionDate: transaction.transactionDate,
      description: transaction.description,
    })
    .from(transactionMovement)
    .innerJoin(transaction, eq(transactionMovement.transactionId, transaction.id))
    .innerJoin(masjidAccount, eq(transactionMovement.accountId, masjidAccount.id))
    .where(eq(transactionMovement.organizationId, organizationId))
    .orderBy(sql`${transaction.transactionDate} DESC, ${transactionMovement.createdAt} DESC`)
    .limit(limit)
}

/**
 * Get all movements for a monthly PDF report, ordered chronologically.
 */
export async function getMovementsForReport(
  organizationId: string,
  year: number,
  month: number
) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return db
    .select({
      movementId: transactionMovement.id,
      direction: transactionMovement.direction,
      amount: transactionMovement.amount,
      balanceAfter: transactionMovement.balanceAfter,
      accountName: masjidAccount.name,
      accountKind: masjidAccount.kind,
      transactionId: transaction.id,
      transactionNo: transaction.transactionNo,
      transactionType: transaction.type,
      transactionDate: transaction.transactionDate,
      description: transaction.description,
    })
    .from(transactionMovement)
    .innerJoin(transaction, eq(transactionMovement.transactionId, transaction.id))
    .innerJoin(masjidAccount, eq(transactionMovement.accountId, masjidAccount.id))
    .where(
      and(
        eq(transactionMovement.organizationId, organizationId),
        gte(transaction.transactionDate, startDate),
        lte(transaction.transactionDate, endDate)
      )
    )
    .orderBy(sql`${transaction.transactionDate} ASC, ${transactionMovement.createdAt} ASC`)
}

export async function listReportTransactions({
  organizationId,
  year,
  month,
  page = 1,
  pageSize = 50,
}: {
  organizationId: string
  year: number
  month: number
  page?: number
  pageSize?: number
}) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const offset = (page - 1) * pageSize

  return db
    .select({
      id: transaction.id,
      transactionNo: transaction.transactionNo,
      type: transaction.type,
      transactionDate: transaction.transactionDate,
      amount: transaction.amount,
      description: transaction.description,
      categoryId: transaction.categoryId,
      categoryName: category.name,
      categoryType: category.type,
    })
    .from(transaction)
    .leftJoin(category, eq(transaction.categoryId, category.id))
    .where(
      and(
        eq(transaction.organizationId, organizationId),
        gte(transaction.transactionDate, startDate),
        lte(transaction.transactionDate, endDate)
      )
    )
    .orderBy(transaction.transactionDate)
    .limit(pageSize)
    .offset(offset)
}
