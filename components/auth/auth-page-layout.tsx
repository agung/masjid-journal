import type { ReactNode } from 'react'
import { AppLogo } from '@/components/ui/app-logo'

export function AuthPageLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <main className="grid min-h-svh place-items-center bg-gray-50 px-4 py-8 text-gray-900 dark:bg-[#121212] dark:text-gray-100 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex w-full justify-center sm:mb-7">
          <AppLogo size={48} layout="horizontal" showTagline={false} />
        </div>
        <div className="w-full">
          {children}
        </div>
      </div>
    </main>
  )
}
