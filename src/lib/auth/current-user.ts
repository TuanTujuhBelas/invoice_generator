import { getCloudflareContext } from '@opennextjs/cloudflare'
import { headers } from 'next/headers'
import { DEV_USER_EMAIL } from '@/lib/config'
import { AppError } from '@/lib/errors'
import { verifyAccessJwt } from './access-jwt'

export type CurrentUser = {
  email: string
}

const ACCESS_JWT_HEADER = 'cf-access-jwt-assertion'

/** Server-only. Returns null when the request is not authenticated by Cloudflare Access. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (process.env.NODE_ENV === 'development') {
    return { email: DEV_USER_EMAIL }
  }

  const token = (await headers()).get(ACCESS_JWT_HEADER)
  if (!token) return null

  const { env } = await getCloudflareContext({ async: true })
  // Widened from the literal types wrangler generates for empty vars.
  const teamDomain: string = env.ACCESS_TEAM_DOMAIN
  const audience: string = env.ACCESS_AUD
  if (!teamDomain || !audience) {
    // Fail closed: production without Access config must not serve data.
    console.error(JSON.stringify({ event: 'auth.config_missing' }))
    return null
  }

  const payload = await verifyAccessJwt(token, { teamDomain, audience })
  if (!payload?.email) return null
  return { email: payload.email }
}

/** Use on the first line of every Server Action, Route Handler, and data read. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Sesi tidak valid. Silakan masuk kembali.')
  }
  return user
}
