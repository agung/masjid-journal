import { AppLogo } from '@/components/ui/app-logo'
import { ClerkSignUp } from '@/components/auth/clerk-sign-up'
import { getInvitationAction } from '@/lib/server/invitations'

const ROLE_LABEL: Record<string, string> = { owner: 'Owner', admin: 'Admin', treasurer: 'Bendahara', viewer: 'Viewer' }

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ invite_token?: string }> }) {
  const { invite_token } = await searchParams
  const invite = invite_token ? await getInvitationAction(invite_token) : null
  const forceRedirectUrl = invite_token
    ? `/accept-invite?invite_token=${encodeURIComponent(invite_token)}`
    : '/dashboard'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md flex flex-col items-center gap-5">
        <AppLogo size={64} layout="horizontal" />
        {invite?.success && <p className="max-w-sm rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">Anda diundang bergabung dengan <strong>{invite.organizationName}</strong> sebagai <strong>{ROLE_LABEL[invite.role] ?? invite.role}</strong>. Gunakan email undangan saat membuat akun.</p>}
        <ClerkSignUp forceRedirectUrl={forceRedirectUrl} signInUrl={invite_token ? `/sign-in?invite_token=${encodeURIComponent(invite_token)}` : '/sign-in'} />
      </div>
    </div>
  )
}
