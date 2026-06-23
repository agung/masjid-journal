'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { updateNameAction, changePasswordAction } from '@/lib/server/profile'
import { Input } from '@/components/ui/input'

interface ProfileFormProps {
  name: string
  email: string
  hasPassword: boolean
}

export function ProfileForm({ name, email, hasPassword }: ProfileFormProps) {
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

    const res = await changePasswordAction({
      currentPassword: hasPassword ? currentPassword : undefined,
      newPassword,
      confirmPassword,
    })
    if (!res.success) {
      setPwError(res.error)
      setPwStatus('idle')
      return
    }
    setPwStatus('success')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    router.refresh()
    setTimeout(() => setPwStatus('idle'), 2500)
  }

  return (
    <div className="space-y-6">
      {/* ── Account info (read-only) ── */}
      <div className="bg-white border rounded-2xl p-4 flex items-center gap-3 dark:bg-gray-900">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg shrink-0">
          {formName?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate dark:text-gray-100">{formName || name}</p>
          <p className="text-sm text-gray-500 truncate dark:text-gray-400">{email}</p>
        </div>
      </div>

      {/* ── Edit name ── */}
      <form onSubmit={handleNameSubmit} className="bg-white border rounded-2xl p-4 space-y-4 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ubah Nama</h2>

        {nameError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            {nameError}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="profile-name" className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
            Nama Lengkap
          </label>
          <Input
            id="profile-name"
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            disabled={nameStatus === 'loading'}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
            Email
          </label>
          <Input
            type="email"
            value={email}
            disabled
          />
          <p className="text-xs text-gray-400 dark:text-gray-500">Email tidak dapat diubah.</p>
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

      {/* ── Change or set password ── */}
      <form onSubmit={handlePasswordSubmit} className="bg-white border rounded-2xl p-4 space-y-4 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {hasPassword ? 'Ubah Password' : 'Buat Password'}
        </h2>

        {pwError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
            {pwError}
          </div>
        )}

        {pwStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl px-3 py-2 flex items-center gap-1.5 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400">
            <Check size={13} /> {hasPassword ? 'Password berhasil diubah.' : 'Password berhasil dibuat.'}
          </div>
        )}

        {/* Current password (only if user has an existing password) */}
        {hasPassword && (
          <div className="space-y-1.5">
            <label htmlFor="current-pw" className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
              Password Saat Ini
            </label>
            <div className="relative">
              <Input
                id="current-pw"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={pwStatus === 'loading'}
                className="pr-10"
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
        )}

        {/* New password */}
        <div className="space-y-1.5">
          <label htmlFor="new-pw" className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
            Password Baru
          </label>
          <div className="relative">
            <Input
              id="new-pw"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              disabled={pwStatus === 'loading'}
              className="pr-10"
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
          <label htmlFor="confirm-pw" className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
            Konfirmasi Password Baru
          </label>
          <Input
            id="confirm-pw"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={pwStatus === 'loading'}
            placeholder="Ulangi password baru"
          />
        </div>

        <button
          type="submit"
          disabled={pwStatus !== 'idle' || (hasPassword && !currentPassword) || newPassword.length < 8 || !confirmPassword}
          className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          {pwStatus === 'loading' ? (
            <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
          ) : pwStatus === 'success' ? (
            <><Check size={15} /> Tersimpan</>
          ) : (
            hasPassword ? 'Ubah Password' : 'Buat Password'
          )}
        </button>
      </form>
    </div>
  )
}
