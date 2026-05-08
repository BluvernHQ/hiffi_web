import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function UploadSuccessCard({
  successVideoId,
  onUploadAnother,
}: {
  successVideoId: string | null
  onUploadAnother: () => void
}) {
  return (
    <Card>
      <CardContent className="pt-6 text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Upload Complete!</h3>
          <p className="text-muted-foreground mt-2">
            Your video has been uploaded and is processing. You can open it now — the watch page will show progress
            until playback is ready.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 pt-4 sm:flex-row sm:flex-wrap sm:justify-center">
          {successVideoId ? (
            <Button
              type="button"
              asChild
              className="sm:min-w-[140px]"
              data-analytics-name="upload-success-watch-video-button"
            >
              <Link href={`/watch/${encodeURIComponent(successVideoId)}`}>Watch Video</Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="sm:min-w-[140px]"
            data-analytics-name="upload-another-video-button"
            onClick={onUploadAnother}
          >
            Upload Another
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

