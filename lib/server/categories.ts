'use server'

import { eq, and, or, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { category } from '@/drizzle/schema'

export async function listCategories({
  organizationId,
  type,
}: {
  organizationId: string
  type?: 'income' | 'expense'
}) {
  return db
    .select()
    .from(category)
    .where(
      and(
        eq(category.isActive, true),
        or(
          eq(category.organizationId, organizationId),
          // Global system categories
          eq(category.isSystem, true)
        ),
        type ? eq(category.type, type) : undefined
      )
    )
    .orderBy(asc(category.type), asc(category.name))
}
