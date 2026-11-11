import { requireUser } from '@/lib/auth/current-user'
import { ORG_ID } from '@/lib/config'
import { getDb, type Database } from '@/lib/db'
import type { LOG_SOURCES } from '@/lib/db/schema'
import { uuidv7 } from '@/lib/id'

export type LogSource = (typeof LOG_SOURCES)[number]

export type RequestContext = {
  db: Database
  orgId: string
  correlationId: string
  /** User email from Cloudflare Access, or 'system' / 'cron'. */
  actor: string
  source: LogSource
}

export function newCorrelationId(): string {
  return uuidv7()
}

/** Authenticates the request and builds the context. Throws AppError('UNAUTHORIZED'). */
export async function createServerContext(): Promise<RequestContext> {
  const user = await requireUser()
  return {
    db: await getDb(),
    orgId: ORG_ID,
    correlationId: newCorrelationId(),
    actor: user.email,
    source: 'server',
  }
}
