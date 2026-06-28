/**
 * Database error handler utility
 * Prevents exposing sensitive database error details to end users
 */

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

/**
 * Wraps database operations to catch and sanitize errors
 */
export async function handleDatabaseOperation<T>(
  operation: () => Promise<T>,
  userFriendlyMessage: string = 'Terjadi kesalahan pada database'
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    // Log full error for debugging (only in server logs, not shown to user)
    if (process.env.NODE_ENV === 'development') {
      console.error('[Database Error]', error)
    } else {
      // In production, log minimal info
      console.error('[Database Error]', {
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }

    // Throw user-friendly error
    throw new DatabaseError(userFriendlyMessage, error)
  }
}

/**
 * Extract user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof DatabaseError) {
    return error.message
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    if (process.env.NODE_ENV === 'development') {
      return error.message
    }
    return 'Terjadi kesalahan. Silakan coba lagi.'
  }

  return 'Terjadi kesalahan yang tidak diketahui'
}

/**
 * Format a Date to MySQL-compatible timestamp string (YYYY-MM-DD HH:MM:SS)
 * MySQL rejects ISO 8601 format (with 'T' separator).
 */
export function toMySQLDate(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').replace('Z', '')
}

/**
 * Format a Date to MySQL-compatible date string (YYYY-MM-DD)
 */
export function toMySQLDateOnly(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}
