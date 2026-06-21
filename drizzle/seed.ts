/**
 * Seed script: inserts system-level default categories.
 * Run with: npx tsx drizzle/seed.ts
 *
 * These are global categories (organization_id = null) available to all masjids.
 */

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { category } from './schema'
import crypto from 'crypto'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const client = postgres(DATABASE_URL, { max: 1 })
const db = drizzle(client)

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Infak Jumat', icon: '🕌' },
  { name: 'Infak Kotak Amal', icon: '📦' },
  { name: 'Zakat', icon: '❤️' },
  { name: 'Donasi', icon: '🤝' },
  { name: 'Wakaf', icon: '🏡' },
  { name: 'Lain-lain', icon: '➕' },
] as const

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Operasional', icon: '⚙️' },
  { name: 'ATK', icon: '📝' },
  { name: 'Kebersihan', icon: '🧹' },
  { name: 'Air & Listrik', icon: '💧' },
  { name: 'Konsumsi', icon: '🍽️' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Perawatan Bangunan', icon: '🔨' },
  { name: 'Honor & Kegiatan', icon: '💼' },
  { name: 'Lain-lain', icon: '➕' },
] as const

async function seed() {
  console.log('🌱 Seeding default categories...')

  const now = new Date()

  const incomeCategories = DEFAULT_INCOME_CATEGORIES.map((c) => ({
    id: crypto.randomUUID(),
    organizationId: null,
    type: 'income' as const,
    name: c.name,
    icon: c.icon,
    isSystem: true,
    isActive: true,
    createdAt: now,
  }))

  const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
    id: crypto.randomUUID(),
    organizationId: null,
    type: 'expense' as const,
    name: c.name,
    icon: c.icon,
    isSystem: true,
    isActive: true,
    createdAt: now,
  }))

  await db
    .insert(category)
    .values([...incomeCategories, ...expenseCategories])
    .onConflictDoNothing()

  console.log(`✅ Inserted ${incomeCategories.length} income categories`)
  console.log(`✅ Inserted ${expenseCategories.length} expense categories`)

  await client.end()
  console.log('🏁 Seed complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
