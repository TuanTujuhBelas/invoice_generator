import { UserPlus } from 'lucide-react'
import { Suspense } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { ContactFilters } from '@/features/contacts/components/contact-filters'
import { ContactList } from '@/features/contacts/components/contact-list'
import { ContactListSkeleton } from '@/features/contacts/components/contact-list-skeleton'
import { listContacts, type ContactListFilter } from '@/features/contacts/queries'
import { ContactListQuerySchema } from '@/lib/validation/contact'

export const metadata = { title: 'Kontak' }

async function ContactsResults({ searchParams }: { searchParams: PageProps<'/contacts'>['searchParams'] }) {
  const { q, type, archived } = ContactListQuerySchema.parse(await searchParams)
  const filter: ContactListFilter = { query: q, type, archived }
  const items = await listContacts(filter)

  return (
    <>
      <ContactFilters filter={filter} />
      <ContactList items={items} archived={archived} />
    </>
  )
}

export default function ContactsPage({ searchParams }: PageProps<'/contacts'>) {
  return (
    <>
      <PageHeader
        title="Kontak"
        description="Data klien dan pengirim untuk invoice."
        actions={
          <ButtonLink href="/contacts/new">
            <UserPlus className="size-4" aria-hidden />
            Tambah
          </ButtonLink>
        }
      />
      <Suspense fallback={<ContactListSkeleton />}>
        <ContactsResults searchParams={searchParams} />
      </Suspense>
    </>
  )
}
