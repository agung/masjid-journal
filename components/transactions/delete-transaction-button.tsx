'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTransaction } from '@/lib/server/transactions'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'

interface DeleteTransactionButtonProps {
  transactionId: string
  transactionNo: string
  description: string
}

export function DeleteTransactionButton({
  transactionId,
  transactionNo,
  description,
}: DeleteTransactionButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const res = await deleteTransaction(transactionId)
      if (!res.success) {
        setError(res.error)
        setLoading(false)
        return
      }
      setIsOpen(false)
      router.push('/transactions')
      router.refresh()
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Terjadi kesalahan saat menghapus transaksi.'
      setError(errMsg)
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed text-red-600 rounded-xl text-sm font-semibold transition-colors dark:bg-red-950/40 dark:hover:bg-red-950/70 dark:text-red-400 dark:border dark:border-red-800/40"
      >
        <Trash2 size={16} />
        Hapus Transaksi
      </button>

      {/* Confirmation Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          {/* Modal Container */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Warning Icon & Title */}
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Hapus Transaksi?</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{transactionNo}</p>
              </div>
            </div>

            {/* Transaction Brief */}
            <div className="bg-gray-50 dark:bg-gray-950/50 rounded-2xl p-4 border dark:border-gray-850">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                {description}
              </p>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Saldo akun-akun yang terlibat dalam transaksi ini akan disesuaikan kembali secara otomatis.
            </p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setIsOpen(false)
                  setError(null)
                }}
                className="flex-1 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors border dark:border-gray-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="flex-1 py-3 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
