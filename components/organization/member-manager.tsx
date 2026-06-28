'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Eye, EyeOff, Trash2, Edit2, Copy, Check } from 'lucide-react'
import { addMemberAction, updateMemberRoleAction, removeMemberAction } from '@/lib/server/organizations'
import { createInvitationAction, cancelInvitationAction } from '@/lib/server/invitations'
import type { Role } from '@/lib/auth/roles'
import { Input } from '@/components/ui/input'

interface MemberWithUser {
  id: string
  role: string
  createdAt: Date
  userId: string
  userName: string
  userEmail: string
}

interface PendingInvitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: Date
}

interface MemberManagerProps {
  initialMembers: MemberWithUser[]
  initialInvitations?: PendingInvitation[]
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

export function MemberManager({
  initialMembers,
  initialInvitations = [],
  isOwner,
  currentUserId,
}: MemberManagerProps) {
  const router = useRouter()
  const [members, setMembers] = useState<MemberWithUser[]>(initialMembers)
  const [invitations, setInvitations] = useState<PendingInvitation[]>(initialInvitations)
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members')
  
  // Sheet states
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<MemberWithUser | null>(null)
  
  // Form fields
  const [inviteMode, setInviteMode] = useState<'link' | 'manual'>('link')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState<Role>('treasurer')
  const [showPassword, setShowPassword] = useState(false)

  // Newly generated link display
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  // Status states
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  // Copy status feedback
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => {
      setCopiedId(null)
    }, 1500)
  }

  function openAddSheet() {
    if (!isOwner) return
    setError(null)
    setEditingMember(null)
    setInviteMode('link')
    setGeneratedLink(null)
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
        closeSheet()
        router.refresh()
      } else if (inviteMode === 'link') {
        // Create invitation link
        const res = await createInvitationAction({
          role: formRole,
        })

        if (!res.success) {
          setError(res.error)
          return
        }

        // Show generated link in success state inside sheet
        const link = `${window.location.origin}/register?invite_token=${res.token}`
        setGeneratedLink(link)
        
        // Refresh local invitations and server page
        router.refresh()
        // Wait briefly for server data to sync, then optimistically insert or let refresh handle it
        setTimeout(() => {
          router.refresh()
        }, 100)
      } else {
        // Add new member manually
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
        
        closeSheet()
        router.refresh()
        setTimeout(() => {
          router.refresh()
        }, 100)
      }
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

  async function handleCancelInvitation(id: string) {
    if (!isOwner) return
    try {
      const res = await cancelInvitationAction(id)
      if (res.success) {
        setInvitations((prev) => prev.filter((inv) => inv.id !== id))
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-sans">Anggota</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Kelola pengurus dan peran akses login</p>
        </div>
        {isOwner && (
          <button
            onClick={openAddSheet}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus size={16} />
            Tambah
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-100 mb-5 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'members'
              ? 'border-green-600 text-green-600 dark:border-green-500 dark:text-green-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Daftar Anggota ({members.length})
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'invitations'
                ? 'border-green-600 text-green-600 dark:border-green-500 dark:text-green-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Undangan Aktif ({invitations.length})
          </button>
        )}
      </div>

      {/* Tab: Members List */}
      {activeTab === 'members' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-xs divide-y divide-gray-100 dark:bg-gray-900 dark:divide-gray-800 dark:border-gray-800">
          {members.map((m) => {
            const isEditable = isOwner && m.userId !== currentUserId
            const Component = isEditable ? 'button' : 'div'
            
            return (
              <Component
                key={m.id}
                onClick={isEditable ? () => openEditSheet(m) : undefined}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${
                  isEditable ? 'hover:bg-gray-50 cursor-pointer active:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700' : ''
                }`}
              >
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5 font-sans">
                    {m.userName}
                    {m.userId === currentUserId && (
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md dark:bg-gray-800 dark:text-gray-500">
                        Anda
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{m.userEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                    m.role === 'owner' 
                      ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50'
                      : m.role === 'admin'
                      ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50'
                      : m.role === 'treasurer'
                      ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950 dark:text-green-400 dark:border-green-900'
                      : 'bg-gray-100 text-gray-600 border dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                  }`}>
                    {ROLE_LABEL[m.role] ?? m.role}
                  </span>
                  {isEditable && (
                    <Edit2 size={12} className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400" />
                  )}
                </div>
              </Component>
            )
          })}
        </div>
      )}

      {/* Tab: Pending Invitations List */}
      {activeTab === 'invitations' && isOwner && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-xs divide-y divide-gray-100 dark:bg-gray-900 dark:divide-gray-800 dark:border-gray-800">
          {invitations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm text-gray-400 dark:text-gray-500">Tidak ada undangan aktif yang tertunda.</p>
            </div>
          ) : (
            invitations.map((inv) => {
              const inviteLink = `${window.location.origin}/register?invite_token=${inv.id}`
              const isCopied = copiedId === inv.id
              
              return (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{inv.email === 'any' ? 'Undangan Terbuka' : inv.email}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Kedaluwarsa: {new Date(inv.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700 border border-green-100 dark:bg-green-950 dark:text-green-400 dark:border-green-900">
                      {ROLE_LABEL[inv.role] ?? inv.role}
                    </span>
                    
                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(inviteLink, inv.id)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors ${
                        isCopied
                          ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-950 dark:border-green-800 dark:text-green-400'
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                      title="Salin Link Undangan"
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>

                    {/* Cancel invitation */}
                    <button
                      type="button"
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      title="Batalkan Undangan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-[60] transition-opacity duration-300 ${
          isSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSheet}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-w-md mx-auto z-[70] transform transition-transform duration-300 ease-out pb-[calc(2rem+env(safe-area-inset-bottom))] border-t overflow-y-auto dark:bg-gray-900 dark:border-gray-800 ${
          isSheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '92vh' }}
      >
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto my-3 shrink-0" />

        {/* Generated Invitation Link Success View */}
        {generatedLink ? (
          <div className="px-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-3 mb-2 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Undangan Berhasil Dibuat</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Salin link undangan di bawah dan berikan kepada pengurus.</p>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="h-8 w-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-4 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400 leading-relaxed">
              Undangan terbuka berhasil dibuat dengan peran <strong>{ROLE_LABEL[formRole]}</strong>. Siapa saja yang menggunakan link ini dapat mendaftar. Link ini berlaku selama 7 hari.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Link Undangan</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl px-3 py-2.5 text-xs font-mono select-all focus:outline-hidden dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(generatedLink, 'new-invite')}
                  className={`px-4 rounded-xl border font-semibold text-sm transition-colors flex items-center gap-1.5 ${
                    copiedId === 'new-invite'
                      ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-950 dark:border-green-900 dark:text-green-400'
                      : 'bg-green-600 border-transparent text-white hover:bg-green-700'
                  }`}
                >
                  {copiedId === 'new-invite' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedId === 'new-invite' ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t dark:border-gray-800">
              <button
                type="button"
                onClick={closeSheet}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : !isConfirmingDelete ? (
          <form onSubmit={handleSubmit} className="px-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 mb-2 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {editingMember ? 'Ubah Akses Anggota' : 'Tambah Anggota'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {editingMember 
                    ? 'Perbarui tingkat hak akses peran anggota' 
                    : 'Kirim link undangan atau daftarkan secara manual'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="h-8 w-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-2.5 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Toggle Mode (Only when adding new member) */}
            {!editingMember && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 border rounded-xl dark:bg-gray-900 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setInviteMode('link')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
                    inviteMode === 'link'
                      ? 'bg-white text-gray-800 shadow-2xs dark:bg-gray-800 dark:text-gray-100'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  Gunakan Link Undangan
                </button>
                <button
                  type="button"
                  onClick={() => setInviteMode('manual')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
                    inviteMode === 'manual'
                      ? 'bg-white text-gray-800 shadow-2xs dark:bg-gray-800 dark:text-gray-100'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  Daftarkan Manual
                </button>
              </div>
            )}

            {/* Form Fields depending on Mode */}
            {!editingMember ? (
              inviteMode === 'link' ? (
                /* Link Invite mode info text */
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400 leading-relaxed space-y-1">
                  <p className="font-semibold text-sm">Undangan Terbuka</p>
                  <p>
                    Sistem akan membuat link pendaftaran unik untuk peran yang Anda pilih di bawah.
                  </p>
                  <p>
                    Calon pengurus dapat mendaftar dengan **email bebas** pilihan mereka sendiri, atau langsung menggunakan **Google SSO**.
                  </p>
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    Satu link hanya dapat digunakan oleh satu pengguna (1 link = 1 akun sukses).
                  </p>
                </div>
              ) : (
                /* Manual registration inputs */
                <>
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="fullName" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                      Nama Lengkap
                    </label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Ahmad Hidayat"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="emailAddress" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                      Alamat Email
                    </label>
                    <Input
                      id="emailAddress"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="email@masjid.com"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="memberPass" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                      Password Login
                    </label>
                    <div className="relative">
                      <Input
                        id="memberPass"
                        type={showPassword ? 'text' : 'password'}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        required
                        minLength={8}
                        disabled={isSubmitting}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )
            ) : (
              /* Edit Mode Read-Only displays */
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border dark:bg-gray-800 dark:border-gray-700">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nama Anggota</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Email</span>
                  <span className="text-sm font-mono text-gray-800 dark:text-gray-300">{formEmail}</span>
                </div>
              </div>
            )}

            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
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
                        ? 'border-green-600 bg-green-50/50 shadow-2xs dark:border-green-500 dark:bg-green-950/70'
                        : 'border bg-white dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{opt.label}</span>
                      {formRole === opt.value && (
                        <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t dark:border-gray-800">
              <button
                type="submit"
                disabled={isSubmitting || (!editingMember && inviteMode === 'manual' && (!formName || !formEmail || formPassword.length < 8))}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSubmitting 
                  ? 'Memproses...' 
                  : editingMember 
                    ? 'Simpan Perubahan' 
                    : inviteMode === 'link' 
                      ? 'Buat Link Undangan' 
                      : 'Simpan Anggota Baru'
                }
              </button>

              {editingMember && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 text-red-600 hover:bg-red-50 disabled:opacity-50 font-semibold rounded-xl text-sm transition-colors border border-transparent dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  Keluarkan Anggota
                </button>
              )}
            </div>
          </form>
        ) : (
          /* Delete Confirmation mode inside sheet */
          <div className="px-6 py-4 space-y-5">
            <div className="flex items-center justify-between border-b pb-3 mb-2 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Keluarkan Anggota</h2>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="h-8 w-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 dark:bg-red-950/30 dark:border-red-600/60">
              <p className="font-semibold text-red-800 dark:text-red-300">Konfirmasi Pengeluaran</p>
              <p className="text-xs leading-relaxed text-red-700 dark:text-red-400">
                Apakah Anda yakin ingin mengeluarkan <strong>{editingMember?.userName}</strong> ({editingMember?.userEmail}) dari organisasi? 
                Pengguna ini tidak akan memiliki hak akses lagi untuk mencatat atau melihat pembukuan masjid ini.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 dark:bg-red-800 dark:hover:bg-red-700"
              >
                <Trash2 size={16} />
                {isSubmitting ? 'Mengeluarkan...' : 'Ya, Keluarkan Anggota'}
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-semibold rounded-xl text-sm transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
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
