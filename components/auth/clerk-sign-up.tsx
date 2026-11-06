'use client'

import { SignUp } from '@clerk/react'

export function ClerkSignUp({ forceRedirectUrl, signInUrl }: { forceRedirectUrl: string; signInUrl: string }) {
  return <SignUp forceRedirectUrl={forceRedirectUrl} signInUrl={signInUrl} />
}
