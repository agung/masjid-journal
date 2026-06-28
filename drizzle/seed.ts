/**
 * Seed script: inserts system-level default categories.
 * Run with: npx tsx drizzle/seed.ts
 *
 * These are global categories (organization_id = null) available to all masjids.
 */

import * as dotenv from 'dotenv'
import { category } from './schema'
import crypto from 'crypto'

// Load .env.local first (local dev), fallback to .env
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const IS_MYSQL = DATABASE_URL?.startsWith('mysql:') ?? false

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

  let db: any
  let client: any

  if (IS_MYSQL) {
    // MySQL setup
    const mysql = await import('mysql2/promise')
    const { drizzle } = await import('drizzle-orm/mysql2')
    const pool = mysql.createPool({ uri: DATABASE_URL! })
    db = drizzle(pool)
    client = pool
  } else {
    // PostgreSQL setup
    const postgres = (await import('postgres')).default
    const { drizzle } = await import('drizzle-orm/postgres-js')
    client = postgres(DATABASE_URL!, { max: 1 })
    db = drizzle(client)
  }

  // Don't set createdAt manually - let the database DEFAULT handle it
  const incomeCategories = DEFAULT_INCOME_CATEGORIES.map((c) => ({
    id: crypto.randomUUID(),
    organizationId: null,
    type: 'income' as const,
    name: c.name,
    icon: c.icon,
    isSystem: true,
    isActive: true,
  }))

  const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
    id: crypto.randomUUID(),
    organizationId: null,
    type: 'expense' as const,
    name: c.name,
    icon: c.icon,
    isSystem: true,
    isActive: true,
  }))

  // MySQL doesn't have onConflictDoNothing, use INSERT IGNORE or check existence first
  try {
    await db.insert(category).values([...incomeCategories, ...expenseCategories])
  } catch (err: any) {
    // Ignore duplicate key errors
    if (!err.message?.includes('Duplicate entry')) {
      throw err
    }
  }

  console.log(`✅ Inserted ${incomeCategories.length} income categories`)
  console.log(`✅ Inserted ${expenseCategories.length} expense categories`)

  if (IS_MYSQL) {
    await client.end()
  } else {
    await client.end()
  }
  console.log('🏁 Seed complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
