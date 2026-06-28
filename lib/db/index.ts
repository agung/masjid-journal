import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2'
import * as schemaPg from '@/drizzle/schema.pg'
import * as schemaMysql from '@/drizzle/schema.mysql'

const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/masjid_journal'

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('DATABASE_URL is not set')
}

const isMysql = dbUrl.startsWith('mysql:')

// Prevent multiple instances in development due to HMR
const globalForDb = global as typeof globalThis & {
  pgClient: any
  mysqlPool: any
  dbInstance: any
}

function initializeDatabase() {
  if (globalForDb.dbInstance) return globalForDb.dbInstance

  let dbInstance: any

  if (isMysql) {
    // MySQL setup
    const mysql = require('mysql2/promise')
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
    const postgres = require('postgres')
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

// Export as 'any' to avoid TypeScript union type issues
// The actual type will be determined at runtime based on DATABASE_URL
export const db = initializeDatabase() as any

// Export a helper to get the current dialect
export const getDialect = () => (isMysql ? 'mysql' : 'postgresql')
