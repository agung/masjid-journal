import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { updateOrganizationNameAction } from '@/lib/server/organizations'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function OrganizationSettingsPage() {
  const ctx = await getActiveOrganizationContext()

  if (!ctx.organization) {
    redirect('/dashboard')
  }

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <div className="flex items-center mb-6">
        <Link href="/settings" className="text-gray-500 hover:text-gray-700 mr-3">←</Link>
        <h1 className="text-xl font-bold">Profil Masjid</h1>
      </div>

      <form action={async (fd) => { await updateOrganizationNameAction(fd) }} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">Nama Masjid</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={ctx.organization.name}
            className="w-full px-3 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Slug</label>
          <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2.5 rounded-xl">{ctx.organization.slug}</p>
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
  )
}
