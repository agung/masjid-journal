import { ReportSkeleton } from '@/components/reports/report-skeleton'

export default function ReportsLoading() {
  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <ReportSkeleton showNavigation={true} />
    </div>
  )
}
