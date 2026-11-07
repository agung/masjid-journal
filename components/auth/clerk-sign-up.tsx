'use client'

import { SignUp } from '@clerk/react'
import { clerkAuthAppearance } from '@/components/auth/clerk-auth-appearance'

export function ClerkSignUp({ forceRedirectUrl, signInUrl }: { forceRedirectUrl: string; signInUrl: string }) {
  return <div className="clerk-auth w-full"><SignUp appearance={clerkAuthAppearance} forceRedirectUrl={forceRedirectUrl} signInUrl={signInUrl} /></div>
}
