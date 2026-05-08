import Link from "next/link"
import { Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function UploadProgressCard({ uploadingWatchVideoId }: { uploadingWatchVideoId?: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center space-y-4 sm:space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Upload in progress</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You can browse the rest of Hiffi — progress appears in the bar at the bottom of the screen. When the upload
            finishes, use <span className="font-medium text-foreground">Watch Video</span> here or in the bar at the
            bottom. Don&apos;t close this tab until the upload finishes.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap">
          {uploadingWatchVideoId ? (
            <Button
              type="button"
              asChild
              className="sm:min-w-[160px]"
              data-analytics-name="upload-progress-watch-video-button"
            >
              <Link href={`/watch/${encodeURIComponent(uploadingWatchVideoId)}`}>Watch Video</Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              className="sm:min-w-[160px]"
              title="Available when the upload finishes"
            >
              Watch Video
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

