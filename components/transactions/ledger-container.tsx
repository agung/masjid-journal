'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LedgerFilters } from './ledger-filters'
import { LedgerRow, type LedgerRowData } from './ledger-row'
import { LedgerSkeleton } from './ledger-skeleton'
import Link from 'next/link'

interface Account {
  id: string
  name: string
  kind: string
}

interface LedgerContainerProps {
  accounts: Account[]
  rows: LedgerRowData[]
  startDate: string
  endDate: string
  currentAccountId?: string
  currentType?: string
}

export function LedgerContainer({
  accounts,
  rows,
  startDate,
  endDate,
  currentAccountId,
  currentType,
}: LedgerContainerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Intercept filter navigation to show loading skeleton
  const handleFilterChange = (url: string) => {
    startTransition(() => {
      router.push(url)
    })
  }

  return (
    <div className="space-y-4">
      <LedgerFilters
        accounts={accounts}
        startDate={startDate}
        endDate={endDate}
        currentAccountId={currentAccountId}
        currentType={currentType}
        onFilterChange={handleFilterChange}
      />

      {/* Render loading skeleton during transition, otherwise render rows */}
      {isPending ? (
        <LedgerSkeleton showFilters={false} />
      ) : rows.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400 mb-2">Belum ada transaksi bulan ini</p>
          <Link href="/transactions/new" className="text-green-600 font-medium">Buat Transaksi Baru</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <LedgerRow key={row.movementId} row={row} />
          ))}
        </div>
      )}
    </div>
  )
}
