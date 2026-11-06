import { redirect } from 'next/navigation'

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ invite_token?: string }> }) {
  const { invite_token } = await searchParams
  redirect(invite_token ? `/sign-up?invite_token=${encodeURIComponent(invite_token)}` : '/sign-up')
}
