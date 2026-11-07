'use client'

import { SignIn } from '@clerk/react'
import { clerkAuthAppearance } from '@/components/auth/clerk-auth-appearance'

export function ClerkSignIn({ forceRedirectUrl, signUpUrl }: { forceRedirectUrl: string; signUpUrl: string }) {
  return <div className="clerk-auth w-full"><SignIn appearance={clerkAuthAppearance} forceRedirectUrl={forceRedirectUrl} signUpUrl={signUpUrl} /></div>
}
