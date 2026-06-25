import { LedgerSkeleton } from '@/components/transactions/ledger-skeleton'

export default function TransactionsLoading() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <LedgerSkeleton showFilters={true} />
    </div>
  )
}
