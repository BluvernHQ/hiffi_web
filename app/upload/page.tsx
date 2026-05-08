'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, ImageIcon, CheckCircle2, Sparkles, Video, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { extractMultipleVideoThumbnails, blobToFile } from '@/lib/video-utils';
import { takePendingVideoFile } from '@/lib/upload-pending-video';
import { registerUploadNavigationGuard } from '@/lib/upload-navigation-guard';
import { useVideoUploadQueue } from '@/lib/video-upload-queue-context';
import { cn } from '@/lib/utils';
import { UploadProgressCard } from '@/components/upload/upload-progress-card';
import { UploadSuccessCard } from '@/components/upload/upload-success-card';

export default function UploadPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { startUpload, jobs, isUploadRunning } = useVideoUploadQueue();
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isDesktopSidebarOpen,
    toggleDesktopSidebar,
    toggleMobileSidebar,
  } = useSidebar();

  const currentFilter =
    pathname === "/following"
      ? ("following" as const)
      : pathname === "/history"
        ? ("history" as const)
        : pathname === "/liked"
          ? ("liked" as const)
          : ("all" as const)

  const onFilterChange = (filter: "all" | "following" | "liked" | "history") => {
    router.push(
      filter === "following"
        ? "/following"
        : filter === "liked"
          ? "/liked"
          : filter === "history"
            ? "/history"
            : "/",
    )
  }

  const handleMenuClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      toggleDesktopSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [autoThumbnails, setAutoThumbnails] = useState<string[]>([]); // Preview URLs for auto-generated thumbnails
  const [autoThumbnailBlobs, setAutoThumbnailBlobs] = useState<Blob[]>([]); // Actual blob data for upload
  const [extractingThumbnail, setExtractingThumbnail] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploadStep, setUploadStep] = useState<
    'select' | 'details' | 'uploading_background' | 'success'
  >('select');
  const [trackedJobId, setTrackedJobId] = useState<string | null>(null);
  /** Watch page id after last successful upload (API bridge_id). */
  const [successVideoId, setSuccessVideoId] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [cancelSelectDialogOpen, setCancelSelectDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  /** While upload runs in background, video id appears on the job after ack — enables Watch Video on this screen. */
  const uploadingWatchVideoId = useMemo(() => {
    if (uploadStep !== "uploading_background" || !trackedJobId) return undefined
    const id = jobs.find((j) => j.id === trackedJobId)?.videoId?.trim()
    return id || undefined
  }, [uploadStep, trackedJobId, jobs])

  // Check if user is a creator - MUST be before any conditional returns
  useEffect(() => {
    if (!authLoading && user && userData) {
      const isCreator = userData.role === "creator" || userData.is_creator === true
      if (!isCreator) {
        toast({
          title: "Creator Status Required",
          description: "You need to become a creator to upload videos.",
        })
        router.push("/creator/apply")
      }
    }
  }, [user, userData, authLoading, router, toast])

  // Show login prompt if not logged in instead of redirecting
  // Allow users to browse and choose to login when ready

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await applySelectedVideoFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  // Video chosen from Hiffi Studio (file picker) → pending file → land here on details step
  useEffect(() => {
    if (authLoading) return;
    if (!user || !userData) return;
    const isCreatorUser = userData.role === 'creator' || userData.is_creator === true;
    if (!isCreatorUser) return;

    const pending = takePendingVideoFile();
    if (!pending) return;

    void applySelectedVideoFile(pending);
  }, [authLoading, user, userData, applySelectedVideoFile]);

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
    
    // Use the already extracted thumbnail blob
    const selectedBlob = autoThumbnailBlobs[index];
    const thumbnailFile = blobToFile(selectedBlob, 'thumbnail.jpg');
    
    setThumbnail(thumbnailFile);
    setThumbnailPreview(autoThumbnails[index]);
  };

  const handleRemoveThumbnail = () => {
    // Only clear current selection. Keep suggested frames list.
    setThumbnail(null);
    setThumbnailPreview(null);
  };

  // Add cleanup on unmount for auto-generated thumbnails
  useEffect(() => {
    return () => {
      autoThumbnails.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Ignore errors during cleanup
        }
      });
    };
  }, [autoThumbnails]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await applySelectedVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file || !title) return;
    if (!thumbnail) {
      toast({
        title: "Thumbnail required",
        description: "Pick suggested frame or upload custom thumbnail before uploading video.",
        variant: "destructive",
      })
      return
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
    setUploadStep('select');
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar onMenuClick={handleMenuClick} currentFilter={currentFilter} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isMobileOpen={isSidebarOpen}
            onMobileClose={() => setIsSidebarOpen(false)}
            isDesktopOpen={isDesktopSidebarOpen}
            onDesktopToggle={() => toggleDesktopSidebar()}
            currentFilter={currentFilter}
            onFilterChange={onFilterChange}
          />
          <main className="flex-1 overflow-y-auto w-full min-w-0 h-[calc(100dvh-4rem)] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar onMenuClick={handleMenuClick} currentFilter={currentFilter} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isMobileOpen={isSidebarOpen}
            onMobileClose={() => setIsSidebarOpen(false)}
            isDesktopOpen={isDesktopSidebarOpen}
            onDesktopToggle={() => toggleDesktopSidebar()}
            currentFilter={currentFilter}
            onFilterChange={onFilterChange}
          />
          <main className="flex-1 p-6 overflow-y-auto w-full min-w-0 h-[calc(100dvh-4rem)]">
            <div className="max-w-3xl mx-auto">
              <Card className="mt-12">
                <CardContent className="pt-6 text-center space-y-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Sign in to upload videos</h2>
                    <p className="text-muted-foreground">Please sign in to your account to upload videos.</p>
                  </div>
                  <div className="flex gap-4 justify-center pt-4">
                    <Button asChild data-analytics-name="upload-login-prompt-signin-button">
                      <Link href="/login">Sign in</Link>
                    </Button>
                    <Button variant="outline" asChild data-analytics-name="upload-login-prompt-signup-button">
                      <Link href="/signup">Sign up</Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link href="/">Go to Home</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onMenuClick={handleMenuClick} currentFilter={currentFilter} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isMobileOpen={isSidebarOpen}
          onMobileClose={() => setIsSidebarOpen(false)}
          isDesktopOpen={isDesktopSidebarOpen}
          onDesktopToggle={() => toggleDesktopSidebar()}
          currentFilter={currentFilter}
          onFilterChange={onFilterChange}
        />
        <main className="flex-1 p-6 overflow-y-auto w-full min-w-0 h-[calc(100dvh-4rem)]">
          <div className={cn("mx-auto", uploadStep === "select" ? "max-w-5xl" : "max-w-3xl")}>
            {uploadStep === "select" ? (
              <div className="mb-6 sm:mb-8 lg:mb-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Creator
                </p>
                <h1 className="mt-1.5 text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
                  Hiffi Studio
                </h1>
                <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                  Your space to publish, refine, and manage your presence on Hiffi.
                </p>
              </div>
            ) : (
              <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Upload Video</h1>
            )}

            {uploadStep === 'select' && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="sr-only"
                  accept="video/*"
                  onChange={handleFileSelect}
                />

                <section
                  className={cn(
                    "mb-5 flex overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm",
                    "transition-[border-color,box-shadow] duration-200 hover:border-border hover:shadow-md",
                    "sm:mb-6 sm:rounded-2xl",
                    "lg:mb-8",
                  )}
                  aria-labelledby="studio-status-label"
                >
                  <div className="hidden w-1 shrink-0 bg-primary/85 lg:block" aria-hidden />
                  <div className="relative min-w-0 flex-1 px-4 py-4 pl-5 sm:px-6 sm:py-5 sm:pl-6 lg:py-4 lg:pl-6">
                    <div className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-primary lg:hidden" aria-hidden />
                    <div className="pl-3 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:pl-0">
                      <div className="lg:flex lg:items-baseline lg:gap-3">
                        <p
                          id="studio-status-label"
                          className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
                        >
                          Creator status
                        </p>
                        <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-primary lg:mt-0 lg:text-xl">
                          Active
                        </p>
                      </div>
                      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground lg:mt-0 lg:max-w-md lg:text-right">
                        Your channel is active and ready to publish.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-6">
                  <section
                    aria-labelledby="upload-action-title"
                    className={cn(
                      "group rounded-xl border border-primary/25 bg-card p-5 shadow-sm",
                      "transition-[border-color,box-shadow,transform] duration-200",
                      "hover:border-primary/40 hover:shadow-md",
                      "motion-safe:hover:-translate-y-px",
                      "sm:rounded-2xl sm:p-7",
                      "lg:col-span-7 lg:flex lg:flex-col lg:p-8",
                      "xl:col-span-8",
                    )}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-1 flex-col gap-5 sm:gap-6 lg:flex-1">
                      <div className="flex items-start gap-4">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/[0.14] sm:h-12 sm:w-12"
                          aria-hidden
                        >
                          <Video className="size-5 sm:size-[22px]" strokeWidth={1.65} />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <h2
                            id="upload-action-title"
                            className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base"
                          >
                            Upload a video
                          </h2>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                            Share a new release with your audience.
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="lg"
                        data-analytics-name="creator-studio-upload-new-video-button"
                        className="h-11 w-full rounded-xl text-sm font-semibold shadow-none motion-safe:active:scale-[0.99] lg:mt-auto lg:h-12"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Choose a video file to upload"
                      >
                        <Video className="size-4 opacity-95" aria-hidden />
                        Upload new video
                      </Button>

                      <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                        Tip: drag & drop file into this card.
                      </p>
                    </div>
                  </section>

                  <section
                    aria-labelledby="profile-action-title"
                    className={cn(
                      "rounded-xl border border-border/80 bg-muted/30 p-5 shadow-sm",
                      "transition-[border-color,background-color,box-shadow] duration-200",
                      "hover:border-border hover:bg-muted/40 hover:shadow-sm",
                      "dark:bg-card/60 dark:hover:bg-card/80",
                      "sm:rounded-2xl sm:p-6",
                      "lg:col-span-5 lg:flex lg:flex-col lg:justify-between lg:p-6",
                      "xl:col-span-4",
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground dark:bg-background/50"
                        aria-hidden
                      >
                        <UserIcon className="size-[18px]" strokeWidth={1.65} />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h2
                          id="profile-action-title"
                          className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]"
                        >
                          Creator profile
                        </h2>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
                          Update how viewers see you across Hiffi.
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="default"
                      data-analytics-name="creator-studio-manage-profile-button"
                      className="mt-6 h-10 w-full rounded-xl border-border bg-background/90 text-[13px] font-medium motion-safe:active:scale-[0.99] hover:bg-muted/50 dark:bg-transparent dark:hover:bg-muted/30 lg:mt-6"
                    >
                      <Link href={userData?.username ? `/profile/${userData.username}` : "/"}>
                        Manage profile
                      </Link>
                    </Button>
                  </section>
                </div>
              </>
            )}

            {uploadStep === 'details' && (
              <div className="grid gap-6">
                <section
                  aria-labelledby="upload-details-title"
                  className={cn(
                    "group rounded-xl border border-primary/25 bg-card p-5 shadow-sm",
                    "transition-[border-color,box-shadow,transform] duration-200",
                    "hover:border-primary/40 hover:shadow-md",
                    "motion-safe:hover:-translate-y-px",
                    "sm:rounded-2xl sm:p-7",
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
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>Extracting thumbnails from video...</span>
                        </div>
                      )}

                      {autoThumbnails.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[13px] font-medium text-foreground/90">Select a frame from your video</p>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {autoThumbnails.map((url, index) => (
                              <div
                                key={index}
                                className={`relative aspect-video bg-muted rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:opacity-90 ${
                                  thumbnailPreview === url
                                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => handleSelectAutoThumbnail(index)}
                              >
                                <Image src={url} alt={`Thumbnail option ${index + 1}`} fill className="object-cover" />
                                {thumbnailPreview === url && (
                                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
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
                          <div className="relative w-full max-w-[240px] aspect-video bg-muted rounded-xl overflow-hidden border flex items-center justify-center">
                            {thumbnailPreview ? (
                              <Image src={thumbnailPreview || "/placeholder.svg"} alt="Thumbnail preview" fill className="object-cover" />
                            ) : (
                              <div className="flex flex-col items-center text-muted-foreground">
                                <ImageIcon className="h-6 w-6 mb-1" />
                                <span className="text-xs">No thumbnail</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <p className="text-[13px] leading-relaxed text-muted-foreground">
                              {thumbnailPreview 
                                ? "Thumbnail selected. Click to change or upload a custom image."
                                : "Select a suggested frame or upload a custom thumbnail image."}
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
                                <ImageIcon className="h-4 w-4 mr-2" />
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
                      else setUploadStep('select');
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

            {uploadStep === 'uploading_background' && <UploadProgressCard uploadingWatchVideoId={uploadingWatchVideoId} />}

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
                  setTitle("");
                  setDescription("");
                  setTags("");
                  setUploadStep("select");
                }}
              />
            )}
          </div>

          <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
            <DialogContent className="sm:max-w-md" overlayClassName="bg-black/40 backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle>Leave this page?</DialogTitle>
                <DialogDescription>
                  You have a video draft. If you leave now, you will lose it unless you finish uploading from this
                  page.
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
                  Your selected file and details will be cleared. This does not affect uploads already running in
                  the background.
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
        </main>
      </div>
    </div>
  );
}
