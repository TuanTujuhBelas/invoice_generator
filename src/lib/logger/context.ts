import type { Database } from '@/lib/db/client'
import { uuidv7 } from '@/lib/id'
import type { LOG_SOURCES } from '@/lib/db/schema'

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
