import { ChevronRight, ScrollText, Settings, Stamp } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const metadata = { title: 'Pengaturan' }

const SHORTCUTS = [
  { href: '/templates', label: 'Template', icon: Stamp },
  { href: '/logs', label: 'Log Aktivitas', icon: ScrollText },
]

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Lainnya" />
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white md:hidden dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {SHORTCUTS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-12 items-center gap-3 px-4 text-sm font-medium">
              <Icon className="size-4 text-zinc-500" aria-hidden />
              <span className="flex-1">{label}</span>
              <ChevronRight className="size-4 text-zinc-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <EmptyState
        icon={Settings}
        title="Pengaturan segera hadir"
        description="Profil usaha, pajak default, dan backup."
      />
    </>
  )
}
