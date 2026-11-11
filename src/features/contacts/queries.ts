import { and, asc, eq, or, sql, type AnyColumn } from 'drizzle-orm'
import { requireUser } from '@/lib/auth/current-user'
import { ORG_ID } from '@/lib/config'
import { getDb } from '@/lib/db'
import { contacts, type Contact, type CONTACT_TYPES } from '@/lib/db/schema'

export type ContactType = (typeof CONTACT_TYPES)[number]

export type ContactListFilter = {
  type?: ContactType
  query?: string
  archived?: boolean
}

const MAX_LIST_ROWS = 500

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

function containsText(column: AnyColumn, pattern: string) {
  return sql`${column} LIKE ${pattern} ESCAPE '\\'`
}

export async function listContacts(filter: ContactListFilter = {}): Promise<Contact[]> {
  await requireUser()
  const db = await getDb()

  const conditions = [
    eq(contacts.orgId, ORG_ID),
    eq(contacts.isArchived, filter.archived ?? false),
  ]
  if (filter.type) conditions.push(eq(contacts.type, filter.type))

  const query = filter.query?.trim()
  if (query) {
    const pattern = `%${escapeLike(query)}%`
    const search = or(
      containsText(contacts.name, pattern),
      containsText(contacts.email, pattern),
      containsText(contacts.phone, pattern),
    )
    if (search) conditions.push(search)
  }

  return db
    .select()
    .from(contacts)
    .where(and(...conditions))
    .orderBy(asc(contacts.name))
    .limit(MAX_LIST_ROWS)
}

export async function getContact(id: string): Promise<Contact | null> {
  await requireUser()
  const db = await getDb()
  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.orgId, ORG_ID)))
    .limit(1)
  return contact ?? null
}
