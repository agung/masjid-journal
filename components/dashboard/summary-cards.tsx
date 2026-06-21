import { formatRupiah } from '@/lib/formatters'
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Landmark } from 'lucide-react'

interface SummaryCardsProps {
  totalCash: number
  totalBank: number
  totalAll: number
  totalIncome: number
  totalExpense: number
  monthLabel: string
}

export function SummaryCards({
  totalCash,
  totalBank,
  totalAll,
  totalIncome,
  totalExpense,
  monthLabel,
}: SummaryCardsProps) {
  return (
    <div className="space-y-3">
      {/* Total saldo card */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 text-white">
        <p className="text-green-100 text-sm font-medium mb-1">Total Saldo</p>
        <p className="text-3xl font-bold">{formatRupiah(totalAll)}</p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-green-200 text-xs flex items-center gap-1"><Wallet size={10} /> Kas Tunai</p>
            <p className="font-semibold text-sm">{formatRupiah(totalCash)}</p>
          </div>
          <div className="w-px bg-green-500" />
          <div>
            <p className="text-green-200 text-xs flex items-center gap-1"><Landmark size={10} /> Bank</p>
            <p className="font-semibold text-sm">{formatRupiah(totalBank)}</p>
          </div>
        </div>
      </div>

      {/* Monthly flow */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><ArrowDownToLine size={12} className="text-green-500" /> Pemasukan</p>
          <p className="text-xs text-gray-400 mb-1">{monthLabel}</p>
          <p className="font-bold text-green-600 text-base">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><ArrowUpFromLine size={12} className="text-red-500" /> Pengeluaran</p>
          <p className="text-xs text-gray-400 mb-1">{monthLabel}</p>
          <p className="font-bold text-red-500 text-base">{formatRupiah(totalExpense)}</p>
        </div>
      </div>
    </div>
  )
}
