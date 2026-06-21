import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

// Load .env.local first, then .env as fallback
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/masjid_journal',
  },
  verbose: true,
  strict: true,
})
