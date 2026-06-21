import { format } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Format number as Indonesian Rupiah
 * e.g. 1500000 => "Rp 1.500.000"
 */
export function formatRupiah(amount: number | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Format signed amount with + or - prefix and color hint
 * e.g. 500000, 'in' => "+500.000"
 * e.g. 50000, 'out' => "-50.000"
 */
export function formatSignedAmount(amount: number | bigint, direction: 'in' | 'out'): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount
  const formatted = new Intl.NumberFormat('id-ID').format(num)
  return direction === 'in' ? `+${formatted}` : `-${formatted}`
}

/**
 * Format date as Indonesian locale short date
 * e.g. new Date() => "21 Jun 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd MMM yyyy', { locale: id })
}

/**
 * Format date as month/year label
 * e.g. new Date() => "Juni 2025"
 */
export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMMM yyyy', { locale: id })
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return `${text.slice(0, length)}…`
}
