import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100, 'Nama terlalu panjang'),
  type: z.enum(['income', 'expense'], {
    required_error: 'Tipe kategori wajib diisi',
  }),
  icon: z.string().min(1, 'Icon wajib diisi').max(10).default('➕'),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100, 'Nama terlalu panjang').optional(),
  type: z.enum(['income', 'expense']).optional(),
  icon: z.string().min(1).max(10).optional(),
})

export type CreateCategoryInput = z.input<typeof createCategorySchema>
export type UpdateCategoryInput = z.input<typeof updateCategorySchema>
