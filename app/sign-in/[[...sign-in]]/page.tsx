import { AppLogo } from '@/components/ui/app-logo'
import { ClerkSignIn } from '@/components/auth/clerk-sign-in'

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ invite_token?: string }> }) {
  const { invite_token } = await searchParams
  const forceRedirectUrl = invite_token
    ? `/accept-invite?invite_token=${encodeURIComponent(invite_token)}`
    : '/dashboard'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md flex flex-col items-center gap-5">
        <AppLogo size={64} layout="horizontal" />
        <ClerkSignIn forceRedirectUrl={forceRedirectUrl} signUpUrl={invite_token ? `/sign-up?invite_token=${encodeURIComponent(invite_token)}` : '/sign-up'} />
      </div>
    </div>
  )
}
