'use client'

import { UserProfileAccountPanel, UserProfileProvider, UserProfileSecurityPanel } from '@clerk/ui/experimental'
import * as Tabs from '@radix-ui/react-tabs'
import { ShieldCheck, UserRound } from 'lucide-react'

const clerkAppearance = {
  variables: {
    colorPrimary: '#249361',
    borderRadius: '0.75rem',
    colorInputBackground: 'transparent',
    colorInputText: 'hsl(var(--foreground))',
  },
  elements: {
    card: 'w-full border-0 bg-transparent p-0 shadow-none',
    cardBox: 'w-full border-0 bg-transparent p-0 shadow-none',
    headerTitle: 'text-base font-semibold text-gray-900 dark:text-gray-100',
    headerSubtitle: 'text-sm text-gray-500 dark:text-gray-400',
    profileSectionTitle: 'text-sm font-semibold text-gray-900 dark:text-gray-100',
    profileSectionSubtitle: 'text-sm text-gray-500 dark:text-gray-400',
    formFieldLabel: 'text-sm font-medium text-gray-700 dark:text-gray-300',
    formButtonPrimary: 'h-11 rounded-xl bg-green-600 text-sm font-medium shadow-none hover:bg-green-700',
    profileSectionPrimaryButton: 'h-11 rounded-xl bg-green-600 text-sm font-medium shadow-none hover:bg-green-700',
    profileSectionSecondaryButton: 'h-11 rounded-xl border-gray-200 text-sm font-medium dark:border-gray-800',
    navbarButton: 'rounded-xl text-sm',
    navbarButton__active: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
    dividerLine: 'bg-gray-200 dark:bg-gray-800',
    dividerText: 'text-gray-500 dark:text-gray-400',
    footer: 'hidden',
  },
}

export function ClerkProfile() {
  return (
    <UserProfileProvider appearance={clerkAppearance}>
      <div className="clerk-profile">
        <Tabs.Root defaultValue="profile" className="space-y-4">
        <Tabs.List aria-label="Pengaturan akun" className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900">
          <Tabs.Trigger
            value="profile"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-500 transition-colors data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm dark:text-gray-400 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-green-400"
          >
            <UserRound size={16} /> Profil
          </Tabs.Trigger>
          <Tabs.Trigger
            value="security"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-500 transition-colors data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm dark:text-gray-400 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-green-400"
          >
            <ShieldCheck size={16} /> Keamanan
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="profile" className="rounded-2xl border bg-white p-4 shadow-sm focus-visible:outline-none dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Profil akun</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola informasi profil, email, foto, dan akun yang terhubung.</p>
          </div>
          <UserProfileAccountPanel />
        </Tabs.Content>

        <Tabs.Content value="security" className="rounded-2xl border bg-white p-4 shadow-sm focus-visible:outline-none dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Keamanan akun</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola password, passkey, autentikasi dua faktor, dan sesi aktif.</p>
          </div>
          <UserProfileSecurityPanel />
        </Tabs.Content>
        </Tabs.Root>
      </div>
    </UserProfileProvider>
  )
}
