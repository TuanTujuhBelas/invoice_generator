import { describe, expect, it } from 'vitest'
import { ContactInputSchema, ContactListQuerySchema } from './contact'

const validInput = {
  type: 'client',
  name: '  PT Maju Jaya  ',
  email: 'Finance@MajuJaya.co.id',
  phone: '',
  address: '',
  npwp: '01.234.567.8-901.000',
}

describe('ContactInputSchema', () => {
  it('normalizes a valid contact', () => {
    const parsed = ContactInputSchema.parse(validInput)
    expect(parsed).toEqual({
      type: 'client',
      name: 'PT Maju Jaya',
      email: 'finance@majujaya.co.id',
      phone: null,
      address: null,
      npwp: '012345678901000',
    })
  })

  it('accepts a 16-digit NPWP and an empty one', () => {
    expect(ContactInputSchema.parse({ ...validInput, npwp: '1234567890123456' }).npwp).toBe(
      '1234567890123456',
    )
    expect(ContactInputSchema.parse({ ...validInput, npwp: '' }).npwp).toBeNull()
  })

  it('rejects an empty name, bad email, bad NPWP, and unknown type', () => {
    const result = ContactInputSchema.safeParse({
      type: 'vendor',
      name: '   ',
      email: 'not-an-email',
      phone: '',
      address: '',
      npwp: '1234',
    })
    expect(result.success).toBe(false)
    const fields = result.error?.issues.map((issue) => issue.path[0])
    expect(fields).toEqual(expect.arrayContaining(['type', 'name', 'email', 'npwp']))
  })
})

describe('ContactListQuerySchema', () => {
  it('falls back to safe defaults for invalid query params', () => {
    expect(ContactListQuerySchema.parse({ type: 'admin', archived: 'yes' })).toEqual({
      q: undefined,
      type: undefined,
      archived: false,
    })
  })

  it('reads the first value of repeated params', () => {
    expect(ContactListQuerySchema.parse({ q: ['budi', 'x'], type: 'sender', archived: '1' })).toEqual({
      q: 'budi',
      type: 'sender',
      archived: true,
    })
  })
})
