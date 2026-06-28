'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTransaction, updateTransaction } from '@/lib/server/transactions'
import { ProofUpload, type ProofUploadResult } from '@/components/transactions/proof-upload'
import { TRANSACTION_TYPE_CONFIG } from '@/lib/transaction-icons'
import type { MasjidAccount, Category, Transaction } from '@/drizzle/schema'
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
import { DatePicker } from '@/components/ui/date-picker'

type TransactionType = 'income' | 'expense' | 'transfer' | 'deposit' | 'withdrawal'

const TRANSACTION_TYPES = (
  ['income', 'expense', 'transfer', 'deposit', 'withdrawal'] as TransactionType[]
).map((type) => ({ type, ...TRANSACTION_TYPE_CONFIG[type] }))

interface TransactionFormProps {
  accounts: MasjidAccount[]
  categories: Category[]
  userRole?: string
  userId?: string
  transaction?: Transaction & { movements: { id: string; direction: 'in' | 'out'; amount: number; signedAmount: number; balanceBefore: number; balanceAfter: number; accountId: string; accountName: string; accountKind: string }[] }
}

export function TransactionForm({ accounts, categories, userRole, userId, transaction }: TransactionFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(transaction ? 2 : 1)
  const [type, setType] = useState<TransactionType | null>(transaction ? (transaction.type as TransactionType) : null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [proof, setProof] = useState<ProofUploadResult | null>(
    transaction?.proofStoragePath
      ? { fileId: transaction.proofStoragePath, webViewLink: transaction.proofPublicUrl ?? '', webContentLink: '' }
      : null
  )
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [sourceAccountId, setSourceAccountId] = useState(
    transaction?.movements?.find((m) => m.direction === 'out')?.accountId ?? ''
  )
  const [targetAccountId, setTargetAccountId] = useState(
    transaction?.movements?.find((m) => m.direction === 'in')?.accountId ?? ''
  )
  const [transactionDate, setTransactionDate] = useState<Date>(
    transaction ? new Date(transaction.transactionDate) : new Date()
  )

  const isUserRestricted = userRole === 'admin' || userRole === 'treasurer'

  // Find the active user's cash holder account
  const userCashAccount = accounts.find(
    (a) => a.holderUserId === userId && a.kind === 'cash_holder' && a.isActive
  )

  const allowedTypes = TRANSACTION_TYPES.filter((t) => {
    if (isUserRestricted) {
      return t.type === 'income' || t.type === 'expense'
    }
    return true
  })

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

    // Client-side validation: Insufficient balance for restricted users
    if (isUserRestricted && type === 'expense' && userCashAccount) {
      const amountVal = get('amount')
      const amountNum = parseInt(amountVal.replace(/[^0-9]/g, ''), 10) || 0
      if (userCashAccount.balance < amountNum) {
        setError(
          `Saldo Anda tidak mencukupi. Saldo kas Anda: Rp ${userCashAccount.balance.toLocaleString(
            'id-ID'
          )}`
        )
        setLoading(false)
        return
      }
    }

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

      let finalSourceAccountId = sourceAccountId
      let finalTargetAccountId = targetAccountId

      if (isUserRestricted && userCashAccount) {
        if (type === 'income') {
          finalTargetAccountId = userCashAccount.id
        } else if (type === 'expense') {
          finalSourceAccountId = userCashAccount.id
        }
      }

      switch (type) {
        case 'income':
          input = { ...common, type: 'income', categoryId, targetAccountId: finalTargetAccountId }
          break
        case 'expense':
          input = { ...common, type: 'expense', categoryId, sourceAccountId: finalSourceAccountId }
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

      const result = transaction
        ? await updateTransaction(transaction.id, input!)
        : await createTransaction(input!)
      if (!result.success) {
        setError(result.error)
        return
      }

      if (transaction) {
        router.push(`/transactions/${transaction.id}`)
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Terjadi kesalahan. Silakan coba lagi.'
      setError(errMsg)
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
          {allowedTypes.map((t) => {
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

  // Render error screen if user has no cash holder account assigned
  if (isUserRestricted && !userCashAccount) {
    return (
      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 text-orange-850 text-sm rounded-2xl p-4 dark:bg-orange-950/30 dark:border-orange-900/50 dark:text-orange-350">
          <h3 className="font-semibold mb-1">Akun Kas Tidak Ditemukan</h3>
          <p className="text-xs leading-relaxed">
            Anda belum memiliki akun pemegang kas yang aktif dalam sistem. Silakan hubungi Owner/Admin untuk membuatkan akun kas atas nama Anda sebelum mencatat transaksi.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-sm transition-colors"
        >
          Kembali
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type badge */}
      <div className="flex items-center gap-3">
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
            defaultValue={transaction ? formatAmount(String(transaction.amount)) : undefined}
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

      {/* Accounts & Source/Target controls based on user role */}
      {isUserRestricted ? (
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Akun Kas Anda</span>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm font-medium">
            💰 {userCashAccount!.name} <span className="text-gray-400 dark:text-gray-500 font-normal">({userCashAccount!.holderName})</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Saldo: {userCashAccount!.balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Source account (Owner/Superadmin only) */}
          {(type === 'expense' || type === 'transfer') && (
            <div className="space-y-1.5">
              <label htmlFor="sourceAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Dari Pemegang Kas</label>
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
              <label htmlFor="sourceAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Dari Pemegang Kas</label>
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
              <label htmlFor="sourceAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Dari Rekening Bank</label>
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

          {/* Target account (Owner/Superadmin only) */}
          {type === 'income' && (
            <div className="space-y-1.5">
              <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Ke Akun</label>
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
              <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Ke Pemegang Kas</label>
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
              <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Ke Rekening Bank</label>
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
              <label htmlFor="targetAccountId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Ke Pemegang Kas</label>
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
        </>
      )}

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Keterangan</label>
        <Input
          id="description"
          name="description"
          type="text"
          required
          defaultValue={transaction?.description}
          placeholder="Contoh: Infak Jumat 21 Juni"
        />
      </div>

      {/* Date */}
      <div className="space-y-1.5 flex flex-col">
        <label htmlFor="transactionDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal</label>
        <DatePicker date={transactionDate} setDate={(d) => d && setTransactionDate(d)} />
        <input
          type="hidden"
          name="transactionDate"
          value={
            transactionDate
              ? `${transactionDate.getFullYear()}-${String(
                  transactionDate.getMonth() + 1
                ).padStart(2, '0')}-${String(transactionDate.getDate()).padStart(2, '0')}`
              : ''
          }
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
          defaultValue={transaction?.notes ?? undefined}
          className="resize-none"
          placeholder="Catatan tambahan..."
        />
      </div>

      {/* Proof upload */}
      <ProofUpload
        onUploaded={(result) => setProof(result)}
        onClear={() => setProof(null)}
        initialPreview={transaction?.proofPublicUrl}
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
