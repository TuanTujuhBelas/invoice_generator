import { Search } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { INPUT_CLASS_NAME } from '@/components/ui/form-field'
import type { ContactListFilter } from '../queries'

function tabHref(filter: ContactListFilter, archived: boolean): string {
  const params = new URLSearchParams()
  if (filter.query) params.set('q', filter.query)
  if (filter.type) params.set('type', filter.type)
  if (archived) params.set('archived', '1')
  const search = params.toString()
  return search ? `/contacts?${search}` : '/contacts'
}

/** Plain GET form: works without JavaScript and keeps filters in the URL. */
export function ContactFilters({ filter }: { filter: ContactListFilter }) {
  const tabs = [
    { label: 'Aktif', archived: false },
    { label: 'Arsip', archived: true },
  ]

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Status kontak" className="flex gap-1">
        {tabs.map((tab) => {
          const active = Boolean(filter.archived) === tab.archived
          return (
            <Link
              key={tab.label}
              href={tabHref(filter, tab.archived)}
              aria-current={active ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                active
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <form action="/contacts" className="flex flex-wrap gap-2" role="search">
        {filter.archived && <input type="hidden" name="archived" value="1" />}
        <label htmlFor="contact-search" className="sr-only">
          Cari kontak
        </label>
        <input
          id="contact-search"
          name="q"
          type="search"
          placeholder="Cari nama, email, atau telepon"
          defaultValue={filter.query ?? ''}
          className={`${INPUT_CLASS_NAME} min-w-0 flex-1 basis-56`}
        />
        <label htmlFor="contact-type" className="sr-only">
          Jenis kontak
        </label>
        <select
          id="contact-type"
          name="type"
          defaultValue={filter.type ?? ''}
          className={`${INPUT_CLASS_NAME} w-auto`}
        >
          <option value="">Semua jenis</option>
          <option value="client">Klien</option>
          <option value="sender">Pengirim</option>
        </select>
        <Button type="submit" variant="secondary">
          <Search className="size-4" aria-hidden />
          Cari
        </Button>
      </form>
    </div>
  )
}
