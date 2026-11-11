'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { contacts } from '@/lib/db/schema'
import { AppError } from '@/lib/errors'
import { uuidv7 } from '@/lib/id'
import { traced } from '@/lib/logger/activity'
import { createServerContext } from '@/lib/logger/context'
import {
  CONTACT_FORM_FIELDS,
  ContactInputSchema,
  type ContactFormField,
} from '@/lib/validation/contact'

export type ContactFormState = {
  message?: string
  fieldErrors?: Partial<Record<ContactFormField, string[]>>
  values?: Partial<Record<ContactFormField, string>>
}

const ContactIdSchema = z.uuid()

function readFormValues(formData: FormData): Record<ContactFormField, string> {
  return Object.fromEntries(
    CONTACT_FORM_FIELDS.map((field) => {
      const value = formData.get(field)
      return [field, typeof value === 'string' ? value : '']
    }),
  ) as Record<ContactFormField, string>
}

function toFailureState(error: unknown, values: ContactFormState['values']): ContactFormState {
  const message =
    error instanceof AppError ? error.message : 'Gagal menyimpan kontak. Silakan coba lagi.'
  return { message, values }
}

export async function createContact(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const ctx = await createServerContext()
  const values = readFormValues(formData)
  const parsed = ContactInputSchema.safeParse(values)
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values }
  }

  const id = uuidv7()
  try {
    await traced(ctx, 'contact.created', { entityType: 'contact', entityId: id }, async () => {
      const now = new Date().toISOString()
      await ctx.db.insert(contacts).values({
        id,
        orgId: ctx.orgId,
        ...parsed.data,
        createdAt: now,
        updatedAt: now,
      })
    })
  } catch (error) {
    return toFailureState(error, values)
  }

  revalidatePath('/contacts')
  redirect('/contacts')
}

export async function updateContact(
  id: string,
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const ctx = await createServerContext()
  const contactId = ContactIdSchema.parse(id)
  const values = readFormValues(formData)
  const parsed = ContactInputSchema.safeParse(values)
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values }
  }

  try {
    await traced(
      ctx,
      'contact.updated',
      { entityType: 'contact', entityId: contactId },
      async () => {
        const updated = await ctx.db
          .update(contacts)
          .set({ ...parsed.data, updatedAt: new Date().toISOString() })
          .where(and(eq(contacts.id, contactId), eq(contacts.orgId, ctx.orgId)))
          .returning({ id: contacts.id })
        if (updated.length === 0) {
          throw new AppError('CONTACT_NOT_FOUND', 'Kontak tidak ditemukan.')
        }
      },
    )
  } catch (error) {
    return toFailureState(error, values)
  }

  revalidatePath('/contacts')
  redirect('/contacts')
}

export async function setContactArchived(id: string, archived: boolean): Promise<void> {
  const ctx = await createServerContext()
  const contactId = ContactIdSchema.parse(id)
  const isArchived = z.boolean().parse(archived)

  await traced(
    ctx,
    isArchived ? 'contact.archived' : 'contact.restored',
    { entityType: 'contact', entityId: contactId },
    async () => {
      await ctx.db
        .update(contacts)
        .set({ isArchived, updatedAt: new Date().toISOString() })
        .where(and(eq(contacts.id, contactId), eq(contacts.orgId, ctx.orgId)))
    },
  )

  revalidatePath('/contacts')
}
