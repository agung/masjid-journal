import Link from 'next/link'
import { formatRupiah, formatDate } from '@/lib/formatters'

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

const TYPE_LABEL: Record<string, { label: string; emoji: string; color: string }> = {
  income:     { label: 'Pemasukan',   emoji: '📥', color: 'bg-green-100 text-green-700' },
  expense:    { label: 'Pengeluaran', emoji: '📤', color: 'bg-red-100 text-red-700' },
  transfer:   { label: 'Transfer',    emoji: '🔄', color: 'bg-blue-100 text-blue-700' },
  deposit:    { label: 'Setor Bank',  emoji: '🏦', color: 'bg-purple-100 text-purple-700' },
  withdrawal: { label: 'Tarik Tunai', emoji: '💳', color: 'bg-orange-100 text-orange-700' },
  adjustment: { label: 'Koreksi',     emoji: '⚙️',  color: 'bg-gray-100 text-gray-700' },
}

export function LedgerRow({ row }: { row: LedgerRowData }) {
  const typeInfo = TYPE_LABEL[row.transactionType] ?? { label: row.transactionType, emoji: '•', color: 'bg-gray-100 text-gray-700' }
  const isIn = row.direction === 'in'

  return (
    <Link
      href={`/transactions/${row.transactionId}`}
      className="block bg-white border rounded-xl p-4 hover:border-green-300 transition-colors active:bg-gray-50"
    >
      {/* Row top: date + no + type badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">{formatDate(row.transactionDate)}</span>
          <span className="text-xs font-mono text-gray-400">{row.transactionNo}</span>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
            {typeInfo.emoji} {typeInfo.label}
          </span>
        </div>
        {row.proofPublicUrl && (
          <span className="text-base" title="Ada bukti transaksi">📎</span>
        )}
      </div>

      {/* Description + account */}
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-900 leading-snug">{row.description}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {row.accountKind === 'cash_holder' ? '💰' : '🏦'} {row.accountName}
        </p>
      </div>

      {/* Movement: amount + before → after */}
      <div className="flex items-end justify-between">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-400">Sebelum</p>
          <p className="text-xs font-mono text-gray-500">{formatRupiah(row.balanceBefore)}</p>
        </div>

        <div className="text-center">
          <p className={`text-base font-bold ${ isIn ? 'text-green-600' : 'text-red-600' }`}>
            {isIn ? '+' : '-'}{formatRupiah(row.amount)}
          </p>
        </div>

        <div className="space-y-0.5 text-right">
          <p className="text-xs text-gray-400">Sesudah</p>
          <p className="text-xs font-mono font-semibold text-gray-800">{formatRupiah(row.balanceAfter)}</p>
        </div>
      </div>
    </Link>
  )
}
