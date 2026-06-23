'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCashHolder, createBankAccount } from '@/lib/server/accounts'
import { Input } from '@/components/ui/input'

type AccountKind = 'cash_holder' | 'bank'

interface AccountFormProps {
  defaultKind?: AccountKind
}

export function AccountForm({ defaultKind = 'cash_holder' }: AccountFormProps) {
  const router = useRouter()
  const [kind, setKind] = useState<AccountKind>(defaultKind)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const fd = new FormData(form)
    const get = (key: string) => (fd.get(key) as string) ?? ''

    try {
      let result
      if (kind === 'cash_holder') {
        result = await createCashHolder({
          name: get('name'),
          holderName: get('holderName'),
          balance: get('balance'),
        })
      } else {
        result = await createBankAccount({
          name: get('name'),
          bankName: get('bankName'),
          accountNumber: get('accountNumber'),
          accountHolderName: get('accountHolderName'),
          balance: get('balance'),
        })
      }

      if (!result.success) {
        setError(result.error)
        return
      }

      router.push('/accounts')
      router.refresh()
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Kind Selector */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setKind('cash_holder')}
          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors ${
            kind === 'cash_holder'
              ? 'border-green-600 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-950/30 dark:text-green-400'
              : 'border text-gray-600 dark:text-gray-400'
          }`}
        >
          <div className="text-xl mb-1">💰</div>
          Pemegang Kas
        </button>
        <button
          type="button"
          onClick={() => setKind('bank')}
          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors ${
            kind === 'bank'
              ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400'
              : 'border text-gray-600 dark:text-gray-400'
          }`}
        >
          <div className="text-xl mb-1">🏦</div>
          Rekening Bank
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Common fields */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Nama Akun
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder={kind === 'cash_holder' ? 'Contoh: Kas Bendahara A' : 'Contoh: Rek BSI Masjid'}
        />
      </div>

      {/* Cash holder fields */}
      {kind === 'cash_holder' && (
        <div className="space-y-1.5">
          <label htmlFor="holderName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Nama Pemegang
          </label>
          <Input
            id="holderName"
            name="holderName"
            type="text"
            required
            placeholder="Contoh: Ahmad Fauzi"
          />
        </div>
      )}

      {/* Bank account fields */}
      {kind === 'bank' && (
        <>
          <div className="space-y-1.5">
            <label htmlFor="bankName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama Bank
            </label>
            <Input
              id="bankName"
              name="bankName"
              type="text"
              required
              placeholder="Contoh: BSI, BRI, Mandiri"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="accountNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nomor Rekening
            </label>
            <Input
              id="accountNumber"
              name="accountNumber"
              type="text"
              inputMode="numeric"
              required
              placeholder="Contoh: 7123456789"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="accountHolderName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama Pemilik Rekening
            </label>
            <Input
              id="accountHolderName"
              name="accountHolderName"
              type="text"
              required
              placeholder="Sesuai buku tabungan"
            />
          </div>
        </>
      )}

      {/* Initial balance */}
      <div className="space-y-1.5">
        <label htmlFor="balance" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Saldo Awal
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
          <Input
            id="balance"
            name="balance"
            type="text"
            inputMode="numeric"
            defaultValue="0"
            className="pl-9"
            placeholder="0"
          />
        </div>
        <p className="text-xs text-gray-500">Isi jika ada saldo awal sebelum sistem ini digunakan</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors"
      >
        {loading ? 'Menyimpan...' : 'Simpan Akun'}
      </button>
    </form>
  )
}
