import { describe, expect, it } from 'vitest'
import { uuidv7 } from '../id'
import { REDACTED, redact } from './redact'

describe('redact', () => {
  it('masks sensitive keys at any depth', () => {
    expect(
      redact({
        invoiceNumber: 'INV-2026-0001',
        accessToken: 'abc',
        nested: { signedUrl: 'https://r2/x', cookie: 'c', emailBody: '<p>hi</p>' },
      }),
    ).toEqual({
      invoiceNumber: 'INV-2026-0001',
      accessToken: REDACTED,
      nested: { signedUrl: REDACTED, cookie: REDACTED, emailBody: REDACTED },
    })
  })

  it('masks binary values and truncates long strings', () => {
    const redacted = redact({ pdf: new Uint8Array([1, 2]), note: 'x'.repeat(2000) }) as {
      pdf: unknown
      note: string
    }
    expect(redacted.pdf).toBe(REDACTED)
    expect(redacted.note).toHaveLength(1000)
  })
})

describe('uuidv7', () => {
  it('produces RFC 9562 version 7 ids ordered by time', () => {
    const earlier = uuidv7(1_700_000_000_000)
    const later = uuidv7(1_700_000_000_001)
    expect(earlier).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(earlier < later).toBe(true)
  })
})
