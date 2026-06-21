'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTransaction } from '@/lib/server/transactions'
import type { MasjidAccount, Category } from '@/drizzle/schema'
import type { CreateTransactionInput } from '@/lib/validations/transaction'

type TransactionType = 'income' | 'expense' | 'transfer' | 'deposit' | 'withdrawal'

const TRANSACTION_TYPES: { type: TransactionType; label: string; emoji: string; color: string }[] = [
  { type: 'income', label: 'Pemasukan', emoji: '📥', color: 'border-green-500 bg-green-50 text-green-700' },
  { type: 'expense', label: 'Pengeluaran', emoji: '📤', color: 'border-red-500 bg-red-50 text-red-700' },
  { type: 'transfer', label: 'Transfer', emoji: '🔄', color: 'border-blue-500 bg-blue-50 text-blue-700' },
  { type: 'deposit', label: 'Setor Bank', emoji: '🏦', color: 'border-purple-500 bg-purple-50 text-purple-700' },
  { type: 'withdrawal', label: 'Tarik Tunai', emoji: '💳', color: 'border-orange-500 bg-orange-50 text-orange-700' },
]

interface TransactionFormProps {
  accounts: MasjidAccount[]
  categories: Category[]
}

export function TransactionForm({ accounts, categories }: TransactionFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [type, setType] = useState<TransactionType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const cashHolders = accounts.filter((a) => a.kind === 'cash_holder' && a.isActive)
  const bankAccounts = accounts.filter((a) => a.kind === 'bank' && a.isActive)
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  // Format rupiah input for display
  function formatAmount(raw: string): string {
    const digits = raw.replace(/[^0-9]/g, '')
    return digits ? parseInt(digits).toLocaleString('id-ID') : ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!type) return
    setError(null)
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const get = (k: string) => (fd.get(k) as string) ?? ''

    try {
      let input: CreateTransactionInput

      const common = {
        type,
        amount: get('amount'),
        description: get('description'),
        transactionDate: get('transactionDate'),
        notes: get('notes') || undefined,
      } as const

      switch (type) {
        case 'income':
          input = { ...common, type: 'income', categoryId: get('categoryId'), targetAccountId: get('targetAccountId') }
          break
        case 'expense':
          input = { ...common, type: 'expense', categoryId: get('categoryId'), sourceAccountId: get('sourceAccountId') }
          break
        case 'transfer':
          input = { ...common, type: 'transfer', sourceAccountId: get('sourceAccountId'), targetAccountId: get('targetAccountId') }
          break
        case 'deposit':
          input = { ...common, type: 'deposit', sourceAccountId: get('sourceAccountId'), targetAccountId: get('targetAccountId') }
          break
        case 'withdrawal':
          input = { ...common, type: 'withdrawal', sourceAccountId: get('sourceAccountId'), targetAccountId: get('targetAccountId') }
          break
      }

      const result = await createTransaction(input!)
      if (!result.success) {
        setError(result.error)
        return
      }

      router.push('/transactions')
      router.refresh()
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: Pick transaction type ──
  if (step === 1) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 text-center">Pilih jenis transaksi</p>
        <div className="grid grid-cols-1 gap-2">
          {TRANSACTION_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => { setType(t.type); setStep(2) }}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-colors hover:shadow-sm ${
                type === t.type ? t.color : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-3xl">{t.emoji}</span>
              <span className="font-semibold text-base">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Step 2: Transaction details ──
  const selectedType = TRANSACTION_TYPES.find((t) => t.type === type)!

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type badge + back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => { setStep(1); setError(null) }}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Kembali"
        >
          ←
        </button>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          selectedType.color
        }`}>
          {selectedType.emoji} {selectedType.label}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Amount */}
      <div className="space-y-1.5">
        <label htmlFor="amount" className="text-sm font-medium text-gray-700">Nominal</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rp</span>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="numeric"
            required
            onChange={(e) => { e.target.value = formatAmount(e.target.value) }}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="0"
          />
        </div>
      </div>

      {/* Category (income / expense only) */}
      {(type === 'income' || type === 'expense') && (
        <div className="space-y-1.5">
          <label htmlFor="categoryId" className="text-sm font-medium text-gray-700">Kategori</label>
          <select
            id="categoryId"
            name="categoryId"
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Pilih kategori...</option>
            {(type === 'income' ? incomeCategories : expenseCategories).map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Source account */}
      {(type === 'expense' || type === 'transfer') && (
        <div className="space-y-1.5">
          <label htmlFor="sourceAccountId" className="text-sm font-medium text-gray-700">Dari Pemegang Kas</label>
          <select
            id="sourceAccountId"
            name="sourceAccountId"
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Pilih pemegang kas...</option>
            {cashHolders.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.holderName})</option>
            ))}
          </select>
        </div>
      )}

      {type === 'deposit' && (
        <div className="space-y-1.5">
          <label htmlFor="sourceAccountId" className="text-sm font-medium text-gray-700">Dari Pemegang Kas</label>
          <select id="sourceAccountId" name="sourceAccountId" required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="">Pilih pemegang kas...</option>
            {cashHolders.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.holderName})</option>
            ))}
          </select>
        </div>
      )}

      {type === 'withdrawal' && (
        <div className="space-y-1.5">
          <label htmlFor="sourceAccountId" className="text-sm font-medium text-gray-700">Dari Rekening Bank</label>
          <select id="sourceAccountId" name="sourceAccountId" required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="">Pilih rekening bank...</option>
            {bankAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} — {a.bankName}</option>
            ))}
          </select>
        </div>
      )}

      {/* Target account */}
      {type === 'income' && (
        <div className="space-y-1.5">
          <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700">Ke Akun</label>
          <select id="targetAccountId" name="targetAccountId" required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="">Pilih akun penerima...</option>
            {accounts.filter((a) => a.isActive).map((a) => (
              <option key={a.id} value={a.id}>
                {a.kind === 'cash_holder' ? '💰' : '🏦'} {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {type === 'transfer' && (
        <div className="space-y-1.5">
          <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700">Ke Pemegang Kas</label>
          <select id="targetAccountId" name="targetAccountId" required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="">Pilih pemegang kas...</option>
            {cashHolders.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.holderName})</option>
            ))}
          </select>
        </div>
      )}

      {type === 'deposit' && (
        <div className="space-y-1.5">
          <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700">Ke Rekening Bank</label>
          <select id="targetAccountId" name="targetAccountId" required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="">Pilih rekening bank...</option>
            {bankAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} — {a.bankName}</option>
            ))}
          </select>
        </div>
      )}

      {type === 'withdrawal' && (
        <div className="space-y-1.5">
          <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700">Ke Pemegang Kas</label>
          <select id="targetAccountId" name="targetAccountId" required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="">Pilih pemegang kas...</option>
            {cashHolders.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.holderName})</option>
            ))}
          </select>
        </div>
      )}

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium text-gray-700">Keterangan</label>
        <input
          id="description"
          name="description"
          type="text"
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Contoh: Infak Jumat 21 Juni"
        />
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <label htmlFor="transactionDate" className="text-sm font-medium text-gray-700">Tanggal</label>
        <input
          id="transactionDate"
          name="transactionDate"
          type="date"
          required
          defaultValue={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Notes (optional) */}
      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-gray-700">
          Catatan <span className="text-gray-400 font-normal">(opsional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          placeholder="Catatan tambahan..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
      >
        {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
      </button>
    </form>
  )
}
