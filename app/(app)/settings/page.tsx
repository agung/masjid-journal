import { requireAuth } from '@/lib/auth/guards'
import Link from 'next/link'
import { ChevronRight, Users, Building2, Tag } from 'lucide-react'

export default async function SettingsPage() {
  const session = await requireAuth()

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <h1 className="text-xl font-bold mb-6">Pengaturan</h1>

      {/* User info */}
      <div className="bg-white border rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
          {session.user.name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{session.user.name}</p>
          <p className="text-sm text-gray-500">{session.user.email}</p>
        </div>
      </div>

      {/* Settings menu */}
      <div className="space-y-2">
        <SettingsSection title="Organisasi">
          <SettingsItem href="/settings/organization" icon={Building2} label="Profil Masjid" />
          <SettingsItem href="/settings/members" icon={Users} label="Kelola Anggota" />
        </SettingsSection>

        <SettingsSection title="Master Data">
          <SettingsItem href="/accounts" icon={Tag} label="Akun Keuangan" />
          <SettingsItem href="/categories" icon={Tag} label="Kategori" />
        </SettingsSection>
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
      <div className="bg-white border rounded-xl overflow-hidden">{children}</div>
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
      className="flex items-center justify-between px-4 py-3.5 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-800">{label}</span>
      </div>
      <ChevronRight size={16} className="text-gray-400" />
    </Link>
  )
}
