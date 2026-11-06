import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@/drizzle/schema.sqlite'
import { getRuntimeEnv } from '@/lib/env'

// D1 bindings are request/runtime scoped. Do not construct a database client at
// module initialization time or cache a binding between Worker invocations.
export function getDb() {
  return drizzle(getRuntimeEnv().DB, { schema })
}

// Existing server modules import `db`; this proxy resolves the D1 binding only
// when a query builder method is accessed, keeping imports safe during builds.
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, property) {
    const instance = getDb()
    const value = Reflect.get(instance, property, instance)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

export function formatDbDate(date: Date): Date { return date }
