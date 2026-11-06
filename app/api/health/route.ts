import { env } from 'cloudflare:workers'

export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    await env.DB.prepare('SELECT 1').first()
    return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ status: 'unhealthy' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
