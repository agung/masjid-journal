import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { listTransactionMovements } from '@/lib/server/transactions'
import { LedgerRow, type LedgerRowData } from '@/components/transactions/ledger-row'
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
    return <div className="p-4 text-sm text-gray-500">Belum ada organisasi aktif. Buat di <a href="/dashboard" className="text-green-600">Dashboard</a>.</div>
  }

  const { month, year, accountId, type } = await searchParams

  const now = new Date()
  const pYear = year ? parseInt(year as string, 10) : now.getFullYear()
  const pMonth = month ? parseInt(month as string, 10) : now.getMonth() + 1

  const rows = await listTransactionMovements({
    organizationId: orgId,
    year: pYear,
    month: pMonth,
    accountId: accountId as string,
    type: type as string,
  })

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Ledger Transaksi</h1>
          <p className="text-sm text-gray-500">
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

      {/* Filters stub (mobile friendly) */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
        <select className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none min-h-[44px]">
          <option>Bulan Ini</option>
          <option>Bulan Lalu</option>
        </select>
        <select className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none min-h-[44px]">
          <option>Semua Akun</option>
        </select>
        <select className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none min-h-[44px]">
          <option>Semua Tipe</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
      </div>

      {/* Ledger list */}
      {rows.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed">
          <p className="text-gray-500 mb-2">Belum ada transaksi bulan ini</p>
          <Link href="/transactions/new" className="text-green-600 font-medium">Buat Transaksi Baru</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <LedgerRow key={row.movementId} row={row as LedgerRowData} />
          ))}
        </div>
      )}
    </div>
  )
}
