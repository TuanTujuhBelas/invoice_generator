import { Stamp } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const metadata = { title: 'Template' }

export default function TemplatesPage() {
  return (
    <>
      <PageHeader title="Template" />
      <EmptyState icon={Stamp} title="Segera hadir" description="Upload template dan editor penempatan field dibangun di minggu 4." />
    </>
  )
}
