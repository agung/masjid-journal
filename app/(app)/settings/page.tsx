import { getActiveOrganizationContext } from '@/lib/auth/guards'
import Link from 'next/link'
import { ChevronRight, Users, Building2, Tag, Wallet, UserCircle, HardDrive, SunMoon } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default async function SettingsPage() {
  const ctx = await getActiveOrganizationContext()
  const session = ctx.session

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <h1 className="text-xl font-bold mb-6 dark:text-gray-100">Pengaturan</h1>

      {/* User info — tappable, navigates to profile edit */}
      <Link
        href="/settings/profile"
        className="bg-white border rounded-2xl p-4 mb-6 flex items-center gap-3 hover:bg-gray-50 transition-colors dark:bg-gray-900 dark:hover:bg-gray-800"
      >
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg shrink-0 dark:bg-green-900 dark:text-green-300">
          {session.user.name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate dark:text-gray-100">{session.user.name}</p>
          <p className="text-sm text-gray-500 truncate dark:text-gray-400">{session.user.email}</p>
          {ctx.role && (
            <p className="text-xs text-green-600 font-medium mt-0.5 capitalize">{ctx.role}</p>
          )}
        </div>
        <ChevronRight size={16} className="text-gray-400 shrink-0" />
      </Link>

      {/* Organization info */}
      {ctx.organization && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 dark:bg-green-950 dark:border-green-900">
          <p className="text-xs text-green-600 font-medium mb-0.5">Organisasi Aktif</p>
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">{ctx.organization.name}</p>
        </div>
      )}

      {/* Settings menu */}
      <div className="space-y-4">
        {ctx.organization && (
          <SettingsSection title="Organisasi">
            <SettingsItem href="/settings/organization" icon={Building2} label="Profil Masjid" />
            <SettingsItem href="/settings/members" icon={Users} label="Kelola Anggota" />
          </SettingsSection>
        )}

        <SettingsSection title="Sistem">
          <SettingsItem href="/settings/drive" icon={HardDrive} label="Penyimpanan Bukti" />
          <div className="flex items-center justify-between px-4 py-3.5 border-b last:border-b-0">
            <div className="flex items-center gap-3">
              <SunMoon size={18} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Tema</span>
            </div>
            <ThemeToggle />
          </div>
        </SettingsSection>

        <SettingsSection title="Akun">
          <SettingsItem href="/settings/profile" icon={UserCircle} label="Profil & Password" />
        </SettingsSection>

        <SettingsSection title="Master Data">
          <SettingsItem href="/accounts" icon={Wallet} label="Akun Keuangan" />
          <SettingsItem href="/categories" icon={Tag} label="Kategori" />
        </SettingsSection>

        {/* Logout */}
        <div className="pt-2">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}

function SettingsSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1.5">{title}</p>
      <div className="bg-white border rounded-xl overflow-hidden dark:bg-gray-900">{children}</div>
    </div>
  )
}

function SettingsItem({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3.5 border-b last:border-b-0 hover:bg-gray-50 transition-colors dark:hover:bg-gray-800"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
      </div>
      <ChevronRight size={16} className="text-gray-400" />
    </Link>
  )
}
