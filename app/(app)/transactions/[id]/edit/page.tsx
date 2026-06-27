import { getActiveOrganizationContext } from '@/lib/auth/guards'
import { getTransactionById } from '@/lib/server/transactions'
import { listAccounts } from '@/lib/server/accounts'
import { listCategories } from '@/lib/server/categories'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { notFound, redirect } from 'next/navigation'
import type { Category, MasjidAccount } from '@/drizzle/schema'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditTransactionPage({ params }: Props) {
  const { id } = await params
  const ctx = await getActiveOrganizationContext()
  const orgId = ctx.activeOrganizationId
  const userRole = ctx.role
  const userId = ctx.session?.user?.id

  if (!orgId) notFound()

  const tx = await getTransactionById(id, orgId)
  if (!tx) notFound()

  // Enforce 1 hour limit
  const isWithin1Hour = (Date.now() - tx.createdAt.getTime()) < 60 * 60 * 1000
  if (!isWithin1Hour) {
    redirect(`/transactions/${id}`)
  }

  const [rawAccounts, categories] = await Promise.all([
    listAccounts(orgId),
    listCategories({ organizationId: orgId }),
  ])

  const accounts = rawAccounts as unknown as MasjidAccount[]

  return (
    <div className="p-4 max-w-md mx-auto pb-24 animate-in fade-in duration-200">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Transaksi</h1>
      </div>

      <TransactionForm
        accounts={accounts}
        categories={categories as Category[]}
        userRole={userRole ?? undefined}
        userId={userId ?? undefined}
        transaction={tx}
      />
    </div>
  )
}
