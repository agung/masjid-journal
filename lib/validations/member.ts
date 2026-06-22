import { z } from 'zod'

export const addMemberSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi').max(100, 'Nama terlalu panjang'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role: z.enum(['owner', 'admin', 'treasurer', 'viewer'], {
    required_error: 'Peran (role) wajib dipilih',
  }),
})

export type AddMemberInput = z.infer<typeof addMemberSchema>
