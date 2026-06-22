'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { updateNameAction, changePasswordAction } from '@/lib/server/profile'

interface ProfileFormProps {
  name: string
  email: string
}

export function ProfileForm({ name, email }: ProfileFormProps) {
  const router = useRouter()

  // ── name form
  const [formName, setFormName] = useState(name)
  const [nameStatus, setNameStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [nameError, setNameError] = useState<string | null>(null)

  // ── password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwStatus, setPwStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [pwError, setPwError] = useState<string | null>(null)

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nameStatus !== 'idle') return
    setNameError(null)
    setNameStatus('loading')

    const res = await updateNameAction({ name: formName })
    if (!res.success) {
      setNameError(res.error)
      setNameStatus('idle')
      return
    }
    setNameStatus('success')
    router.refresh()
    setTimeout(() => setNameStatus('idle'), 2500)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pwStatus !== 'idle') return
    setPwError(null)
    setPwStatus('loading')

    const res = await changePasswordAction({ currentPassword, newPassword, confirmPassword })
    if (!res.success) {
      setPwError(res.error)
      setPwStatus('idle')
      return
    }
    setPwStatus('success')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPwStatus('idle'), 2500)
  }

  return (
    <div className="space-y-6">
      {/* ── Account info (read-only) ── */}
      <div className="bg-white border rounded-2xl p-4 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg shrink-0">
          {formName?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{formName || name}</p>
          <p className="text-sm text-gray-500 truncate">{email}</p>
        </div>
      </div>

      {/* ── Edit name ── */}
      <form onSubmit={handleNameSubmit} className="bg-white border rounded-2xl p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Ubah Nama</h2>

        {nameError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">
            {nameError}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="profile-name" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Nama Lengkap
          </label>
          <input
            id="profile-name"
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            disabled={nameStatus === 'loading'}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400">Email tidak dapat diubah.</p>
        </div>

        <button
          type="submit"
          disabled={nameStatus !== 'idle' || formName.trim() === name}
          className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          {nameStatus === 'loading' ? (
            <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
          ) : nameStatus === 'success' ? (
            <><Check size={15} /> Tersimpan</>
          ) : (
            'Simpan Nama'
          )}
        </button>
      </form>

      {/* ── Change password ── */}
      <form onSubmit={handlePasswordSubmit} className="bg-white border rounded-2xl p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Ubah Password</h2>

        {pwError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">
            {pwError}
          </div>
        )}

        {pwStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl px-3 py-2 flex items-center gap-1.5">
            <Check size={13} /> Password berhasil diubah.
          </div>
        )}

        {/* Current password */}
        <div className="space-y-1.5">
          <label htmlFor="current-pw" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Password Saat Ini
          </label>
          <div className="relative">
            <input
              id="current-pw"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={pwStatus === 'loading'}
              className="w-full px-3 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              tabIndex={-1}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <label htmlFor="new-pw" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Password Baru
          </label>
          <div className="relative">
            <input
              id="new-pw"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              disabled={pwStatus === 'loading'}
              className="w-full px-3 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 transition-all"
              placeholder="Minimal 8 karakter"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              tabIndex={-1}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label htmlFor="confirm-pw" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Konfirmasi Password Baru
          </label>
          <input
            id="confirm-pw"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={pwStatus === 'loading'}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 transition-all"
            placeholder="Ulangi password baru"
          />
        </div>

        <button
          type="submit"
          disabled={pwStatus !== 'idle' || !currentPassword || newPassword.length < 8 || !confirmPassword}
          className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          {pwStatus === 'loading' ? (
            <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
          ) : pwStatus === 'success' ? (
            <><Check size={15} /> Tersimpan</>
          ) : (
            'Ubah Password'
          )}
        </button>
      </form>
    </div>
  )
}
