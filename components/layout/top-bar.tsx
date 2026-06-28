'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AppLogo } from '@/components/ui/app-logo'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Ledger',
  '/transactions/new': 'Transaksi Baru',
  '/accounts': 'Akun Keuangan',
  '/accounts/new': 'Tambah Akun',
  '/categories': 'Kategori',
  '/reports': 'Laporan',
  '/settings': 'Pengaturan',
  '/settings/organization': 'Profil Masjid',
  '/settings/members': 'Kelola Anggota',
}

export function TopBar({ orgName }: { orgName?: string }) {
  const pathname = usePathname()

  const isBack = pathname !== '/dashboard' && ![
    '/transactions', '/accounts', '/reports', '/settings',
  ].includes(pathname)

  const title = PAGE_TITLES[pathname] ?? process.env.NEXT_PUBLIC_APP_NAME ?? 'Keuangan Masjid'

  return (
    <header className="sticky top-0 z-40 bg-white border-b no-print dark:bg-gray-900">
      <div className="flex items-center h-14 px-4 max-w-2xl mx-auto gap-3">
        {isBack ? (
          <button
            type="button"
            onClick={() => window.history.back()}
            className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 -ml-1 shrink-0 dark:hover:bg-gray-800 dark:text-gray-400"
            aria-label="Kembali"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        ) : (
          <Link href="/dashboard" prefetch={true} className="shrink-0">
            <AppLogo size={32} layout="icon-only" />
          </Link>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate dark:text-gray-100">{title}</p>
          {pathname === '/dashboard' && orgName && (
            <p className="text-xs text-gray-500 truncate -mt-0.5 dark:text-gray-400">{orgName}</p>
          )}
        </div>
      </div>
    </header>
  )
}
