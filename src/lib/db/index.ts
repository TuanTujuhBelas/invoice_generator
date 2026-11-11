import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createDb, type Database } from './client'

export type { Database } from './client'

/** Server-only: resolves the D1 binding from wrangler config (local in dev, remote when deployed). */
export async function getDb(): Promise<Database> {
  const { env } = await getCloudflareContext({ async: true })
  return createDb(env.DB)
}
