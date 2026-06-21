'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCashHolder, createBankAccount } from '@/lib/server/accounts'

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
          initialBalance: get('initialBalance'),
        })
      } else {
        result = await createBankAccount({
          name: get('name'),
          bankName: get('bankName'),
          accountNumber: get('accountNumber'),
          accountHolderName: get('accountHolderName'),
          initialBalance: get('initialBalance'),
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
              ? 'border-green-600 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
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
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <div className="text-xl mb-1">🏦</div>
          Rekening Bank
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Common fields */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          Nama Akun
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder={kind === 'cash_holder' ? 'Contoh: Kas Bendahara A' : 'Contoh: Rek BSI Masjid'}
        />
      </div>

      {/* Cash holder fields */}
      {kind === 'cash_holder' && (
        <div className="space-y-1.5">
          <label htmlFor="holderName" className="text-sm font-medium text-gray-700">
            Nama Pemegang
          </label>
          <input
            id="holderName"
            name="holderName"
            type="text"
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Contoh: Ahmad Fauzi"
          />
        </div>
      )}

      {/* Bank account fields */}
      {kind === 'bank' && (
        <>
          <div className="space-y-1.5">
            <label htmlFor="bankName" className="text-sm font-medium text-gray-700">
              Nama Bank
            </label>
            <input
              id="bankName"
              name="bankName"
              type="text"
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Contoh: BSI, BRI, Mandiri"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="accountNumber" className="text-sm font-medium text-gray-700">
              Nomor Rekening
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              type="text"
              inputMode="numeric"
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Contoh: 7123456789"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="accountHolderName" className="text-sm font-medium text-gray-700">
              Nama Pemilik Rekening
            </label>
            <input
              id="accountHolderName"
              name="accountHolderName"
              type="text"
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Sesuai buku tabungan"
            />
          </div>
        </>
      )}

      {/* Initial balance */}
      <div className="space-y-1.5">
        <label htmlFor="initialBalance" className="text-sm font-medium text-gray-700">
          Saldo Awal
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
          <input
            id="initialBalance"
            name="initialBalance"
            type="text"
            inputMode="numeric"
            defaultValue="0"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
