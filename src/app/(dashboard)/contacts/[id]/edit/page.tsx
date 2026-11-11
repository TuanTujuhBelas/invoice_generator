import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { z } from 'zod'
import { PageHeader } from '@/components/ui/page-header'
import { updateContact } from '@/features/contacts/actions'
import { ContactForm } from '@/features/contacts/components/contact-form'
import { getContact } from '@/features/contacts/queries'

export const metadata = { title: 'Ubah kontak' }

async function EditContactForm({ params }: { params: PageProps<'/contacts/[id]/edit'>['params'] }) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  const contact = await getContact(id)
  if (!contact) notFound()

  return (
    <ContactForm
      action={updateContact.bind(null, contact.id)}
      submitLabel="Simpan perubahan"
      initialValues={{
        type: contact.type,
        name: contact.name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        address: contact.address ?? '',
        npwp: contact.npwp ?? '',
      }}
    />
  )
}

export default function EditContactPage({ params }: PageProps<'/contacts/[id]/edit'>) {
  return (
    <>
      <PageHeader title="Ubah kontak" />
      <Suspense
        fallback={<div className="h-96 max-w-2xl animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />}
      >
        <EditContactForm params={params} />
      </Suspense>
    </>
  )
}
