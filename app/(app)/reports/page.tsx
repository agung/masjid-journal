import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { getMonthlyReport } from '@/lib/server/reports'
import { formatRupiah, formatDate } from '@/lib/formatters'
import Link from 'next/link'
import { FileDown } from 'lucide-react'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const ctx = await getActiveOrganizationContext()
  const orgId = ctx.activeOrganizationId

  if (!orgId) {
    return <div className="p-4 text-sm text-gray-500">Belum ada organisasi aktif. Buat di <a href="/dashboard" className="text-green-600">Dashboard</a>.</div>
  }

  const { month, year } = await searchParams
  const now = new Date()
  const pYear = year ? parseInt(year as string, 10) : now.getFullYear()
  const pMonth = month ? parseInt(month as string, 10) : now.getMonth() + 1

  const report = await getMonthlyReport(orgId, pYear, pMonth)

  const monthLabel = new Date(pYear, pMonth - 1).toLocaleString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-xl font-bold">Laporan Keuangan</h1>
          <p className="text-sm text-gray-500">{monthLabel}</p>
        </div>
        <Link
          href={`/reports/preview?year=${pYear}&month=${pMonth}`}
          className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <FileDown size={15} />
          PDF
        </Link>
      </div>

      {/* Month navigation */}
      <div className="flex gap-2 mb-6 no-print">
        {[-2, -1, 0].map((offset) => {
          const d = new Date(pYear, pMonth - 1 + offset)
          const y = d.getFullYear()
          const m = d.getMonth() + 1
          const label = d.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
          // Active when this tab's year+month matches the currently viewed period
          const active = y === pYear && m === pMonth
          return (
            <Link
              key={offset}
              href={`/reports?year=${y}&month=${m}`}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Laporan header (print only shows this prominently) */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold">Laporan Keuangan Masjid</h1>
        <p className="text-gray-600">{monthLabel}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium mb-1">Total Pemasukan</p>
          <p className="text-xl font-bold text-green-700">{formatRupiah(report.totalIncome)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600 font-medium mb-1">Total Pengeluaran</p>
          <p className="text-xl font-bold text-red-600">{formatRupiah(report.totalExpense)}</p>
        </div>
        <div className="bg-gray-50 border rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Saldo Awal Bulan</p>
          <p className="text-lg font-bold text-gray-700">{formatRupiah(report.openingBalance)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">Saldo Akhir Bulan</p>
          <p className="text-lg font-bold text-blue-700">{formatRupiah(report.closingBalance)}</p>
        </div>
      </div>

      {/* Income by category */}
      {report.incomeByCategory.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pemasukan per Kategori</h2>
          <div className="bg-white border rounded-xl overflow-hidden">
            {report.incomeByCategory.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
              >
                <span className="text-sm text-gray-700">{c.name}</span>
                <span className="text-sm font-semibold text-green-600">{formatRupiah(c.total)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Expense by category */}
      {report.expenseByCategory.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pengeluaran per Kategori</h2>
          <div className="bg-white border rounded-xl overflow-hidden">
            {report.expenseByCategory.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 border-b last:border-b-0"
              >
                <span className="text-sm text-gray-700">{c.name}</span>
                <span className="text-sm font-semibold text-red-600">{formatRupiah(c.total)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transaction list */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Rincian Transaksi ({report.transactions.length})
        </h2>
        {report.transactions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
            <p className="text-sm text-gray-500">Tidak ada transaksi bulan ini.</p>
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase">
              <span>Tanggal</span>
              <span>Keterangan</span>
              <span>Kategori</span>
              <span className="text-right">Nominal</span>
            </div>
            {report.transactions.map((tx) => (
              <Link
                key={tx.id}
                href={`/transactions/${tx.id}`}
                className="flex items-center justify-between px-4 py-3.5 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-400">{formatDate(tx.transactionDate)}</span>
                    <span className="text-xs font-mono text-gray-400">{tx.transactionNo}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                  {tx.categoryName && (
                    <p className="text-xs text-gray-500">{tx.categoryName}</p>
                  )}
                </div>
                <span
                  className={`text-sm font-bold ml-4 ${
                    tx.type === 'income' ? 'text-green-600' : tx.type === 'expense' ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                  {formatRupiah(tx.amount)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
