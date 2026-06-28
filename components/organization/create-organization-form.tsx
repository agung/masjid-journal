'use client'

import { useState } from 'react'
import { createOrganizationAction } from '@/lib/server/organizations'
import { Input } from '@/components/ui/input'

export function CreateOrganizationForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createOrganizationAction(formData)

      // Handle returned error (not thrown)
      if (result && !result.success) {
        setError(result.error ?? 'Gagal membuat organisasi.')
        setLoading(false)
      }
    } catch (err) {
      // Next.js redirect throws NEXT_REDIRECT which is not an error
      if (
        err instanceof Error &&
        !err.message.includes('NEXT_REDIRECT')
      ) {
        setError(err.message ?? 'Gagal membuat organisasi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Nama Masjid / Organisasi
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          autoFocus
          placeholder="Contoh: Masjid Al-Ikhlas"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
      >
        {loading ? 'Membuat...' : 'Buat Organisasi'}
      </button>
    </form>
  )
}
