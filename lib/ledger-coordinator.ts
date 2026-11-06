export class LedgerCoordinator {
  private tail: Promise<void> = Promise.resolve()
  private releases = new Map<string, { close: () => void; unlock: () => void }>()

  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/lock' && request.method === 'POST') {
      const { organizationId, userId } = await request.json() as { organizationId: string; userId: string }
      const membership = await this.env.DB.prepare('SELECT 1 FROM member WHERE organization_id = ? AND user_id = ? LIMIT 1').bind(organizationId, userId).first()
      if (!membership) return new Response('Forbidden', { status: 403 })

      const previous = this.tail
      let releaseTurn!: () => void
      this.tail = new Promise<void>((resolve) => { releaseTurn = resolve })
      await previous
      const token = crypto.randomUUID()
      let closeStream!: () => void
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('locked'))
          closeStream = () => controller.close()
        },
      })
      this.releases.set(token, { close: closeStream, unlock: releaseTurn })
      return new Response(body, { headers: { 'x-lock-token': token, 'Cache-Control': 'no-store' } })
    }
    if (url.pathname === '/unlock' && request.method === 'POST') {
      const token = request.headers.get('x-lock-token')
      const lock = token ? this.releases.get(token) : undefined
      if (!lock) return new Response('Invalid lock', { status: 409 })
      this.releases.delete(token!)
      lock.close()
      lock.unlock()
      return new Response(null, { status: 204 })
    }
    return new Response('Not found', { status: 404 })
  }
}

export async function withLedgerLock<T>(organizationId: string, userId: string, operation: () => Promise<T>): Promise<T> {
  const id = (await import('cloudflare:workers')).env.LEDGER_COORDINATOR.idFromName(organizationId)
  const coordinator = (await import('cloudflare:workers')).env.LEDGER_COORDINATOR.get(id)
  const response = await coordinator.fetch('https://ledger/lock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, userId }),
  })
  if (!response.ok) throw new Error(response.status === 403 ? 'Akses organisasi ditolak.' : 'Gagal mengunci buku kas.')
  const token = response.headers.get('x-lock-token')
  if (!token) throw new Error('Koordinator buku kas tidak mengirim token.')
  try {
    return await operation()
  } finally {
    await coordinator.fetch('https://ledger/unlock', { method: 'POST', headers: { 'x-lock-token': token } })
  }
}
