import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

// Load .env.local first, then .env as fallback
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/masjid_journal'
const IS_MYSQL = DATABASE_URL.startsWith('mysql:')

export default defineConfig({
  schema: IS_MYSQL ? './drizzle/schema.mysql.ts' : './drizzle/schema.pg.ts',
  out: IS_MYSQL ? './drizzle/migrations/mysql' : './drizzle/migrations',
  dialect: IS_MYSQL ? 'mysql' : 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
  verbose: true,
  strict: true,
})
