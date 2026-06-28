import { acceptInvitationAction, getInvitationAction } from '@/lib/server/invitations'
import { getSession } from '@/lib/auth/guards'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, LogOut } from 'lucide-react'
import { AppLogo } from '@/components/ui/app-logo'

interface AcceptInvitePageProps {
  searchParams: Promise<{ invite_token?: string }>
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const { invite_token: token } = await searchParams

  if (!token) {
    redirect('/dashboard')
  }

  // 1. Check authentication
  const session = await getSession()
  if (!session) {
    redirect(`/login?invite_token=${token}`)
  }

  // 2. Fetch/Validate invitation
  const inviteRes = await getInvitationAction(token)
  if (!inviteRes.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <AppLogo size={64} layout="horizontal" />
          </div>
          <div className="bg-white border rounded-2xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={40} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Undangan Tidak Valid</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {inviteRes.error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 3. Verify email matches logged-in user
  const loggedInEmail = session.user.email
  const invitedEmail = inviteRes.email

  if (invitedEmail !== 'any' && loggedInEmail.toLowerCase().trim() !== invitedEmail.toLowerCase().trim()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <AppLogo size={64} layout="horizontal" />
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 space-y-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={40} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Email Tidak Cocok</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Email Anda saat ini berbeda dengan email yang diundang
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl space-y-2 border dark:bg-gray-850 dark:border-gray-800">
              <div className="text-xs">
                <span className="font-semibold text-gray-400 uppercase tracking-wider block">Email Undangan:</span>
                <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{invitedEmail}</span>
              </div>
              <div className="text-xs">
                <span className="font-semibold text-gray-400 uppercase tracking-wider block">Email Anda Sekarang:</span>
                <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{loggedInEmail}</span>
              </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed text-center">
              Silakan keluar (logout) dari akun Anda sekarang, lalu mendaftar atau masuk menggunakan alamat email yang diundang.
            </div>

            <div className="pt-2">
              <Link
                href={`/login?invite_token=${token}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
              >
                <LogOut size={16} />
                Keluar & Masuk Akun Lain
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 4. Accept invitation and redirect to dashboard
  const acceptRes = await acceptInvitationAction(token)
  if (!acceptRes.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <AppLogo size={64} layout="horizontal" />
          </div>
          <div className="bg-white border rounded-2xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={40} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Gagal Menerima Undangan</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {acceptRes.error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  redirect('/dashboard')
}
