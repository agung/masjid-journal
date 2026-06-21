import { requireRole } from '@/lib/auth/guards'
import { listAccounts } from '@/lib/server/accounts'
import { listCategories } from '@/lib/server/categories'
import { TransactionForm } from '@/components/transactions/transaction-form'
import type { MasjidAccount, Category } from '@/drizzle/schema'
import Link from 'next/link'

export default async function NewTransactionPage() {
  const session = await requireRole('treasurer')
  const orgId = session.activeOrganizationId!

  const [rawAccounts, categories] = await Promise.all([
    listAccounts(orgId),
    listCategories({ organizationId: orgId }),
  ])

  // listAccounts returns extra computed field currentBalance; cast to base type for form
  const accounts = rawAccounts as unknown as MasjidAccount[]

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <div className="mb-6 flex items-center">
        <Link href="/transactions" className="text-gray-500 hover:text-gray-700 mr-3">
          ←
        </Link>
        <h1 className="text-xl font-bold">Transaksi Baru</h1>
      </div>

      <TransactionForm accounts={accounts} categories={categories as Category[]} />
    </div>
  )
}
