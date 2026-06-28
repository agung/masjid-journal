'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, or, asc } from 'drizzle-orm'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { category } from '@/drizzle/schema'
import { requireRole } from '@/lib/auth/guards'
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/lib/validations/category'

export async function listCategories({
  organizationId,
  type,
}: {
  organizationId: string
  type?: 'income' | 'expense'
}) {
  return db
    .select()
    .from(category)
    .where(
      and(
        eq(category.isActive, true),
        or(
          eq(category.organizationId, organizationId),
          // Global system categories
          eq(category.isSystem, true)
        ),
        type ? eq(category.type, type) : undefined
      )
    )
    .orderBy(asc(category.type), asc(category.name))
}

export async function createCategory(
  data: CreateCategoryInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const session = await requireRole('admin')
    const orgId = session.activeOrganizationId!
    
    const validated = createCategorySchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? 'Validasi gagal' }
    }
    const { name, type, icon } = validated.data
    const id = crypto.randomUUID()

    await db.insert(category).values({
      id,
      organizationId: orgId,
      type,
      name,
      icon: icon ?? '➕',
      isSystem: false,
      isActive: true,
    })

    revalidatePath('/categories')
    return { success: true, id }
  } catch (err) {
    console.error('[createCategory]', err)
    return { success: false, error: 'Gagal membuat kategori. Coba lagi.' }
  }
}

export async function updateCategory(
  categoryId: string,
  data: UpdateCategoryInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireRole('admin')
    const orgId = session.activeOrganizationId!

    const validated = updateCategorySchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? 'Validasi gagal' }
    }

    // Ensure category belongs to this org and is NOT a system category
    const [existing] = await db
      .select({ id: category.id, isSystem: category.isSystem })
      .from(category)
      .where(and(eq(category.id, categoryId), eq(category.organizationId, orgId)))
      .limit(1)

    if (!existing) {
      return { success: false, error: 'Kategori tidak ditemukan' }
    }
    if (existing.isSystem) {
      return { success: false, error: 'Kategori default tidak dapat diubah' }
    }

    await db
      .update(category)
      .set({
        ...validated.data,
      })
      .where(eq(category.id, categoryId))

    revalidatePath('/categories')
    return { success: true }
  } catch (err) {
    console.error('[updateCategory]', err)
    return { success: false, error: 'Gagal memperbarui kategori. Coba lagi.' }
  }
}

export async function deleteCategory(
  categoryId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireRole('admin')
    const orgId = session.activeOrganizationId!

    // Ensure category belongs to this org and is NOT a system category
    const [existing] = await db
      .select({ id: category.id, isSystem: category.isSystem })
      .from(category)
      .where(and(eq(category.id, categoryId), eq(category.organizationId, orgId)))
      .limit(1)

    if (!existing) {
      return { success: false, error: 'Kategori tidak ditemukan' }
    }
    if (existing.isSystem) {
      return { success: false, error: 'Kategori default tidak dapat dihapus' }
    }

    // Soft delete by setting isActive = false
    await db
      .update(category)
      .set({ isActive: false })
      .where(eq(category.id, categoryId))

    revalidatePath('/categories')
    return { success: true }
  } catch (err) {
    console.error('[deleteCategory]', err)
    return { success: false, error: 'Gagal menghapus kategori. Coba lagi.' }
  }
}

