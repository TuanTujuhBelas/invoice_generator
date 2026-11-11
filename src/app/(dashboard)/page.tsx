import { FilePlus2, UserPlus } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Ringkasan piutang dan invoice jatuh tempo." />
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">Mulai dari kontak</p>
          <p className="text-sm text-zinc-500">
            Simpan data pengirim dan klien agar bisa dipilih saat membuat invoice.
          </p>
          <ButtonLink href="/contacts/new" variant="secondary" className="self-start">
            <UserPlus className="size-4" aria-hidden />
            Tambah kontak
          </ButtonLink>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">Buat invoice</p>
          <p className="text-sm text-zinc-500">Form invoice dengan live preview sedang dibangun.</p>
          <ButtonLink href="/invoices" variant="secondary" className="self-start">
            <FilePlus2 className="size-4" aria-hidden />
            Ke daftar invoice
          </ButtonLink>
        </div>
      </section>
    </>
  )
}
