'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LedgerFilters } from './ledger-filters'
import { LedgerRow, type LedgerRowData } from './ledger-row'
import { LedgerSkeleton } from './ledger-skeleton'
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'
import { listTransactionMovements } from '@/lib/server/transactions'
import Link from 'next/link'

interface Account {
  id: string
  name: string
  kind: string
}

interface LedgerContainerProps {
  organizationId: string
  accounts: Account[]
  rows: LedgerRowData[]
  startDate: string
  endDate: string
  currentAccountId?: string
  currentType?: string
}

export function LedgerContainer({
  organizationId,
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

  const fetchPage = async (page: number) => {
    const raw = await listTransactionMovements({
      organizationId,
      startDate,
      endDate,
      accountId: currentAccountId,
      type: currentType,
      page,
      pageSize: 50,
    })
    return raw as LedgerRowData[]
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
      ) : (
        <InfiniteScrollList
          initialItems={rows}
          fetchPage={fetchPage}
          pageSize={50}
          dependencies={[startDate, endDate, currentAccountId, currentType]}
          renderItem={(row) => (
            <LedgerRow key={row.movementId} row={row} />
          )}
          renderSkeleton={() => <LedgerSkeleton showFilters={false} />}
          emptyState={
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed dark:bg-gray-900">
              <p className="text-gray-500 dark:text-gray-400 mb-2">Belum ada transaksi bulan ini</p>
              <Link href="/transactions/new" className="text-green-600 font-medium">Buat Transaksi Baru</Link>
            </div>
          }
        />
      )}
    </div>
  )
}
