import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { updateOrganizationNameAction } from '@/lib/server/organizations'
import { redirect } from 'next/navigation'

export default async function OrganizationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const ctx = await getActiveOrganizationContext()
  const params = await searchParams
  const saved = params.saved === '1'

  if (!ctx.organization) {
    redirect('/dashboard')
  }

  return (
    <div className="p-4 max-w-md mx-auto pb-24">

      {saved && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl dark:bg-green-950 dark:border-green-900 dark:text-green-400">
          ✓ Perubahan berhasil disimpan
        </div>
      )}

      <form action={updateOrganizationNameAction} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Masjid</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={ctx.organization.name}
            className="w-full px-3 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
          <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2.5 rounded-xl dark:text-gray-400 dark:bg-gray-800">{ctx.organization.slug}</p>
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
