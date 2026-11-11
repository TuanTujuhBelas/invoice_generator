import { activityLogs, type LOG_LEVELS, type LOG_STATUSES, type NewActivityLog } from '@/lib/db/schema'
import { toErrorCode, toSafeMessage, toStack } from '@/lib/errors'
import { uuidv7 } from '@/lib/id'
import type { RequestContext } from './context'
import { redact } from './redact'

export type LogEntityType = 'invoice' | 'template' | 'contact' | 'export' | 'system'

export type LogEntity = {
  entityType?: LogEntityType
  entityId?: string
}

export type LogInput = LogEntity & {
  event: string
  status: (typeof LOG_STATUSES)[number]
  level?: (typeof LOG_LEVELS)[number]
  durationMs?: number
  error?: unknown
  metadata?: Record<string, unknown>
}

export async function logActivity(ctx: RequestContext, input: LogInput): Promise<void> {
  const row: NewActivityLog = {
    id: uuidv7(),
    orgId: ctx.orgId,
    ts: new Date().toISOString(),
    correlationId: ctx.correlationId,
    actor: ctx.actor,
    source: ctx.source,
    level: input.level ?? (input.status === 'failed' ? 'error' : 'info'),
    event: input.event,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    status: input.status,
    durationMs: input.durationMs ?? null,
    errorCode: toErrorCode(input.error),
    errorMessage: toSafeMessage(input.error),
    metadata: input.metadata ? JSON.stringify(redact(input.metadata)) : null,
  }

  console.log(JSON.stringify({ ...row, stack: toStack(input.error) }))

  try {
    await ctx.db.insert(activityLogs).values(row)
  } catch {
    // Logging must never fail the main action.
    console.error(
      JSON.stringify({ event: 'log.write_failed', correlation_id: ctx.correlationId }),
    )
  }
}

export async function traced<T>(
  ctx: RequestContext,
  event: string,
  entity: LogEntity,
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now()
  await logActivity(ctx, { event, ...entity, status: 'started' })
  try {
    const value = await fn()
    await logActivity(ctx, {
      event,
      ...entity,
      status: 'success',
      durationMs: Date.now() - startedAt,
    })
    return value
  } catch (error) {
    await logActivity(ctx, {
      event,
      ...entity,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      error,
    })
    throw error
  }
}
