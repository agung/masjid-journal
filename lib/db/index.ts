import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2'
import postgres from 'postgres'
import mysql from 'mysql2/promise'
import * as schemaPg from '@/drizzle/schema.pg'
import * as schemaMysql from '@/drizzle/schema.mysql'

const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/masjid_journal'

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('DATABASE_URL is not set')
}

const isMysql = dbUrl.startsWith('mysql:')

// Prevent multiple instances in development due to HMR
const globalForDb = global as typeof globalThis & {
  pgClient: ReturnType<typeof postgres> | undefined
  mysqlPool: mysql.Pool | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbInstance: any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initializeDatabase(): any {
  if (globalForDb.dbInstance) return globalForDb.dbInstance

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbInstance: any

  if (isMysql) {
    // MySQL setup
    const pool = globalForDb.mysqlPool ?? mysql.createPool({
      uri: dbUrl,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
    })

    if (process.env.NODE_ENV !== 'production') {
      globalForDb.mysqlPool = pool
    }

    dbInstance = drizzleMysql(pool, { schema: schemaMysql, mode: 'default' })
  } else {
    // PostgreSQL setup
    const client = globalForDb.pgClient ?? postgres(dbUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: dbUrl.includes('supabase.com') ? 'require' : false,
    })

    if (process.env.NODE_ENV !== 'production') {
      globalForDb.pgClient = client
    }

    dbInstance = drizzlePg(client, { schema: schemaPg })
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.dbInstance = dbInstance
  }

  return dbInstance
}

// db is typed as any to support both PostgreSQL and MySQL dialects at runtime.
// The actual instance is correctly initialized based on DATABASE_URL.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = initializeDatabase() as any

// Export a helper to get the current dialect
export const getDialect = () => (isMysql ? 'mysql' : 'postgresql')

/**
 * Format a Date for use in Drizzle WHERE clauses.
 * MySQL rejects ISO 8601 strings — convert to 'YYYY-MM-DD HH:MM:SS'.
 * PostgreSQL accepts Date objects directly.
 */
export function formatDbDate(date: Date): string | Date {
  if (!isMysql) return date
  return date.toISOString().replace('T', ' ').slice(0, 19)
}
