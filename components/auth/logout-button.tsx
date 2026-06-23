'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'
import { LogOut, Loader2 } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    if (loading) return
    setLoading(true)
    try {
      await signOut()
      router.push('/login')
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed text-red-600 rounded-xl text-sm font-semibold transition-colors dark:bg-red-950/40 dark:hover:bg-red-950/70 dark:text-red-400 dark:border dark:border-red-800/40"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Keluar...
        </>
      ) : (
        <>
          <LogOut size={16} />
          Keluar
        </>
      )}
    </button>
  )
}
