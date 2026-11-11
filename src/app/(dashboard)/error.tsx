'use client'

import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
      <div className="flex items-center gap-2 font-medium text-red-800 dark:text-red-300">
        <TriangleAlert className="size-5" aria-hidden />
        Terjadi kesalahan saat memuat halaman.
      </div>
      <p className="text-sm text-red-700 dark:text-red-400">
        Silakan coba lagi. Jika masalah berlanjut, catat kode berikut.
      </p>
      {error.digest && <code className="text-xs text-red-600">{error.digest}</code>}
      <Button variant="secondary" onClick={reset}>
        Coba lagi
      </Button>
    </div>
  )
}
