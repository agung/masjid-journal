'use client'

import { ClerkProvider as Provider } from '@clerk/react'
import { idID } from '@clerk/localizations'

const authLocalization = {
  ...idID,
  formFieldInputPlaceholder__emailAddress: 'nama@email.com',
  formFieldInputPlaceholder__password: 'Masukkan password',
  formFieldInputPlaceholder__signUpPassword: 'Buat password',
  signIn: {
    ...idID.signIn,
    start: {
      ...(idID.signIn?.start ?? {}),
      title: 'Masuk ke akun Anda',
      subtitle: 'Selamat datang kembali. Lanjutkan mengelola keuangan masjid.',
    },
  },
  signUp: {
    ...idID.signUp,
    start: {
      ...(idID.signUp?.start ?? {}),
      title: 'Buat akun Masjidku',
      subtitle: 'Mulai kelola pencatatan dan laporan keuangan masjid bersama tim Anda.',
      subtitleCombined: 'Mulai kelola pencatatan dan laporan keuangan masjid bersama tim Anda.',
    },
  },
}

export function ClerkProvider({ children, publishableKey }: { children: React.ReactNode; publishableKey: string }) {
  return (
    <Provider publishableKey={publishableKey} localization={authLocalization}>
      {children}
    </Provider>
  )
}
