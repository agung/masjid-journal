import Link from 'next/link'
import { formatRupiah, formatDate } from '@/lib/formatters'
import { TRANSACTION_TYPE_CONFIG } from '@/lib/transaction-icons'
import { Wallet, Landmark } from 'lucide-react'

export interface LedgerRowData {
  movementId: string
  transactionId: string
  transactionNo: string
  transactionType: string
  transactionDate: string
  description: string
  notes: string | null
  categoryId: string | null
  accountId: string
  accountName: string
  accountKind: string
  direction: 'in' | 'out'
  amount: number
  signedAmount: number
  balanceBefore: number
  balanceAfter: number
  proofPublicUrl: string | null
  createdBy: string
}

export function LedgerRow({ row }: { row: LedgerRowData }) {
  const typeConfig = TRANSACTION_TYPE_CONFIG[row.transactionType as keyof typeof TRANSACTION_TYPE_CONFIG]
  const TypeIcon = typeConfig?.icon
  const label = typeConfig?.label ?? row.transactionType
  const badgeColor = typeConfig?.color ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  const isIn = row.direction === 'in'

  return (
    <Link
      href={`/transactions/${row.transactionId}`}
      className="block bg-white border rounded-xl p-4 hover:border-green-300 transition-colors active:bg-gray-50 dark:bg-gray-900 dark:hover:border-green-700 dark:active:bg-gray-800"
    >
      {/* Row top: date + no + type badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(row.transactionDate)}</span>
          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{row.transactionNo}</span>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
            {TypeIcon && <TypeIcon size={11} />}
            {label}
          </span>
        </div>
        {row.proofPublicUrl && (
          <span className="text-gray-400" title="Ada bukti transaksi">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </span>
        )}
      </div>

      {/* Description + account */}
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-900 leading-snug dark:text-gray-100">{row.description}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
          {row.accountKind === 'cash_holder'
            ? <Wallet size={11} className="inline" />
            : <Landmark size={11} className="inline" />}
          {row.accountName}
        </p>
      </div>

      {/* Movement: amount + before → after */}
      <div className="flex items-end justify-between">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-400 dark:text-gray-500">Sebelum</p>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{formatRupiah(row.balanceBefore)}</p>
        </div>

        <div className="text-center">
          <p className={`text-base font-bold ${ isIn ? 'text-green-600' : 'text-red-600' }`}>
            {isIn ? '+' : '-'}{formatRupiah(row.amount)}
          </p>
        </div>

        <div className="space-y-0.5 text-right">
          <p className="text-xs text-gray-400 dark:text-gray-500">Sesudah</p>
          <p className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-200">{formatRupiah(row.balanceAfter)}</p>
        </div>
      </div>
    </Link>
  )
}
