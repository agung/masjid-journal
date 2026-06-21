import { requireRole } from '@/lib/auth/guards'
import { AccountForm } from '@/components/accounts/account-form'
import Link from 'next/link'

export default async function NewAccountPage() {
  await requireRole('admin')

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-6 flex items-center">
        <Link href="/accounts" className="text-gray-500 hover:text-gray-700 mr-3">
          ←
        </Link>
        <h1 className="text-xl font-bold">Tambah Akun</h1>
      </div>

      <AccountForm />
    </div>
  )
}
