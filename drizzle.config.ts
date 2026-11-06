import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './drizzle/schema.sqlite.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: { url: 'file:./local.db' },
  verbose: true,
  strict: true,
})
