'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Trash2, Edit2 } from 'lucide-react'
import { createCategory, updateCategory, deleteCategory } from '@/lib/server/categories'
import type { Category } from '@/drizzle/schema'

interface CategoryManagerProps {
  initialCategories: Category[]
  canManage: boolean
}

const INCOME_ICONS = ['🕌', '💰', '📦', '🤝', '❤️', '🏡', '🪙', '📈', '➕']
const EXPENSE_ICONS = ['⚙️', '📝', '🧹', '💧', '🍽️', '🚗', '🔨', '💼', '💸', '➕']

export function CategoryManager({ initialCategories, canManage }: CategoryManagerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income')
  
  // Bottom sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  // Form fields
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<'income' | 'expense'>('income')
  const [formIcon, setFormIcon] = useState('💰')
  
  // Mutation states
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const activeCategories = categories.filter((c) => c.type === activeTab)
  const predefinedIcons = formType === 'income' ? INCOME_ICONS : EXPENSE_ICONS

  function openCreateSheet() {
    if (!canManage) return
    setError(null)
    setEditingCategory(null)
    setFormName('')
    setFormType(activeTab)
    setFormIcon(activeTab === 'income' ? '💰' : '💸')
    setIsConfirmingDelete(false)
    setIsSheetOpen(true)
  }

  function openEditSheet(cat: Category) {
    if (!canManage || cat.isSystem) return
    setError(null)
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormType(cat.type)
    setFormIcon(cat.icon ?? '➕')
    setIsConfirmingDelete(false)
    setIsSheetOpen(true)
  }

  function closeSheet() {
    setIsSheetOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canManage) return
    
    setError(null)
    setIsSubmitting(true)

    try {
      if (editingCategory) {
        // Update category
        const res = await updateCategory(editingCategory.id, {
          name: formName,
          type: formType,
          icon: formIcon,
        })

        if (!res.success) {
          setError(res.error)
          return
        }

        // Update local state
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id
              ? { ...c, name: formName, type: formType, icon: formIcon }
              : c
          )
        )
      } else {
        // Create category
        const res = await createCategory({
          name: formName,
          type: formType,
          icon: formIcon,
        })

        if (!res.success) {
          setError(res.error)
          return
        }

        // Update local state by refetching page or inserting manually
        // We will insert manually for immediate local update and trigger a router refresh
        const newCat: Category = {
          id: res.id,
          organizationId: 'temporary', // client-side placeholder
          type: formType,
          name: formName,
          icon: formIcon,
          isSystem: false,
          isActive: true,
          createdAt: new Date(),
        }
        setCategories((prev) => [...prev, newCat])
      }

      closeSheet()
      router.refresh()
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!editingCategory || !canManage) return
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await deleteCategory(editingCategory.id)
      if (!res.success) {
        setError(res.error)
        setIsConfirmingDelete(false)
        return
      }

      // Remove from local state
      setCategories((prev) => prev.filter((c) => c.id !== editingCategory.id))
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
          <h1 className="text-xl font-bold text-gray-900">Kategori</h1>
          <p className="text-xs text-gray-500">Kelola kategori pemasukan & pengeluaran</p>
        </div>
        {canManage && (
          <button
            onClick={openCreateSheet}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            <Plus size={16} />
            Tambah
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-2 text-center text-sm font-medium rounded-lg transition-all ${
            activeTab === 'income'
              ? 'bg-white text-gray-900 shadow-xs font-semibold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Pemasukan
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-2 text-center text-sm font-medium rounded-lg transition-all ${
            activeTab === 'expense'
              ? 'bg-white text-gray-900 shadow-xs font-semibold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Pengeluaran
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
        {activeCategories.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-500">Belum ada kategori kustom.</p>
            {canManage && (
              <button
                onClick={openCreateSheet}
                className="mt-2 text-xs text-green-600 font-semibold hover:text-green-700"
              >
                + Buat Kategori Baru
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeCategories.map((c) => {
              const isEditable = canManage && !c.isSystem
              const Component = isEditable ? 'button' : 'div'
              
              return (
                <Component
                  key={c.id}
                  onClick={isEditable ? () => openEditSheet(c) : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-gray-800 transition-colors ${
                    isEditable ? 'hover:bg-gray-50 cursor-pointer active:bg-gray-100' : ''
                  }`}
                >
                  <span className="text-2xl w-9 h-9 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 shrink-0 shadow-2xs">
                    {c.icon ?? '➕'}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-gray-800">{c.name}</span>
                  </div>
                  
                  {c.isSystem ? (
                    <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Bawaan
                    </span>
                  ) : (
                    <span className="ml-auto flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-100">
                        Kustom
                      </span>
                      {isEditable && (
                        <Edit2 size={12} className="text-gray-300 hover:text-gray-500" />
                      )}
                    </span>
                  )}
                </Component>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Sheet Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-[60] transition-opacity duration-300 ${
          isSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSheet}
      />

      {/* Bottom Sheet Container */}
      <div
        className={`fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-w-md mx-auto z-[70] transform transition-transform duration-300 ease-out pb-[calc(2rem+env(safe-area-inset-bottom))] border-t border-gray-200 overflow-y-auto ${
          isSheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle bar */}
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto my-3 shrink-0" />

        {/* Sheet Content */}
        {!isConfirmingDelete ? (
          <form onSubmit={handleSubmit} className="px-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 mb-2">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCategory ? 'Ubah Kategori' : 'Tambah Kategori'}
              </h2>
              <button
                type="button"
                onClick={closeSheet}
                className="h-8 w-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="catName" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Nama Kategori
              </label>
              <input
                id="catName"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Infak Pembangunan"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 transition-all"
              />
            </div>

            {/* Type Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tipe Transaksi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('income')
                    setFormIcon('💰')
                  }}
                  disabled={isSubmitting}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    formType === 'income'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  Pemasukan (Income)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('expense')
                    setFormIcon('💸')
                  }}
                  disabled={isSubmitting}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    formType === 'expense'
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  Pengeluaran (Expense)
                </button>
              </div>
            </div>

            {/* Icons Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pilih Icon Emoji
              </label>
              <div className="grid grid-cols-5 gap-2">
                {predefinedIcons.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormIcon(emoji)}
                    disabled={isSubmitting}
                    className={`text-2xl p-2 rounded-xl border transition-all flex items-center justify-center ${
                      formIcon === emoji
                        ? 'border-green-600 bg-green-50 scale-105 shadow-xs font-bold'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center mt-2">
                <span className="text-xs text-gray-400 font-medium shrink-0">Custom Emoji:</span>
                <input
                  type="text"
                  value={predefinedIcons.includes(formIcon) ? '' : formIcon}
                  onChange={(e) => {
                    const val = e.target.value.trim()
                    if (val) {
                      setFormIcon(val.slice(0, 4))
                    }
                  }}
                  placeholder="Ketik emoji kustom di sini"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4 border-t">
              <button
                type="submit"
                disabled={isSubmitting || !formName}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>

              {editingCategory && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 text-red-600 hover:bg-red-50 disabled:opacity-50 font-semibold rounded-xl text-sm transition-colors border border-transparent"
                >
                  Hapus Kategori
                </button>
              )}
            </div>
          </form>
        ) : (
          /* Delete Confirmation View inside bottom sheet */
          <div className="px-6 py-4 space-y-5">
            <div className="flex items-center justify-between border-b pb-3 mb-2">
              <h2 className="text-lg font-bold text-gray-900">Konfirmasi Hapus</h2>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="h-8 w-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm rounded-xl p-4 space-y-2">
              <p className="font-semibold">Perhatian</p>
              <p className="text-xs leading-relaxed text-orange-700">
                Apakah Anda yakin ingin menghapus kategori <strong>{editingCategory?.name}</strong>? 
                Kategori ini akan dihapus dari daftar opsi kategori untuk transaksi baru. 
                Transaksi yang sudah menggunakan kategori ini tidak akan terpengaruh.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-red-650 hover:bg-red-750 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Kategori'}
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-250 disabled:opacity-50 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
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
