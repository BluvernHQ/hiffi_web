import { NotFoundContent } from "@/components/errors/not-found-content"

/** Main routes already use AppLayout in (main)/layout.tsx — do not wrap again. */
export default function MainNotFound() {
  return <NotFoundContent />
}
