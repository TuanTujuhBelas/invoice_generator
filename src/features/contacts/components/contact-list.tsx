import { Archive, ArchiveRestore, Mail, Pencil, Phone, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { Contact } from '@/lib/db/schema'
import { setContactArchived } from '../actions'

const TYPE_LABELS: Record<Contact['type'], string> = {
  client: 'Klien',
  sender: 'Pengirim',
}

export function ContactList({ items, archived }: { items: Contact[]; archived: boolean }) {
  if (items.length === 0) {
    return archived ? (
      <EmptyState icon={Archive} title="Tidak ada kontak di arsip" />
    ) : (
      <EmptyState
        icon={Users}
        title="Belum ada kontak"
        description="Tambahkan klien atau data pengirim pertama Anda."
        action={
          <ButtonLink href="/contacts/new">
            <UserPlus className="size-4" aria-hidden />
            Tambah kontak
          </ButtonLink>
        }
      />
    )
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {items.map((contact) => (
        <li key={contact.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/contacts/${contact.id}/edit`}
                className="truncate font-medium text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {contact.name}
              </Link>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {TYPE_LABELS[contact.type]}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
              {contact.email && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{contact.email}</span>
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0" aria-hidden />
                  {contact.phone}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <ButtonLink
              href={`/contacts/${contact.id}/edit`}
              variant="ghost"
              aria-label={`Ubah ${contact.name}`}
            >
              <Pencil className="size-4" aria-hidden />
            </ButtonLink>
            <form action={setContactArchived.bind(null, contact.id, !archived)}>
              <Button
                type="submit"
                variant={archived ? 'ghost' : 'danger'}
                aria-label={archived ? `Pulihkan ${contact.name}` : `Arsipkan ${contact.name}`}
              >
                {archived ? (
                  <ArchiveRestore className="size-4" aria-hidden />
                ) : (
                  <Archive className="size-4" aria-hidden />
                )}
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  )
}
