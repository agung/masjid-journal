import { requireRole } from '@/lib/auth/guards'
import { AccountForm } from '@/components/accounts/account-form'

export default async function NewAccountPage() {
  await requireRole('admin')

  return (
    <div className="p-4 max-w-md mx-auto">
      <AccountForm />
    </div>
  )
}
