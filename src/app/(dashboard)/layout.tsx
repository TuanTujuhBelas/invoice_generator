import { CircleUserRound, ReceiptText } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { BottomNav, SidebarNav } from '@/components/layout/app-nav'
import { getCurrentUser } from '@/lib/auth/current-user'

async function CurrentUserBadge() {
  const user = await getCurrentUser()
  if (!user) return null
  return (
    <p className="flex items-center gap-2 truncate text-xs text-zinc-500">
      <CircleUserRound className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{user.email}</span>
    </p>
  )
}

export default function DashboardLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-zinc-200 bg-white p-4 md:flex dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/" className="flex items-center gap-2 px-3 font-semibold text-zinc-900 dark:text-zinc-50">
          <ReceiptText className="size-5" aria-hidden />
          Invoice Generator
        </Link>
        <SidebarNav />
        <div className="mt-auto px-3">
          <Suspense fallback={null}>
            <CurrentUserBadge />
          </Suspense>
        </div>
      </aside>
      <main className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 pt-6 pb-24 md:px-8 md:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
