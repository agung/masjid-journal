'use client'

import { ClerkProvider as Provider } from '@clerk/react'

export function ClerkProvider({ children, publishableKey }: { children: React.ReactNode; publishableKey: string }) {
  return (
    <Provider publishableKey={publishableKey}>
      {children}
    </Provider>
  )
}
