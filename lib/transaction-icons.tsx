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
    color: 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300',
    borderColor: 'border-green-500 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-950 dark:text-green-300',
  },
  expense: {
    label: 'Pengeluaran',
    icon: ArrowUpFromLine,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
    borderColor: 'border-red-500 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950 dark:text-red-300',
  },
  transfer: {
    label: 'Transfer',
    icon: ArrowLeftRight,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    borderColor: 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950 dark:text-blue-300',
  },
  deposit: {
    label: 'Setor Bank',
    icon: Landmark,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
    borderColor: 'border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-600 dark:bg-purple-950 dark:text-purple-300',
  },
  withdrawal: {
    label: 'Tarik Tunai',
    icon: Banknote,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300',
    borderColor: 'border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-950 dark:text-orange-300',
  },
  adjustment: {
    label: 'Koreksi',
    icon: SlidersHorizontal,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    borderColor: 'border-gray-400 bg-gray-50 text-gray-700 dark:border-gray-500 dark:bg-gray-900 dark:text-gray-300',
  },
}

// Account kind icons
export { Wallet as CashHolderIcon, Landmark as BankIcon }
