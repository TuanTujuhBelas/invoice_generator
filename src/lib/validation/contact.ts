import { z } from 'zod'
import { CONTACT_TYPES } from '@/lib/db/schema'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .transform((value) => (value === '' ? null : value))

export const ContactInputSchema = z.object({
  type: z.enum(CONTACT_TYPES, { error: 'Pilih jenis kontak' }),
  name: z.string().trim().min(1, 'Nama wajib diisi').max(200, 'Maksimal 200 karakter'),
  email: z
    .string()
    .trim()
    .max(254)
    .transform((value) => (value === '' ? null : value.toLowerCase()))
    .pipe(z.email('Format email tidak valid').nullable()),
  phone: optionalText(32),
  address: optionalText(500),
  npwp: z
    .string()
    .trim()
    .transform((value) => value.replace(/[.\-\s]/g, ''))
    .refine((value) => value === '' || /^\d{15,16}$/.test(value), 'NPWP harus 15 atau 16 digit')
    .transform((value) => (value === '' ? null : value)),
})

export type ContactInput = z.infer<typeof ContactInputSchema>

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value)

export const ContactListQuerySchema = z.object({
  q: z.preprocess(firstValue, z.string().trim().max(100).optional()).catch(undefined),
  type: z.preprocess(firstValue, z.enum(CONTACT_TYPES).optional()).catch(undefined),
  archived: z.preprocess(firstValue, z.string().optional()).transform((value) => value === '1'),
})

export const CONTACT_FORM_FIELDS =['type', 'name', 'email', 'phone', 'address', 'npwp'] as const

export type ContactFormField = (typeof CONTACT_FORM_FIELDS)[number]
