import { requireAuth } from '@/lib/auth/guards'
import { getAccountSummary, getMonthlyFlow, getRecentMovements } from '@/lib/server/reports'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { LedgerRow, type LedgerRowData } from '@/components/transactions/ledger-row'
import { formatMonthYear } from '@/lib/formatters'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AppLogo } from '@/components/ui/app-logo'

export default async function DashboardPage() {
  const session = await requireAuth()
  const orgId = (session.session as unknown as { activeOrganizationId?: string }).activeOrganizationId

  if (!orgId) {
    return (
      <div className="p-4 max-w-md mx-auto pt-12 text-center">
        <div className="flex justify-center mb-4">
          <AppLogo size={64} />
        </div>
        <h1 className="text-xl font-bold mb-2">Selamat Datang!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Anda belum tergabung dalam organisasi masjid. Hubungi admin untuk mendapatkan undangan.
        </p>
      </div>
    )
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [accountSummary, monthlyFlow, recentMovements] = await Promise.all([
    getAccountSummary(orgId),
    getMonthlyFlow(orgId, year, month),
    getRecentMovements(orgId, 5),
  ])

  const monthLabel = formatMonthYear(now)

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">{monthLabel}</p>
        </div>
        <Link
          href="/transactions/new"
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Input
        </Link>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalCash={accountSummary.totalCash}
        totalBank={accountSummary.totalBank}
        totalAll={accountSummary.totalAll}
        totalIncome={monthlyFlow.totalIncome}
        totalExpense={monthlyFlow.totalExpense}
        monthLabel={monthLabel}
      />

      {/* Account balances */}
      {(accountSummary.cashHolders.length > 0 || accountSummary.banks.length > 0) && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Akun</h2>
            <Link href="/accounts" className="text-xs text-green-600 p-2 -m-2">Lihat semua</Link>
          </div>
          <div className="space-y-2">
            {[...accountSummary.cashHolders, ...accountSummary.banks].slice(0, 4).map((acc) => (
              <div key={acc.id} className="flex items-center justify-between bg-white border rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span>{acc.kind === 'cash_holder' ? '💰' : '🏦'}</span>
                  <span className="text-sm font-medium">{acc.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-800">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(acc.currentBalance ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent movements */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Transaksi Terakhir</h2>
          <Link href="/transactions" className="text-xs text-green-600 p-2 -m-2">Lihat semua</Link>
        </div>
        {recentMovements.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed">
            <p className="text-sm text-gray-500 mb-2">Belum ada transaksi</p>
            <Link href="/transactions/new" className="text-sm text-green-600 font-medium">
              Buat Transaksi Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentMovements.map((m) => (
              <LedgerRow
                key={m.movementId}
                row={{
                  movementId: m.movementId,
                  transactionId: m.transactionId,
                  transactionNo: m.transactionNo,
                  transactionType: m.transactionType,
                  transactionDate: m.transactionDate,
                  description: m.description,
                  notes: null,
                  categoryId: null,
                  accountId: '',
                  accountName: m.accountName,
                  accountKind: m.accountKind,
                  direction: m.direction as 'in' | 'out',
                  amount: m.amount,
                  signedAmount: m.direction === 'in' ? m.amount : -m.amount,
                  balanceBefore: m.balanceBefore,
                  balanceAfter: m.balanceAfter,
                  proofPublicUrl: null,
                  createdBy: '',
                } satisfies LedgerRowData}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
