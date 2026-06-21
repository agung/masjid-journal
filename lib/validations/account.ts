import { z } from 'zod'

export const createCashHolderSchema = z.object({
  name: z.string().min(1, 'Nama akun wajib diisi').max(100, 'Nama terlalu panjang'),
  holderName: z.string().min(1, 'Nama pemegang wajib diisi').max(100),
  initialBalance: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'number' ? v : parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0))
    .pipe(z.number().min(0, 'Saldo awal tidak boleh negatif')),
})

export const createBankAccountSchema = z.object({
  name: z.string().min(1, 'Nama akun wajib diisi').max(100, 'Nama terlalu panjang'),
  bankName: z.string().min(1, 'Nama bank wajib diisi').max(100),
  accountNumber: z.string().min(1, 'Nomor rekening wajib diisi').max(30),
  accountHolderName: z.string().min(1, 'Nama pemilik rekening wajib diisi').max(100),
  initialBalance: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'number' ? v : parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0))
    .pipe(z.number().min(0, 'Saldo awal tidak boleh negatif')),
})

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  holderName: z.string().min(1).max(100).optional(),
  bankName: z.string().min(1).max(100).optional(),
  accountNumber: z.string().min(1).max(30).optional(),
  accountHolderName: z.string().min(1).max(100).optional(),
})

export type CreateCashHolderInput = z.input<typeof createCashHolderSchema>
export type CreateBankAccountInput = z.input<typeof createBankAccountSchema>
export type UpdateAccountInput = z.input<typeof updateAccountSchema>
