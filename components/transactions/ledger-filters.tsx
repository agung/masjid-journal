'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  onFilterChange?: (url: string) => void
}

export function LedgerFilters({
  accounts,
  currentYear,
  currentMonth,
  currentAccountId,
  currentType,
  onFilterChange,
}: LedgerFiltersProps) {
  const router = useRouter()

  // Local state to instantly update the UI selection on client-side
  const [selectedAccountId, setSelectedAccountId] = useState(currentAccountId ?? '')
  const [selectedType, setSelectedType] = useState(currentType ?? '')
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  // Sync state with props when they change (e.g. initial render or URL change)
  useEffect(() => {
    setSelectedAccountId(currentAccountId ?? '')
  }, [currentAccountId])

  useEffect(() => {
    setSelectedType(currentType ?? '')
  }, [currentType])

  useEffect(() => {
    setSelectedYear(currentYear)
    setSelectedMonth(currentMonth)
  }, [currentYear, currentMonth])

  const navigate = useCallback((url: string) => {
    if (onFilterChange) {
      onFilterChange(url)
    } else {
      router.push(url)
    }
  }, [router, onFilterChange])

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
          const isActive = m.year === selectedYear && m.month === selectedMonth
          const label = new Date(m.year, m.month - 1).toLocaleString('id-ID', {
            month: 'short',
            year: 'numeric',
          })
          return (
            <button
              key={`${m.year}-${m.month}`}
              type="button"
              onClick={() => {
                setSelectedYear(m.year)
                setSelectedMonth(m.month)
                navigate(
                  buildUrl({ year: String(m.year), month: String(m.month) })
                )
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Account + type filters */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={selectedAccountId}
            onValueChange={(v) => {
              setSelectedAccountId(v)
              navigate(buildUrl({ accountId: v || undefined }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Akun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Akun</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.kind === 'cash_holder' ? '💰' : '🏦'} {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select
            value={selectedType}
            onValueChange={(v) => {
              setSelectedType(v)
              navigate(buildUrl({ type: v || undefined }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
