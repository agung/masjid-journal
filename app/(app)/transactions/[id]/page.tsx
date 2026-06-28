import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { getTransactionById } from '@/lib/server/transactions'
import { getProofSignedUrl } from '@/lib/server/storage'
import { formatRupiah, formatDate } from '@/lib/formatters'
import { TRANSACTION_TYPE_CONFIG } from '@/lib/transaction-icons'
import { notFound } from 'next/navigation'
import { Wallet, Landmark, Pencil, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { hasMinRole } from '@/lib/auth/roles'
import { DeleteTransactionButton } from '@/components/transactions/delete-transaction-button'

/**
 * Convert a stored proof URL into an embeddable image URL.
 * Google Drive viewer URLs (drive.google.com/file/d/...) can't be embedded
 * in <img> tags — rewrite them to a direct CDN URL via lh3.googleusercontent.com.
 */
function embeddableProofUrl(url: string | null): string | null {
  if (!url) return null
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (match) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`
  }
  return url
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function TransactionDetailPage({ params }: Props) {
  const { id } = await params
  const ctx = await getActiveOrganizationContext()
  const orgId = ctx.activeOrganizationId

  if (!orgId) notFound()

  const tx = await getTransactionById(id, orgId)
  if (!tx) notFound()

  const typeConfig = TRANSACTION_TYPE_CONFIG[tx.type as keyof typeof TRANSACTION_TYPE_CONFIG]
  const TypeIcon = typeConfig?.icon

  // Generate fresh signed URL for proof image (expires in 60s).
  // Fall back to the stored proofPublicUrl when the current provider can't
  // resolve the storage path (e.g. the proof was uploaded via Google Drive
  // but the provider is now Supabase, or vice versa).
  const freshProofUrl =
    (await getProofSignedUrl(tx.proofStoragePath)) ??
    embeddableProofUrl(tx.proofPublicUrl)

  const userRole = ctx.role
  const isWithin1Hour = (Date.now() - tx.createdAt.getTime()) < 60 * 60 * 1000
  const canEdit = userRole && hasMinRole(userRole, 'treasurer') && isWithin1Hour
  const canDelete = userRole && hasMinRole(userRole, 'admin') && isWithin1Hour

  return (
    <div className="p-4 max-w-md mx-auto pb-24">

      {/* Lock warning */}
      {!isWithin1Hour && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 mb-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Clock className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Terkunci (Lock Window)</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 leading-relaxed">
              Transaksi ini dibuat pada {tx.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({formatDate(tx.createdAt)}). Perubahan atau penghapusan hanya diperbolehkan dalam waktu 1 jam setelah dibuat.
            </p>
          </div>
        </div>
      )}

      {/* Edit & Delete actions */}
      {isWithin1Hour && (canEdit || canDelete) && (
        <div className="flex gap-2 mb-4">
          {canEdit && (
            <Link
              href={`/transactions/${tx.id}/edit`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold rounded-xl text-sm transition-all active:scale-98 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-800 dark:text-gray-200"
            >
              <Pencil size={16} />
              Edit Transaksi
            </Link>
          )}
          {canDelete && (
            <div className="flex-1">
              <DeleteTransactionButton
                transactionId={tx.id}
                transactionNo={tx.transactionNo}
                description={tx.description}
              />
            </div>
          )}
        </div>
      )}

      {/* Transaction card */}
      <div className="bg-white border rounded-2xl p-5 mb-4 space-y-4 dark:bg-gray-900">
        {/* Type + number */}
        <div className="flex items-center justify-between">
          <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${typeConfig?.color ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
            {TypeIcon && <TypeIcon size={20} />}
          </span>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-mono dark:text-gray-500">{tx.transactionNo}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(tx.transactionDate)}</p>
          </div>
        </div>

        <div>
          <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{tx.description}</p>
          {tx.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tx.notes}</p>}
        </div>

        <div className="text-3xl font-bold text-green-600">
          {formatRupiah(tx.amount)}
        </div>
      </div>

      {/* Movements section */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 dark:text-gray-400">Pergerakan Saldo</h2>
        <div className="space-y-2">
          {tx.movements.map((m: typeof tx.movements[number]) => (
            <div key={m.id} className="bg-white border rounded-xl p-4 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center dark:bg-gray-800 dark:text-gray-400">
                    {m.accountKind === 'cash_holder' ? <Wallet size={14} /> : <Landmark size={14} />}
                  </span>
                  <span className="font-medium text-sm">{m.accountName}</span>
                </div>
                <span className={`font-bold text-base ${ m.direction === 'in' ? 'text-green-600' : 'text-red-600' }`}>
                  {m.direction === 'in' ? '+' : '-'}{formatRupiah(m.amount)}
                </span>
              </div>
              {/* Before / After */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2 dark:bg-gray-800">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Sebelum</p>
                  <p className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">{formatRupiah(m.balanceBefore)}</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className={`text-lg font-bold ${ m.direction === 'in' ? 'text-green-500' : 'text-red-500' }`}>
                    {m.direction === 'in' ? '→' : '←'}
                  </span>
                </div>
                <div className={`rounded-lg p-2 ${ m.direction === 'in' ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950' }`}>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Sesudah</p>
                  <p className={`text-xs font-mono font-medium ${ m.direction === 'in' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400' }`}>
                    {formatRupiah(m.balanceAfter)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proof image */}
      {freshProofUrl && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 dark:text-gray-400">Bukti Transaksi</h2>
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border bg-gray-50 dark:bg-gray-900">
            <Image
              src={freshProofUrl}
              alt="Bukti transaksi"
              fill
              className="object-contain"
            />
          </div>
          <a
            href={freshProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-xs text-green-600 hover:underline"
          >
            Buka gambar penuh ↗
          </a>
        </div>
      )}

    </div>
  )
}
