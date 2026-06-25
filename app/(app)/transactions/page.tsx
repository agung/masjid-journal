import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { listTransactionMovements } from '@/lib/server/transactions'
import { listAccounts } from '@/lib/server/accounts'
import { type LedgerRowData } from '@/components/transactions/ledger-row'
import { LedgerContainer } from '@/components/transactions/ledger-container'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const ctx = await getActiveOrganizationContext()
  const orgId = ctx.activeOrganizationId

  if (!orgId) {
    return <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Belum ada organisasi aktif. Buat di <a href="/dashboard" className="text-green-600">Dashboard</a>.</div>
  }

  const { month, year, accountId, type } = await searchParams

  const now = new Date()
  const pYear = year ? parseInt(year as string, 10) : now.getFullYear()
  const pMonth = month ? parseInt(month as string, 10) : now.getMonth() + 1

  const [rows, accounts] = await Promise.all([
    listTransactionMovements({
      organizationId: orgId,
      year: pYear,
      month: pMonth,
      accountId: accountId as string,
      type: type as string,
    }),
    listAccounts(orgId),
  ])

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold dark:text-gray-100">Ledger Transaksi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(pYear, pMonth - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Input
        </Link>
      </div>

      <LedgerContainer
        accounts={accounts}
        rows={rows as LedgerRowData[]}
        currentYear={pYear}
        currentMonth={pMonth}
        currentAccountId={accountId as string | undefined}
        currentType={type as string | undefined}
      />
    </div>
  )
}
