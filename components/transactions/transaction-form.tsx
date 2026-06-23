'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTransaction } from '@/lib/server/transactions'
import { ProofUpload, type ProofUploadResult } from '@/components/transactions/proof-upload'
import { TRANSACTION_TYPE_CONFIG } from '@/lib/transaction-icons'
import type { MasjidAccount, Category } from '@/drizzle/schema'
import type { CreateTransactionInput } from '@/lib/validations/transaction'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type TransactionType = 'income' | 'expense' | 'transfer' | 'deposit' | 'withdrawal'

const TRANSACTION_TYPES = (
  ['income', 'expense', 'transfer', 'deposit', 'withdrawal'] as TransactionType[]
).map((type) => ({ type, ...TRANSACTION_TYPE_CONFIG[type] }))

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
  const [proof, setProof] = useState<ProofUploadResult | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [targetAccountId, setTargetAccountId] = useState('')

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
        proofStoragePath: proof?.fileId,
        proofPublicUrl: proof?.webViewLink,
      } as const

      switch (type) {
        case 'income':
          input = { ...common, type: 'income', categoryId, targetAccountId }
          break
        case 'expense':
          input = { ...common, type: 'expense', categoryId, sourceAccountId }
          break
        case 'transfer':
          input = { ...common, type: 'transfer', sourceAccountId, targetAccountId }
          break
        case 'deposit':
          input = { ...common, type: 'deposit', sourceAccountId, targetAccountId }
          break
        case 'withdrawal':
          input = { ...common, type: 'withdrawal', sourceAccountId, targetAccountId }
          break
      }

      const result = await createTransaction(input!)
      if (!result.success) {
        setError(result.error)
        return
      }

      router.push('/dashboard')
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
        <p className="text-sm text-gray-500 text-center dark:text-gray-400">Pilih jenis transaksi</p>
        <div className="grid grid-cols-1 gap-2">
          {TRANSACTION_TYPES.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => { setType(t.type); setCategoryId(''); setSourceAccountId(''); setTargetAccountId(''); setStep(2) }}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-colors hover:shadow-sm ${
                  type === t.type ? t.borderColor : 'border dark:hover:border-gray-500'
                }`}
              >
                <span className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${t.borderColor}`}>
                  <Icon size={22} />
                </span>
                <span className="font-semibold text-base">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Step 2: Transaction details ──
  const selectedType = TRANSACTION_TYPE_CONFIG[type!]
  const SelectedIcon = selectedType.icon

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type badge + back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => { setStep(1); setError(null) }}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none p-2 -ml-2 min-h-[44px] min-w-[44px]"
          aria-label="Kembali"
        >
          ←
        </button>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          selectedType.borderColor
        }`}>
          <SelectedIcon size={12} />
          {selectedType.label}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Amount */}
      <div className="space-y-1.5">
        <label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nominal</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium dark:text-gray-400">Rp</span>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="numeric"
            required
            onChange={(e) => { e.target.value = formatAmount(e.target.value) }}
            className="pl-10 text-lg font-bold"
            placeholder="0"
          />
        </div>
      </div>

      {/* Category (income / expense only) */}
      {(type === 'income' || type === 'expense') && (
        <div className="space-y-1.5">
          <label htmlFor="categoryId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Pilih kategori..." />
            </SelectTrigger>
            <SelectContent>
              {(type === 'income' ? incomeCategories : expenseCategories).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Source account */}
      {(type === 'expense' || type === 'transfer') && (
        <div className="space-y-1.5">
          <label htmlFor="sourceAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">DariPemegang Kas</label>
          <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
            <SelectTrigger id="sourceAccountId">
              <SelectValue placeholder="Pilih pemegang kas..." />
            </SelectTrigger>
            <SelectContent>
              {cashHolders.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name} ({a.holderName})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === 'deposit' && (
        <div className="space-y-1.5">
          <label htmlFor="sourceAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">DariPemegang Kas</label>
          <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
            <SelectTrigger id="sourceAccountId">
              <SelectValue placeholder="Pilih pemegang kas..." />
            </SelectTrigger>
            <SelectContent>
              {cashHolders.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name} ({a.holderName})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === 'withdrawal' && (
        <div className="space-y-1.5">
          <label htmlFor="sourceAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">DariRekening Bank</label>
          <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
            <SelectTrigger id="sourceAccountId">
              <SelectValue placeholder="Pilih rekening bank..." />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name} — {a.bankName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Target account */}
      {type === 'income' && (
        <div className="space-y-1.5">
          <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">KeAkun</label>
          <Select value={targetAccountId} onValueChange={setTargetAccountId}>
            <SelectTrigger id="targetAccountId">
              <SelectValue placeholder="Pilih akun penerima..." />
            </SelectTrigger>
            <SelectContent>
              {accounts.filter((a) => a.isActive).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.kind === 'cash_holder' ? 'Kas' : 'Bank'} — {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === 'transfer' && (
        <div className="space-y-1.5">
          <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">KePemegang Kas</label>
          <Select value={targetAccountId} onValueChange={setTargetAccountId}>
            <SelectTrigger id="targetAccountId">
              <SelectValue placeholder="Pilih pemegang kas..." />
            </SelectTrigger>
            <SelectContent>
              {cashHolders.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name} ({a.holderName})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === 'deposit' && (
        <div className="space-y-1.5">
          <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">KeRekening Bank</label>
          <Select value={targetAccountId} onValueChange={setTargetAccountId}>
            <SelectTrigger id="targetAccountId">
              <SelectValue placeholder="Pilih rekening bank..." />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name} — {a.bankName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === 'withdrawal' && (
        <div className="space-y-1.5">
          <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">KePemegang Kas</label>
          <Select value={targetAccountId} onValueChange={setTargetAccountId}>
            <SelectTrigger id="targetAccountId">
              <SelectValue placeholder="Pilih pemegang kas..." />
            </SelectTrigger>
            <SelectContent>
              {cashHolders.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name} ({a.holderName})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Keterangan</label>
        <Input
          id="description"
          name="description"
          type="text"
          required
          placeholder="Contoh: Infak Jumat 21 Juni"
        />
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <label htmlFor="transactionDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal</label>
        <Input
          id="transactionDate"
          name="transactionDate"
          type="date"
          required
          defaultValue={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Notes (optional) */}
      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Catatan <span className="text-gray-400 font-normal dark:text-gray-500">(opsional)</span>
        </label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          className="resize-none"
          placeholder="Catatan tambahan..."
        />
      </div>

      {/* Proof upload */}
      <ProofUpload
        onUploaded={(result) => setProof(result)}
        onClear={() => setProof(null)}
      />

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
