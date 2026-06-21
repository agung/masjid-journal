import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/drizzle/schema'

const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/masjid_journal'

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('DATABASE_URL is not set')
}

// Prevent multiple instances in development due to HMR
const globalForDb = global as typeof globalThis & {
  pgClient: postgres.Sql | undefined
}

const client = globalForDb.pgClient ?? postgres(dbUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: dbUrl.includes('supabase.com') ? 'require' : false,
})

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgClient = client
}

export const db = drizzle(client, { schema })
