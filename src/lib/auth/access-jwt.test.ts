import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { verifyAccessJwt, type AccessJwtPayload } from './access-jwt'

const TEAM_DOMAIN = 'test-team.cloudflareaccess.com'
const AUDIENCE = 'aud-tag-123'
const KID = 'key-1'

let keyPair: CryptoKeyPair

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const encodeJson = (value: unknown) => toBase64Url(new TextEncoder().encode(JSON.stringify(value)))

async function signToken(payload: Partial<AccessJwtPayload>, kid = KID): Promise<string> {
  const signingInput = `${encodeJson({ alg: 'RS256', kid })}.${encodeJson(payload)}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyPair.privateKey,
    new TextEncoder().encode(signingInput),
  )
  return `${signingInput}.${toBase64Url(new Uint8Array(signature))}`
}

const now = () => Math.floor(Date.now() / 1000)

const validPayload = (): AccessJwtPayload => ({
  aud: [AUDIENCE],
  iss: `https://${TEAM_DOMAIN}`,
  exp: now() + 300,
  email: 'owner@example.com',
})

const config = { teamDomain: TEAM_DOMAIN, audience: AUDIENCE }

beforeAll(async () => {
  keyPair = (await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ keys: [{ ...publicJwk, kid: KID }] })),
  )
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('verifyAccessJwt', () => {
  it('accepts a valid token and returns the email', async () => {
    const payload = await verifyAccessJwt(await signToken(validPayload()), config)
    expect(payload?.email).toBe('owner@example.com')
  })

  it('rejects a token for another audience', async () => {
    const token = await signToken({ ...validPayload(), aud: ['other-app'] })
    expect(await verifyAccessJwt(token, config)).toBeNull()
  })

  it('rejects a token from another issuer', async () => {
    const token = await signToken({ ...validPayload(), iss: 'https://evil.cloudflareaccess.com' })
    expect(await verifyAccessJwt(token, config)).toBeNull()
  })

  it('rejects an expired token', async () => {
    const token = await signToken({ ...validPayload(), exp: now() - 3600 })
    expect(await verifyAccessJwt(token, config)).toBeNull()
  })

  it('rejects a token whose payload was tampered with', async () => {
    const [header, , signature] = (await signToken(validPayload())).split('.')
    const forgedPayload = encodeJson({ ...validPayload(), email: 'attacker@example.com' })
    expect(await verifyAccessJwt(`${header}.${forgedPayload}.${signature}`, config)).toBeNull()
  })

  it('rejects a token signed with an unknown key id', async () => {
    const token = await signToken(validPayload(), 'unknown-kid')
    expect(await verifyAccessJwt(token, config)).toBeNull()
  })

  it('rejects malformed tokens', async () => {
    expect(await verifyAccessJwt('not-a-jwt', config)).toBeNull()
    expect(await verifyAccessJwt('a.b.c', config)).toBeNull()
  })
})
