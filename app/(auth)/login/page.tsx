import { redirect } from 'next/navigation'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ invite_token?: string }> }) {
  const { invite_token } = await searchParams
  redirect(invite_token ? `/sign-in?invite_token=${encodeURIComponent(invite_token)}` : '/sign-in')
}
