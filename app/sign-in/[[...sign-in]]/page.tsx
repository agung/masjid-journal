import { AuthPageLayout } from '@/components/auth/auth-page-layout'
import { ClerkSignIn } from '@/components/auth/clerk-sign-in'

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ invite_token?: string }> }) {
  const { invite_token } = await searchParams
  const forceRedirectUrl = invite_token
    ? `/accept-invite?invite_token=${encodeURIComponent(invite_token)}`
    : '/dashboard'
  return (
    <AuthPageLayout>
      <ClerkSignIn forceRedirectUrl={forceRedirectUrl} signUpUrl={invite_token ? `/sign-up?invite_token=${encodeURIComponent(invite_token)}` : '/sign-up'} />
    </AuthPageLayout>
  )
}
