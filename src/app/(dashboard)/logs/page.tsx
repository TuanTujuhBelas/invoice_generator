import { ScrollText } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const metadata = { title: 'Log Aktivitas' }

export default function LogsPage() {
  return (
    <>
      <PageHeader title="Log Aktivitas" />
      <EmptyState icon={ScrollText} title="Segera hadir" description="Riwayat aktivitas dan error dibangun di minggu 7." />
    </>
  )
}
