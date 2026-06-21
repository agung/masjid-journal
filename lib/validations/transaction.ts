import { z } from 'zod'

// Shared fields for single-account transactions
const baseTransactionFields = {
  description: z.string().min(1, 'Keterangan wajib diisi').max(255),
  transactionDate: z.string().min(1, 'Tanggal wajib diisi'),
  notes: z.string().max(1000).optional(),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'number' ? v : parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0))
    .pipe(z.number().min(1, 'Nominal harus lebih dari 0')),
  // Proof upload fields (optional, populated after Google Drive upload)
  proofStoragePath: z.string().optional(), // Drive file ID
  proofPublicUrl: z.string().url().optional(),  // Drive web view link
}

// Income: uang masuk ke holder atau bank
export const incomeSchema = z.object({
  type: z.literal('income'),
  ...baseTransactionFields,
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  targetAccountId: z.string().min(1, 'Akun tujuan wajib dipilih'),
})

// Expense: uang keluar dari holder atau bank
export const expenseSchema = z.object({
  type: z.literal('expense'),
  ...baseTransactionFields,
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  sourceAccountId: z.string().min(1, 'Akun sumber wajib dipilih'),
})

// Transfer: antar holder (no .refine so it works in discriminatedUnion)
export const transferSchema = z.object({
  type: z.literal('transfer'),
  ...baseTransactionFields,
  sourceAccountId: z.string().min(1, 'Pemegang asal wajib dipilih'),
  targetAccountId: z.string().min(1, 'Pemegang tujuan wajib dipilih'),
})

// Deposit: setor tunai dari holder ke bank
export const depositSchema = z.object({
  type: z.literal('deposit'),
  ...baseTransactionFields,
  sourceAccountId: z.string().min(1, 'Pemegang kas wajib dipilih'),
  targetAccountId: z.string().min(1, 'Rekening bank wajib dipilih'),
})

// Withdrawal: tarik tunai dari bank ke holder
export const withdrawalSchema = z.object({
  type: z.literal('withdrawal'),
  ...baseTransactionFields,
  sourceAccountId: z.string().min(1, 'Rekening bank wajib dipilih'),
  targetAccountId: z.string().min(1, 'Pemegang kas wajib dipilih'),
})

// Adjustment: koreksi saldo, owner/admin only
export const adjustmentSchema = z.object({
  type: z.literal('adjustment'),
  ...baseTransactionFields,
  targetAccountId: z.string().min(1, 'Akun wajib dipilih'),
  // 'in' = add to balance, 'out' = subtract
  direction: z.enum(['in', 'out']),
})

// Discriminated union of all transaction types
export const createTransactionSchema = z.discriminatedUnion('type', [
  incomeSchema,
  expenseSchema,
  transferSchema,
  depositSchema,
  withdrawalSchema,
  adjustmentSchema,
])

export type CreateTransactionInput = z.input<typeof createTransactionSchema>
export type CreateTransactionData = z.output<typeof createTransactionSchema>
