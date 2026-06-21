'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface Account {
  id: string
  name: string
  kind: string
}

interface LedgerFiltersProps {
  accounts: Account[]
  currentYear: number
  currentMonth: number
  currentAccountId?: string
  currentType?: string
}

export function LedgerFilters({
  accounts,
  currentYear,
  currentMonth,
  currentAccountId,
  currentType,
}: LedgerFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams()
      const merged = {
        year: String(currentYear),
        month: String(currentMonth),
        accountId: currentAccountId,
        type: currentType,
        ...overrides,
      }
      for (const [k, v] of Object.entries(merged)) {
        if (v) params.set(k, v)
      }
      return `/transactions?${params.toString()}`
    },
    [currentYear, currentMonth, currentAccountId, currentType]
  )

  // Build prev/next month
  const prevDate = new Date(currentYear, currentMonth - 2) // -2 because month is 1-indexed
  const currDate = new Date(currentYear, currentMonth - 1)
  const nextDate = new Date(currentYear, currentMonth)

  const months = [
    { year: prevDate.getFullYear(), month: prevDate.getMonth() + 1 },
    { year: currDate.getFullYear(), month: currDate.getMonth() + 1 },
    { year: nextDate.getFullYear(), month: nextDate.getMonth() + 1 },
  ]

  const TRANSACTION_TYPES = [
    { value: '', label: 'Semua Tipe' },
    { value: 'income', label: 'Pemasukan' },
    { value: 'expense', label: 'Pengeluaran' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'deposit', label: 'Setor Bank' },
    { value: 'withdrawal', label: 'Tarik Tunai' },
  ]

  return (
    <div className="space-y-3 mb-4">
      {/* Month tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {months.map((m) => {
          const isActive = m.year === currentYear && m.month === currentMonth
          const label = new Date(m.year, m.month - 1).toLocaleString('id-ID', {
            month: 'short',
            year: 'numeric',
          })
          return (
            <button
              key={`${m.year}-${m.month}`}
              type="button"
              onClick={() =>
                router.push(
                  buildUrl({ year: String(m.year), month: String(m.month) })
                )
              }
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Account + type filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <select
          value={currentAccountId ?? ''}
          onChange={(e) =>
            router.push(buildUrl({ accountId: e.target.value || undefined }))
          }
          className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none min-h-[44px] shrink-0"
        >
          <option value="">Semua Akun</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.kind === 'cash_holder' ? '💰' : '🏦'} {a.name}
            </option>
          ))}
        </select>

        <select
          value={currentType ?? ''}
          onChange={(e) =>
            router.push(buildUrl({ type: e.target.value || undefined }))
          }
          className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none min-h-[44px] shrink-0"
        >
          {TRANSACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
