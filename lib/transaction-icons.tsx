import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Landmark,
  Banknote,
  SlidersHorizontal,
  Wallet,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type TransactionTypeName =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'deposit'
  | 'withdrawal'
  | 'adjustment'

export interface TransactionTypeConfig {
  label: string
  icon: ComponentType<LucideProps>
  color: string        // badge color classes
  borderColor: string  // for form card selectors
}

export const TRANSACTION_TYPE_CONFIG: Record<TransactionTypeName, TransactionTypeConfig> = {
  income: {
    label: 'Pemasukan',
    icon: ArrowDownToLine,
    color: 'bg-green-100 text-green-700',
    borderColor: 'border-green-500 bg-green-50 text-green-700',
  },
  expense: {
    label: 'Pengeluaran',
    icon: ArrowUpFromLine,
    color: 'bg-red-100 text-red-700',
    borderColor: 'border-red-500 bg-red-50 text-red-700',
  },
  transfer: {
    label: 'Transfer',
    icon: ArrowLeftRight,
    color: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-500 bg-blue-50 text-blue-700',
  },
  deposit: {
    label: 'Setor Bank',
    icon: Landmark,
    color: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-500 bg-purple-50 text-purple-700',
  },
  withdrawal: {
    label: 'Tarik Tunai',
    icon: Banknote,
    color: 'bg-orange-100 text-orange-700',
    borderColor: 'border-orange-500 bg-orange-50 text-orange-700',
  },
  adjustment: {
    label: 'Koreksi',
    icon: SlidersHorizontal,
    color: 'bg-gray-100 text-gray-700',
    borderColor: 'border-gray-400 bg-gray-50 text-gray-700',
  },
}

// Account kind icons
export { Wallet as CashHolderIcon, Landmark as BankIcon }
