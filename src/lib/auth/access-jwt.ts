// Verifies a Cloudflare Access application token (RS256) with Web Crypto.
// https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/

type AccessJwk = JsonWebKey & { kid: string }

type AccessJwtHeader = { alg: string; kid: string }

export type AccessJwtPayload = {
  aud: string | string[]
  iss: string
  exp: number
  nbf?: number
  email?: string
}

export type AccessConfig = {
  /** e.g. `myteam.cloudflareaccess.com` */
  teamDomain: string
  /** Application Audience (AUD) tag. */
  audience: string
}

const CERTS_TTL_MS = 60 * 60 * 1000
const CLOCK_SKEW_SECONDS = 60

let certsCache: { teamDomain: string; keys: AccessJwk[]; fetchedAt: number } | null = null

function base64UrlToBytes(segment: string): Uint8Array<ArrayBuffer> {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function decodeSegment<T>(segment: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment))) as T
}

async function getSigningKeys(teamDomain: string, forceRefresh: boolean): Promise<AccessJwk[]> {
  const isFresh =
    certsCache &&
    certsCache.teamDomain === teamDomain &&
    Date.now() - certsCache.fetchedAt < CERTS_TTL_MS
  if (isFresh && !forceRefresh && certsCache) return certsCache.keys

  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`)
  if (!response.ok) {
    throw new Error(`Failed to fetch Access certs: ${response.status}`)
  }
  const { keys } = (await response.json()) as { keys: AccessJwk[] }
  certsCache = { teamDomain, keys, fetchedAt: Date.now() }
  return keys
}

/** Returns the verified payload, or null when the token is invalid for any reason. */
export async function verifyAccessJwt(
  token: string,
  config: AccessConfig,
): Promise<AccessJwtPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerSegment, payloadSegment, signatureSegment] = parts

  let header: AccessJwtHeader
  let payload: AccessJwtPayload
  try {
    header = decodeSegment<AccessJwtHeader>(headerSegment)
    payload = decodeSegment<AccessJwtPayload>(payloadSegment)
  } catch {
    return null
  }
  if (header.alg !== 'RS256') return null

  let jwk = (await getSigningKeys(config.teamDomain, false)).find((key) => key.kid === header.kid)
  if (!jwk) {
    jwk = (await getSigningKeys(config.teamDomain, true)).find((key) => key.kid === header.kid)
  }
  if (!jwk) return null

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const isValidSignature = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlToBytes(signatureSegment),
    new TextEncoder().encode(`${headerSegment}.${payloadSegment}`),
  )
  if (!isValidSignature) return null

  const now = Math.floor(Date.now() / 1000)
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!audiences.includes(config.audience)) return null
  if (payload.iss !== `https://${config.teamDomain}`) return null
  if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_SECONDS < now) return null
  if (typeof payload.nbf === 'number' && payload.nbf - CLOCK_SKEW_SECONDS > now) return null

  return payload
}
