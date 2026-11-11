import { sql } from 'drizzle-orm'
import { connection } from 'next/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { getDb } from '@/lib/db'

export async function GET() {
  await connection()
  const user = await getCurrentUser()
  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Sesi tidak valid.' } },
      { status: 401 },
    )
  }

  try {
    const db = await getDb()
    await db.run(sql`SELECT 1`)
    return Response.json({ status: 'ok', db: 'ok' })
  } catch {
    return Response.json(
      { error: { code: 'DB_UNAVAILABLE', message: 'Database tidak dapat dihubungi.' } },
      { status: 503 },
    )
  }
}
