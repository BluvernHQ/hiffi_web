import { AppLayout } from "@/components/layout/app-layout"
import { NotFoundContent } from "@/components/errors/not-found-content"

/** Root 404 for routes outside (main) that have no app shell layout. */
export default function NotFound() {
  return (
    <AppLayout>
      <NotFoundContent />
    </AppLayout>
  )
}
