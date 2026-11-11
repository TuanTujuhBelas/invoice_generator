import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const metadata = { title: 'Invoice' }

export default function InvoicesPage() {
  return (
    <>
      <PageHeader title="Invoice" />
      <EmptyState icon={FileText} title="Segera hadir" description="Daftar dan form invoice dibangun berikutnya." />
    </>
  )
}
