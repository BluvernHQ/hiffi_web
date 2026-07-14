'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageIcon, CheckCircle2, Sparkles, Video } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { extractMultipleVideoThumbnails, blobToFile } from '@/lib/video-utils';
import { takePendingVideoFile } from '@/lib/upload-pending-video';
import { registerUploadNavigationGuard } from '@/lib/upload-navigation-guard';
import { useVideoUploadQueue } from '@/lib/video-upload-queue-context';
import { cn } from '@/lib/utils';
import { isCreator } from '@/lib/auth';
import { UploadProgressCard } from '@/components/upload/upload-progress-card';
import { UploadSuccessCard } from '@/components/upload/upload-success-card';
import { StudioShell } from '@/components/creator/studio/studio-shell';
import { STUDIO_HOME, STUDIO_UPLOAD } from '@/lib/studio-routes';

export default function StudioUploadPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { startUpload, jobs, isUploadRunning } = useVideoUploadQueue();

  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [autoThumbnails, setAutoThumbnails] = useState<string[]>([]);
  const [autoThumbnailBlobs, setAutoThumbnailBlobs] = useState<Blob[]>([]);
  const [extractingThumbnail, setExtractingThumbnail] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploadStep, setUploadStep] = useState<
    'details' | 'uploading_background' | 'success'
  >('details');
  const [isInitializing, setIsInitializing] = useState(true);
  const [trackedJobId, setTrackedJobId] = useState<string | null>(null);
  const [successVideoId, setSuccessVideoId] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [cancelSelectDialogOpen, setCancelSelectDialogOpen] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const pendingCheckedRef = useRef(false);

  const uploadingWatchVideoId = useMemo(() => {
    if (uploadStep !== 'uploading_background' || !trackedJobId) return undefined;
    const id = jobs.find((j) => j.id === trackedJobId)?.videoId?.trim();
    return id || undefined;
  }, [uploadStep, trackedJobId, jobs]);

  // Check if user is a creator - MUST be before any conditional returns
  useEffect(() => {
    if (!authLoading && user && userData) {
      if (!isCreator(userData)) {
        toast({
          title: 'Creator Status Required',
          description: 'You need to become a creator to upload videos.',
        });
        router.push('/creator/apply');
      }
    }
  }, [user, userData, authLoading, router, toast]);

  const applySelectedVideoFile = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile.type.startsWith('video/')) {
        alert('Please select a valid video file');
        return;
      }
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      setThumbnail(null);
      setThumbnailPreview(null);
      setAutoThumbnails([]);
      setUploadStep('details');

      try {
        setExtractingThumbnail(true);
        const thumbnailBlobs = await extractMultipleVideoThumbnails(selectedFile, 3);
        const previewUrls = thumbnailBlobs.map((blob) => URL.createObjectURL(blob));
        setAutoThumbnails(previewUrls);
        setAutoThumbnailBlobs(thumbnailBlobs);

        if (thumbnailBlobs.length > 0) {
          const firstThumbnail = blobToFile(thumbnailBlobs[0], 'thumbnail.jpg');
          setThumbnail(firstThumbnail);
          setThumbnailPreview(previewUrls[0]);
        }
      } catch (error) {
        console.error('[Upload] Failed to extract thumbnails:', error);
        toast({
          title: 'Notice',
          description:
            'Could not extract thumbnail from video. You can upload one manually or the system will generate one automatically.',
          variant: 'default',
        });
      } finally {
        setExtractingThumbnail(false);
      }
    },
    [toast],
  );

  // Video chosen on studio home → pending file → land here on details step
  useEffect(() => {
    if (authLoading) return;
    if (!user || !userData) return;
    if (!isCreator(userData)) return;
    if (pendingCheckedRef.current) return;
    pendingCheckedRef.current = true;

    const pending = takePendingVideoFile();
    if (pending) {
      void applySelectedVideoFile(pending).finally(() => setIsInitializing(false));
    } else {
      router.replace(STUDIO_HOME);
    }
  }, [authLoading, user, userData, router, applySelectedVideoFile]);

  useEffect(() => {
    registerUploadNavigationGuard(() => {
      if (uploadStep === 'details' && file) {
        return {
          shouldBlock: true,
          message:
            'You have a video draft on this page. If you leave now, you will lose it unless you finish uploading.',
        };
      }
      return { shouldBlock: false, message: '' };
    });
    return () => registerUploadNavigationGuard(null);
  }, [uploadStep, file]);

  useEffect(() => {
    const hasDraft = uploadStep === 'details' && file;
    if (!hasDraft && !isUploadRunning) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [uploadStep, file, isUploadRunning]);

  useEffect(() => {
    const draft = uploadStep === 'details' && file;
    if (!draft) return;

    const onDocClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = (e.target as HTMLElement).closest('a[href]');
      if (!el) return;
      const a = el as HTMLAnchorElement;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (!href.startsWith('/') || href.startsWith('//')) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
      setLeaveDialogOpen(true);
    };

    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [uploadStep, file]);

  useEffect(() => {
    if (!trackedJobId) return;
    const job = jobs.find((j) => j.id === trackedJobId);
    if (!job) return;
    if (job.status === 'done') {
      setSuccessVideoId(job.videoId?.trim() || null);
      setUploadStep('success');
      setTrackedJobId(null);
    }
    if (job.status === 'error') {
      setUploadStep('details');
      setTrackedJobId(null);
    }
  }, [jobs, trackedJobId]);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('image/')) {
        setThumbnail(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setThumbnailPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleSelectAutoThumbnail = (index: number) => {
    if (index >= autoThumbnails.length || index >= autoThumbnailBlobs.length) return;

    const selectedBlob = autoThumbnailBlobs[index];
    const thumbnailFile = blobToFile(selectedBlob, 'thumbnail.jpg');

    setThumbnail(thumbnailFile);
    setThumbnailPreview(autoThumbnails[index]);
  };

  const handleRemoveThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview(null);
  };

  useEffect(() => {
    return () => {
      autoThumbnails.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore errors during cleanup
        }
      });
    };
  }, [autoThumbnails]);

  const handleUpload = () => {
    if (!file || !title) return;
    if (!thumbnail) {
      toast({
        title: 'Thumbnail required',
        description: 'Pick suggested frame or upload custom thumbnail before uploading video.',
        variant: 'destructive',
      });
      return;
    }
    setSuccessVideoId(null);
    const id = startUpload({
      file,
      title,
      description,
      tags,
      thumbnail,
    });
    setTrackedJobId(id);
    setUploadStep('uploading_background');
  };

  const confirmLeave = () => {
    if (pendingHref) {
      setLeaveDialogOpen(false);
      router.push(pendingHref);
      setPendingHref(null);
    }
  };

  const discardDraftAndGoToSelect = () => {
    setCancelSelectDialogOpen(false);
    autoThumbnails.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    });
    setFile(null);
    setThumbnail(null);
    setThumbnailPreview(null);
    setAutoThumbnails([]);
    setAutoThumbnailBlobs([]);
    setTitle('');
    setDescription('');
    setTags('');
    router.push(STUDIO_HOME);
  };

  if (isInitializing) {
    return (
      <StudioShell maxWidthClass="max-w-3xl" loginRedirect={STUDIO_UPLOAD}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </StudioShell>
    );
  }

  return (
    <StudioShell maxWidthClass="max-w-3xl" loginRedirect={STUDIO_UPLOAD}>
      <h1 className="mb-6 text-2xl font-bold sm:mb-8 sm:text-3xl">Upload Video</h1>
      {uploadStep === 'details' && (
        <div className="grid gap-6">
          <section
            aria-labelledby="upload-details-title"
            className={cn(
              'group rounded-xl border border-primary/25 bg-card p-5 shadow-sm',
              'transition-[border-color,box-shadow,transform] duration-200',
              'hover:border-primary/40 hover:shadow-md',
              'motion-safe:hover:-translate-y-px',
              'sm:rounded-2xl sm:p-7',
            )}
          >
            <header className="mb-6 flex items-start gap-4 sm:mb-7">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/[0.14] sm:h-12 sm:w-12"
                aria-hidden
              >
                <Video className="size-5 sm:size-[22px]" strokeWidth={1.65} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2
                  id="upload-details-title"
                  className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base"
                >
                  Video details
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  Add metadata to help viewers find your video.
                </p>
                {file?.name ? (
                  <p className="mt-2 truncate text-[12px] text-muted-foreground">
                    <span className="font-medium text-foreground/90">File:</span> {file.name}
                  </p>
                ) : null}
              </div>
            </header>

            <div className="space-y-7">
              <div className="space-y-2">
                <Label htmlFor="title">Title (required)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your video a catchy title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="gaming, cooking, travel (comma separated)"
                />
                <p className="text-xs text-muted-foreground">Tags help people find your video.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label>Thumbnail (Required)</Label>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Pick a frame or upload an image</span>
                </div>

                {extractingThumbnail && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Extracting thumbnails from video...</span>
                  </div>
                )}

                {autoThumbnails.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[13px] font-medium text-foreground/90">
                      Select a frame from your video
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {autoThumbnails.map((url, index) => (
                        <div
                          key={index}
                          className={`relative aspect-video cursor-pointer overflow-hidden rounded-xl border-2 bg-muted transition-all hover:opacity-90 ${
                            thumbnailPreview === url
                              ? 'border-primary ring-2 ring-primary ring-offset-2'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleSelectAutoThumbnail(index)}
                        >
                          <Image
                            src={url}
                            alt={`Thumbnail option ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {thumbnailPreview === url && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                              <CheckCircle2 className="h-6 w-6 text-primary" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="relative aspect-video w-full max-w-[240px] items-center justify-center overflow-hidden rounded-xl border bg-muted">
                      {thumbnailPreview ? (
                        <Image
                          src={thumbnailPreview || '/placeholder.svg'}
                          alt="Thumbnail preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                          <ImageIcon className="mb-1 h-6 w-6" />
                          <span className="text-xs">No thumbnail</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="text-[13px] leading-relaxed text-muted-foreground">
                        {thumbnailPreview
                          ? 'Thumbnail selected. Click to change or upload a custom image.'
                          : 'Select a suggested frame or upload a custom thumbnail image.'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-analytics-name="upload-custom-thumbnail-button"
                          className="h-9 rounded-xl"
                          onClick={() => thumbnailInputRef.current?.click()}
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Upload Custom
                        </Button>
                        {thumbnailPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            data-analytics-name="upload-remove-thumbnail-button"
                            className="h-9 rounded-xl"
                            onClick={handleRemoveThumbnail}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={thumbnailInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleThumbnailSelect}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              data-analytics-name="upload-cancel-draft-button"
              onClick={() => {
                if (file) setCancelSelectDialogOpen(true);
                else router.push(STUDIO_HOME);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!title || !thumbnail}
              data-analytics-name="upload-submit-video-button"
            >
              Upload Video
            </Button>
          </div>
        </div>
      )}

      {uploadStep === 'uploading_background' && (
        <UploadProgressCard uploadingWatchVideoId={uploadingWatchVideoId} />
      )}

      {uploadStep === 'success' && (
        <UploadSuccessCard
          successVideoId={successVideoId}
          onUploadAnother={() => {
            setSuccessVideoId(null);
            setFile(null);
            setThumbnail(null);
            setThumbnailPreview(null);
            autoThumbnails.forEach((url) => URL.revokeObjectURL(url));
            setAutoThumbnails([]);
            setAutoThumbnailBlobs([]);
            setTitle('');
            setDescription('');
            setTags('');
            router.push(STUDIO_HOME);
          }}
        />
      )}

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="sm:max-w-md" overlayClassName="bg-black/40 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Leave this page?</DialogTitle>
            <DialogDescription>
              You have a video draft. If you leave now, you will lose it unless you finish uploading from this page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLeaveDialogOpen(false);
                setPendingHref(null);
              }}
            >
              Stay
            </Button>
            <Button type="button" variant="destructive" onClick={confirmLeave}>
              Leave anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelSelectDialogOpen} onOpenChange={setCancelSelectDialogOpen}>
        <DialogContent className="sm:max-w-md" overlayClassName="bg-black/40 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Discard this video?</DialogTitle>
            <DialogDescription>
              Your selected file and details will be cleared. This does not affect uploads already running in the
              background.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setCancelSelectDialogOpen(false)}>
              Keep editing
            </Button>
            <Button type="button" variant="destructive" onClick={discardDraftAndGoToSelect}>
              Discard and go back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudioShell>
  );
}
