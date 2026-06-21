import { requireAuth } from '@/lib/auth/guards'
import { getTransactionById } from '@/lib/server/transactions'
import { formatRupiah, formatDate } from '@/lib/formatters'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const TYPE_INFO: Record<string, { label: string; emoji: string }> = {
  income:     { label: 'Pemasukan',   emoji: '📥' },
  expense:    { label: 'Pengeluaran', emoji: '📤' },
  transfer:   { label: 'Transfer',    emoji: '🔄' },
  deposit:    { label: 'Setor Bank',  emoji: '🏦' },
  withdrawal: { label: 'Tarik Tunai', emoji: '💳' },
  adjustment: { label: 'Koreksi',     emoji: '⚙️'  },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function TransactionDetailPage({ params }: Props) {
  const { id } = await params
  const session = await requireAuth()
  const orgId = (session.session as unknown as { activeOrganizationId?: string }).activeOrganizationId

  if (!orgId) notFound()

  const tx = await getTransactionById(id, orgId)
  if (!tx) notFound()

  const typeInfo = TYPE_INFO[tx.type] ?? { label: tx.type, emoji: '•' }

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <Link href="/transactions" className="text-gray-500 hover:text-gray-700 mr-3">
          ←
        </Link>
        <h1 className="text-xl font-bold">Detail Transaksi</h1>
      </div>

      {/* Transaction card */}
      <div className="bg-white border rounded-2xl p-5 mb-4 space-y-4">
        {/* Type + number */}
        <div className="flex items-center justify-between">
          <span className="text-2xl">{typeInfo.emoji}</span>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-mono">{tx.transactionNo}</p>
            <p className="text-xs text-gray-500">{formatDate(tx.transactionDate)}</p>
          </div>
        </div>

        <div>
          <p className="font-bold text-lg text-gray-900">{tx.description}</p>
          {tx.notes && <p className="text-sm text-gray-500 mt-1">{tx.notes}</p>}
        </div>

        <div className="text-3xl font-bold text-green-600">
          {formatRupiah(tx.amount)}
        </div>
      </div>

      {/* Movements section */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pergerakan Saldo</h2>
        <div className="space-y-2">
          {tx.movements.map((m) => (
            <div key={m.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.accountKind === 'cash_holder' ? '💰' : '🏦'}</span>
                  <span className="font-medium text-sm">{m.accountName}</span>
                </div>
                <span className={`font-bold text-base ${ m.direction === 'in' ? 'text-green-600' : 'text-red-600' }`}>
                  {m.direction === 'in' ? '+' : '-'}{formatRupiah(m.amount)}
                </span>
              </div>
              {/* Before / After */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-400 mb-0.5">Sebelum</p>
                  <p className="text-xs font-mono font-medium text-gray-700">{formatRupiah(m.balanceBefore)}</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className={`text-lg font-bold ${ m.direction === 'in' ? 'text-green-500' : 'text-red-500' }`}>
                    {m.direction === 'in' ? '→' : '←'}
                  </span>
                </div>
                <div className={`rounded-lg p-2 ${ m.direction === 'in' ? 'bg-green-50' : 'bg-red-50' }`}>
                  <p className="text-xs text-gray-400 mb-0.5">Sesudah</p>
                  <p className={`text-xs font-mono font-medium ${ m.direction === 'in' ? 'text-green-700' : 'text-red-700' }`}>
                    {formatRupiah(m.balanceAfter)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proof image */}
      {tx.proofPublicUrl && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Bukti Transaksi</h2>
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border">
            <Image
              src={tx.proofPublicUrl}
              alt="Bukti transaksi"
              fill
              className="object-cover"
            />
          </div>
          <a
            href={tx.proofPublicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-xs text-green-600 hover:underline"
          >
            Buka gambar penuh ↗
          </a>
        </div>
      )}

      <Link
        href="/transactions"
        className="block text-center text-sm text-gray-500 hover:text-gray-700 py-2"
      >
        ← Kembali ke ledger
      </Link>
    </div>
  )
}
