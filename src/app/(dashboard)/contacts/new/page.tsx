import { PageHeader } from '@/components/ui/page-header'
import { createContact } from '@/features/contacts/actions'
import { ContactForm } from '@/features/contacts/components/contact-form'

export const metadata = { title: 'Tambah kontak' }

export default function NewContactPage() {
  return (
    <>
      <PageHeader title="Tambah kontak" />
      <ContactForm action={createContact} submitLabel="Simpan kontak" />
    </>
  )
}
