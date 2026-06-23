'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Home, PlusCircle, ReceiptText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/transactions', label: 'Ledger', icon: ReceiptText },
  { href: '/transactions/new', label: 'Input', icon: PlusCircle, primary: true },
  { href: '/reports', label: 'Laporan', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t pb-[env(safe-area-inset-bottom)] no-print dark:bg-gray-900">
      <div className="grid grid-cols-5 max-w-2xl mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center py-2 text-xs font-medium text-green-600"
              >
                <div className="-mt-6 h-14 w-14 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-900">
                  <Icon size={30} />
                </div>
                <span className="mt-1">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors',
                active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
