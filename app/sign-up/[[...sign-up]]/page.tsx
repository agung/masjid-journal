import { AuthPageLayout } from '@/components/auth/auth-page-layout'
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
    <AuthPageLayout>
      {invite?.success && <p className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">Anda diundang bergabung dengan <strong>{invite.organizationName}</strong> sebagai <strong>{ROLE_LABEL[invite.role] ?? invite.role}</strong>. Gunakan email undangan saat membuat akun.</p>}
      <ClerkSignUp forceRedirectUrl={forceRedirectUrl} signInUrl={invite_token ? `/sign-in?invite_token=${encodeURIComponent(invite_token)}` : '/sign-in'} />
    </AuthPageLayout>
  )
}
