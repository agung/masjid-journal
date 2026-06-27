'use client'

import { useTransition, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ReportSkeleton } from './report-skeleton'
import { formatRupiah, formatDate } from '@/lib/formatters'
import Link from 'next/link'
import { FileDown } from 'lucide-react'
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'
import { listReportTransactions } from '@/lib/server/reports'

// Types matching report data from server
interface MonthlyReport {
  totalIncome: number
  totalExpense: number
  openingBalance: number
  closingBalance: number
  totalTransactionsCount: number
  incomeByCategory: Array<{ name: string; total: number }>
  expenseByCategory: Array<{ name: string; total: number }>
  transactions: Array<{
    id: string
    transactionNo: string
    transactionDate: string
    description: string
    categoryName: string | null
    amount: number
    type: string
  }>
}

interface ReportContainerProps {
  organizationId: string
  report: MonthlyReport
  pYear: number
  pMonth: number
  monthLabel: string
}

export function ReportContainer({
  organizationId,
  report,
  pYear,
  pMonth,
  monthLabel,
}: ReportContainerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Local state for active selection to respond instantly on click
  const [selectedYear, setSelectedYear] = useState(pYear)
  const [selectedMonth, setSelectedMonth] = useState(pMonth)

  const fetchPage = async (page: number) => {
    return listReportTransactions({
      organizationId,
      year: selectedYear,
      month: selectedMonth,
      page,
      pageSize: 50,
    })
  }

  // Sync state with server-provided props on update
  useEffect(() => {
    setSelectedYear(pYear)
    setSelectedMonth(pMonth)
  }, [pYear, pMonth])

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
    startTransition(() => {
      router.push(`/reports?year=${year}&month=${month}`)
    })
  }

  // Pre-calculate month tabs relative to selectedYear/selectedMonth
  const tabs = [-2, -1, 0].map((offset) => {
    const d = new Date(pYear, pMonth - 1 + offset)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const label = d.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
    const active = y === selectedYear && m === selectedMonth
    return { y, m, label, active }
  })

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-xl font-bold dark:text-gray-100">Laporan Keuangan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{monthLabel}</p>
        </div>
        <Link
          href={`/reports/preview?year=${selectedYear}&month=${selectedMonth}`}
          className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <FileDown size={15} />
          PDF
        </Link>
      </div>

      {/* Month navigation */}
      <div className="flex gap-2 mb-6 no-print">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleMonthChange(tab.y, tab.m)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tab.active
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Laporan header (print only shows this prominently) */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold">Laporan Keuangan Masjid</h1>
        <p className="text-gray-600">{monthLabel}</p>
      </div>

      {/* Main Report Body: Show loading skeleton during transitions */}
      {isPending ? (
        <ReportSkeleton showNavigation={false} />
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 dark:bg-green-950/30 dark:border-green-900/50">
              <p className="text-xs text-green-600 font-medium mb-1 dark:text-green-400">Total Pemasukan</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatRupiah(report.totalIncome)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 dark:bg-red-950/30 dark:border-red-900/50">
              <p className="text-xs text-red-600 font-medium mb-1 dark:text-red-400">Total Pengeluaran</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatRupiah(report.totalExpense)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 dark:bg-gray-900 dark:border-gray-800">
              <p className="text-xs text-gray-500 font-medium mb-1 dark:text-gray-400">Saldo Awal Bulan</p>
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{formatRupiah(report.openingBalance)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 dark:bg-blue-950/30 dark:border-blue-900/50">
              <p className="text-xs text-blue-600 font-medium mb-1 dark:text-blue-400">Saldo Akhir Bulan</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatRupiah(report.closingBalance)}</p>
            </div>
          </div>

          {/* Income by category */}
          {report.incomeByCategory.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 dark:text-gray-400">Pemasukan per Kategori</h2>
              <div className="bg-white border rounded-xl overflow-hidden dark:bg-gray-900">
                {report.incomeByCategory.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 dark:border-gray-800"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">{c.name}</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">{formatRupiah(c.total)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Expense by category */}
          {report.expenseByCategory.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 dark:text-gray-400">Pengeluaran per Kategori</h2>
              <div className="bg-white border rounded-xl overflow-hidden dark:bg-gray-900">
                {report.expenseByCategory.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 dark:border-gray-800"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">{c.name}</span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatRupiah(c.total)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Transaction list */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 dark:text-gray-400">
              Rincian Transaksi ({report.totalTransactionsCount ?? report.transactions.length})
            </h2>
            {report.totalTransactionsCount > 0 && (
              <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 bg-gray-50 border border-b-0 rounded-t-xl text-xs font-medium text-gray-500 uppercase dark:bg-gray-800 dark:text-gray-400 border-gray-100 dark:border-gray-800">
                <span className="w-24">Tanggal</span>
                <span>Keterangan</span>
                <span className="w-28">Kategori</span>
                <span className="text-right w-28">Nominal</span>
              </div>
            )}
            <InfiniteScrollList
              initialItems={report.transactions}
              fetchPage={fetchPage}
              pageSize={50}
              dependencies={[selectedYear, selectedMonth]}
              className="bg-white border rounded-b-xl overflow-hidden dark:bg-gray-900 divide-y dark:divide-gray-800"
              renderItem={(tx) => (
                <Link
                  key={tx.id}
                  href={`/transactions/${tx.id}`}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors dark:hover:bg-gray-800 dark:border-gray-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(tx.transactionDate)}</span>
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{tx.transactionNo}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">{tx.description}</p>
                    {tx.categoryName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tx.categoryName}</p>
                    )}
                  </div>
                  <span
                    className={`text-sm font-bold ml-4 ${
                      tx.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : tx.type === 'expense'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                    {formatRupiah(tx.amount)}
                  </span>
                </Link>
              )}
              emptyState={
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed dark:bg-gray-900">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada transaksi bulan ini.</p>
                </div>
              }
            />
          </section>
        </div>
      )}
    </div>
  )
}
