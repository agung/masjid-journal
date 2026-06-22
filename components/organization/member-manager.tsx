'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Eye, EyeOff, Trash2, Edit2 } from 'lucide-react'
import { addMemberAction, updateMemberRoleAction, removeMemberAction } from '@/lib/server/organizations'
import type { Role } from '@/lib/auth/roles'

interface MemberWithUser {
  id: string
  role: string
  createdAt: Date
  userId: string
  userName: string
  userEmail: string
}

interface MemberManagerProps {
  initialMembers: MemberWithUser[]
  isOwner: boolean
  currentUserId: string
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  treasurer: 'Bendahara',
  viewer: 'Viewer',
}

const ROLES_OPTIONS = [
  { value: 'owner', label: 'Owner', desc: 'Akses penuh, kelola anggota, hapus data.' },
  { value: 'admin', label: 'Admin', desc: 'Kelola master data, transaksi, & laporan.' },
  { value: 'treasurer', label: 'Bendahara', desc: 'Input/ubah transaksi, upload bukti.' },
  { value: 'viewer', label: 'Viewer', desc: 'Lihat laporan, ledger, & dashboard saja.' },
] as const

export function MemberManager({ initialMembers, isOwner, currentUserId }: MemberManagerProps) {
  const router = useRouter()
  const [members, setMembers] = useState<MemberWithUser[]>(initialMembers)
  
  // Sheet states
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<MemberWithUser | null>(null)
  
  // Form fields
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState<Role>('treasurer')
  const [showPassword, setShowPassword] = useState(false)

  // Status states
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  function openAddSheet() {
    if (!isOwner) return
    setError(null)
    setEditingMember(null)
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormRole('treasurer')
    setShowPassword(false)
    setIsConfirmingDelete(false)
    setIsSheetOpen(true)
  }

  function openEditSheet(m: MemberWithUser) {
    if (!isOwner || m.userId === currentUserId) return
    setError(null)
    setEditingMember(m)
    setFormName(m.userName)
    setFormEmail(m.userEmail)
    setFormPassword('')
    setFormRole(m.role as Role)
    setShowPassword(false)
    setIsConfirmingDelete(false)
    setIsSheetOpen(true)
  }

  function closeSheet() {
    setIsSheetOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isOwner) return
    
    setError(null)
    setIsSubmitting(true)

    try {
      if (editingMember) {
        // Update member role
        const res = await updateMemberRoleAction(editingMember.id, formRole)
        if (!res.success) {
          setError(res.error)
          return
        }

        // Update local state
        setMembers((prev) =>
          prev.map((m) =>
            m.id === editingMember.id ? { ...m, role: formRole } : m
          )
        )
      } else {
        // Add new member
        const res = await addMemberAction({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
        })

        if (!res.success) {
          setError(res.error)
          return
        }

        // Fetch refreshed members via router refresh
        // We will also optimistically add or trigger update
        // Manual insertion is tricky since we don't have user ID in response, so router refresh is best.
        // We trigger refresh and let router fetch new list, but we can also close sheet safely.
      }

      closeSheet()
      router.refresh()
      
      // Temporary fallback: refresh client side list if database returns it.
      // Next.js refresh will refetch server data and pass updated props.
      // But we can update local list from server on a short delay or depend on router.
      setTimeout(() => {
        router.refresh()
      }, 50)
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!editingMember || !isOwner) return
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await removeMemberAction(editingMember.id)
      if (!res.success) {
        setError(res.error)
        setIsConfirmingDelete(false)
        return
      }

      // Remove locally
      setMembers((prev) => prev.filter((m) => m.id !== editingMember.id))
      closeSheet()
      router.refresh()
    } catch {
      setError('Terjadi kesalahan saat menghapus.')
      setIsConfirmingDelete(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Anggota</h1>
          <p className="text-xs text-gray-500">Kelola pengurus dan peran akses login</p>
        </div>
        {isOwner && (
          <button
            onClick={openAddSheet}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus size={16} />
            Tambah Anggota
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-xs divide-y divide-gray-100">
        {members.map((m) => {
          const isEditable = isOwner && m.userId !== currentUserId
          const Component = isEditable ? 'button' : 'div'
          
          return (
            <Component
              key={m.id}
              onClick={isEditable ? () => openEditSheet(m) : undefined}
              className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${
                isEditable ? 'hover:bg-gray-50 cursor-pointer active:bg-gray-100' : ''
              }`}
            >
              <div>
                <p className="font-medium text-sm text-gray-900 flex items-center gap-1.5">
                  {m.userName}
                  {m.userId === currentUserId && (
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
                      Anda
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{m.userEmail}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                  m.role === 'owner' 
                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                    : m.role === 'admin'
                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                    : m.role === 'treasurer'
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-gray-100 text-gray-600 border-gray-100'
                }`}>
                  {ROLE_LABEL[m.role] ?? m.role}
                </span>
                {isEditable && (
                  <Edit2 size={12} className="text-gray-300 hover:text-gray-500" />
                )}
              </div>
            </Component>
          )
        })}
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-[60] transition-opacity duration-300 ${
          isSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSheet}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-w-md mx-auto z-[70] transform transition-transform duration-300 ease-out pb-[calc(2rem+env(safe-area-inset-bottom))] border-t border-gray-200 overflow-y-auto ${
          isSheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '92vh' }}
      >
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto my-3 shrink-0" />

        {/* Form Content */}
        {!isConfirmingDelete ? (
          <form onSubmit={handleSubmit} className="px-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 mb-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingMember ? 'Ubah Akses Anggota' : 'Tambah Anggota'}
                </h2>
                <p className="text-xs text-gray-500">
                  {editingMember 
                    ? 'Perbarui tingkat hak akses peran anggota' 
                    : 'Daftarkan akun anggota baru untuk login'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="h-8 w-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            {/* Read-only / Write Fields based on Mode */}
            {!editingMember ? (
              <>
                {/* Name Input */}
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Ahmad Hidayat"
                    required
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 transition-all"
                  />
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label htmlFor="emailAddress" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Alamat Email
                  </label>
                  <input
                    id="emailAddress"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@masjid.com"
                    required
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 transition-all"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label htmlFor="memberPass" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Password Login
                  </label>
                  <div className="relative">
                    <input
                      id="memberPass"
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      required
                      minLength={8}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Edit Mode Read-Only displays */
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nama Anggota</span>
                  <span className="text-sm font-semibold text-gray-800">{formName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Email</span>
                  <span className="text-sm font-mono text-gray-800">{formEmail}</span>
                </div>
              </div>
            )}

            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Pilih Peran (Role)
              </label>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {ROLES_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormRole(opt.value)}
                    disabled={isSubmitting}
                    className={`w-full p-3 text-left border rounded-xl transition-all block ${
                      formRole === opt.value
                        ? 'border-green-600 bg-green-50/50 shadow-2xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm font-bold text-gray-900">{opt.label}</span>
                      {formRole === opt.value && (
                        <span className="h-2 w-2 rounded-full bg-green-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Form actions */}
            <div className="flex flex-col gap-2 pt-4 border-t">
              <button
                type="submit"
                disabled={isSubmitting || (!editingMember && (!formName || !formEmail || formPassword.length < 8))}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>

              {editingMember && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 text-red-600 hover:bg-red-50 disabled:opacity-50 font-semibold rounded-xl text-sm transition-colors border border-transparent"
                >
                  Keluarkan Anggota
                </button>
              )}
            </div>
          </form>
        ) : (
          /* Delete Confirmation mode inside sheet */
          <div className="px-6 py-4 space-y-5">
            <div className="flex items-center justify-between border-b pb-3 mb-2">
              <h2 className="text-lg font-bold text-gray-900">Keluarkan Anggota</h2>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="h-8 w-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl p-4 space-y-2">
              <p className="font-semibold">Konfirmasi Pengeluaran</p>
              <p className="text-xs leading-relaxed text-red-700">
                Apakah Anda yakin ingin mengeluarkan <strong>{editingMember?.userName}</strong> ({editingMember?.userEmail}) dari organisasi? 
                Pengguna ini tidak akan memiliki hak akses lagi untuk mencatat atau melihat pembukuan masjid ini.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                {isSubmitting ? 'Mengeluarkan...' : 'Ya, Keluarkan Anggota'}
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
