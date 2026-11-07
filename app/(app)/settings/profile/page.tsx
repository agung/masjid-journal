import { ClerkProfile } from '@/components/auth/clerk-profile'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profil & keamanan</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola informasi dan keamanan akun Anda.</p>
      </div>
      <ClerkProfile />
    </div>
  )
}
