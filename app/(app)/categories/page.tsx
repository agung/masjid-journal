import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { listCategories } from '@/lib/server/categories'
import Link from 'next/link'

export default async function CategoriesPage() {
  const ctx = await getActiveOrganizationContext()
  const orgId = ctx.activeOrganizationId

  const categories = orgId ? await listCategories({ organizationId: orgId }) : []

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <div className="flex items-center mb-6">
        <Link href="/settings" className="text-gray-500 hover:text-gray-700 mr-3">←</Link>
        <h1 className="text-xl font-bold">Kategori</h1>
      </div>

      <section className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pemasukan</h2>
        <div className="bg-white border rounded-xl overflow-hidden">
          {incomeCategories.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Belum ada kategori pemasukan.</p>
          ) : (
            incomeCategories.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0">
                <span className="text-xl">{c.icon ?? '💰'}</span>
                <span className="text-sm font-medium text-gray-800">{c.name}</span>
                {c.isSystem && (
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Default</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pengeluaran</h2>
        <div className="bg-white border rounded-xl overflow-hidden">
          {expenseCategories.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Belum ada kategori pengeluaran.</p>
          ) : (
            expenseCategories.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0">
                <span className="text-xl">{c.icon ?? '💸'}</span>
                <span className="text-sm font-medium text-gray-800">{c.name}</span>
                {c.isSystem && (
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Default</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
