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
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { type DateRange } from 'react-day-picker'

interface Account {
  id: string
  name: string
  kind: string
}

interface LedgerFiltersProps {
  accounts: Account[]
  startDate: string
  endDate: string
  currentAccountId?: string
  currentType?: string
  onFilterChange?: (url: string) => void
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatLocalDate(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function LedgerFilters({
  accounts,
  startDate,
  endDate,
  currentAccountId,
  currentType,
  onFilterChange,
}: LedgerFiltersProps) {
  const router = useRouter()

  // Local state to instantly update the UI selection on client-side
  const [selectedAccountId, setSelectedAccountId] = useState(currentAccountId ?? '')
  const [selectedType, setSelectedType] = useState(currentType ?? '')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: parseLocalDate(startDate),
    to: parseLocalDate(endDate),
  })

  // Sync state with props when they change (e.g. initial render or URL change)
  useEffect(() => {
    setSelectedAccountId(currentAccountId ?? '')
  }, [currentAccountId])

  useEffect(() => {
    setSelectedType(currentType ?? '')
  }, [currentType])

  useEffect(() => {
    setDateRange({
      from: parseLocalDate(startDate),
      to: parseLocalDate(endDate),
    })
  }, [startDate, endDate])

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
        startDate,
        endDate,
        accountId: currentAccountId,
        type: currentType,
        ...overrides,
      }
      for (const [k, v] of Object.entries(merged)) {
        if (v) params.set(k, v)
      }
      return `/transactions?${params.toString()}`
    },
    [startDate, endDate, currentAccountId, currentType]
  )

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      navigate(
        buildUrl({
          startDate: formatLocalDate(range.from),
          endDate: formatLocalDate(range.to),
        })
      )
    }
  }

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
      {/* Date Range Picker */}
      <div className="w-full">
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          placeholder="Filter rentang tanggal"
        />
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
