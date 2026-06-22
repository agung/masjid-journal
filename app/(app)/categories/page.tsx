import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { listCategories } from '@/lib/server/categories'
import { CategoryManager } from '@/components/categories/category-manager'
import { PERMISSIONS } from '@/lib/auth/roles'

export default async function CategoriesPage() {
  const ctx = await getActiveOrganizationContext()
  const orgId = ctx.activeOrganizationId
  const role = ctx.role

  const categories = orgId ? await listCategories({ organizationId: orgId }) : []
  const canManage = role ? PERMISSIONS.manageCategories(role) : false

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <CategoryManager initialCategories={categories} canManage={canManage} />
    </div>
  )
}

