'use client'

import { SignIn } from '@clerk/react'

export function ClerkSignIn({ forceRedirectUrl, signUpUrl }: { forceRedirectUrl: string; signUpUrl: string }) {
  return <SignIn forceRedirectUrl={forceRedirectUrl} signUpUrl={signUpUrl} />
}
