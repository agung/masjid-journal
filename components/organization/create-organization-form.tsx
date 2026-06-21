'use client'

import { useState } from 'react'
import { createOrganizationAction } from '@/lib/server/organizations'

export function CreateOrganizationForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      await createOrganizationAction(formData)
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
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          Nama Masjid / Organisasi
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoFocus
          className="w-full px-3 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
