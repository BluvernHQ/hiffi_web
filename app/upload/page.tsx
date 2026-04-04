'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
import { Upload, ImageIcon, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { extractMultipleVideoThumbnails, blobToFile } from '@/lib/video-utils';
import { takePendingVideoFile } from '@/lib/upload-pending-video';
import { registerUploadNavigationGuard } from '@/lib/upload-navigation-guard';
import { useVideoUploadQueue } from '@/lib/video-upload-queue-context';

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

  const currentFilter = pathname === '/following' ? ('following' as const) : ('all' as const);
  const onFilterChange = (filter: 'all' | 'following') => {
    router.push(filter === 'following' ? '/following' : '/');
  };

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
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [cancelSelectDialogOpen, setCancelSelectDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

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
    // Clean up auto thumbnail URLs before clearing state
    autoThumbnails.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Error revoking auto thumbnail URL:', e);
      }
    });
    
    setThumbnail(null);
    setThumbnailPreview(null);
    setAutoThumbnails([]);
    setAutoThumbnailBlobs([]);
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
                    <Button asChild>
                      <Link href="/login">Sign in</Link>
                    </Button>
                    <Button variant="outline" asChild>
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
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Upload Video</h1>

            {uploadStep === 'select' && (
              <Card 
                className="border-dashed border-2 min-h-[400px] flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center text-center space-y-4 pt-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Drag and drop video files to upload</h3>
                    <p className="text-muted-foreground mt-2">Your videos will be private until you publish them.</p>
                  </div>
                  <Button size="lg" className="mt-4">Select Files</Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="video/*" 
                    onChange={handleFileSelect}
                  />
                </CardContent>
              </Card>
            )}

            {uploadStep === 'details' && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Video Details</CardTitle>
                    <CardDescription>Add metadata to help viewers find your video</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                        <Label>Thumbnail (Optional)</Label>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Auto-generated if not provided</span>
                      </div>
                      
                      {extractingThumbnail && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>Extracting thumbnails from video...</span>
                        </div>
                      )}

                      {autoThumbnails.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Select a frame from your video:</p>
                          <div className="grid grid-cols-3 gap-3">
                            {autoThumbnails.map((url, index) => (
                              <div
                                key={index}
                                className={`relative aspect-video bg-muted rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:opacity-80 ${
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

                      <div className="space-y-3">
                        <div className="flex gap-4 items-start">
                          <div className="relative w-40 aspect-video bg-muted rounded-lg overflow-hidden border flex items-center justify-center">
                            {thumbnailPreview ? (
                              <Image src={thumbnailPreview || "/placeholder.svg"} alt="Thumbnail preview" fill className="object-cover" />
                            ) : (
                              <div className="flex flex-col items-center text-muted-foreground">
                                <ImageIcon className="h-6 w-6 mb-1" />
                                <span className="text-xs">No thumbnail</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {thumbnailPreview 
                                ? "Thumbnail selected. Click to change or upload a custom image."
                                : "Upload a custom thumbnail image, or leave empty to use an auto-generated frame from your video."}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
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
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      if (file) setCancelSelectDialogOpen(true);
                      else setUploadStep('select');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleUpload} disabled={!title}>
                    Upload Video
                  </Button>
                </div>
              </div>
            )}

            {uploadStep === 'uploading_background' && (
              <Card>
                <CardContent className="pt-6 text-center space-y-4 sm:space-y-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Upload in progress</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      You can browse the rest of Hiffi — progress appears in the bar at the bottom of the screen.
                      Don&apos;t close this tab until the upload finishes.
                    </p>
                  </div>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/">Go to Home</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {uploadStep === 'success' && (
              <Card>
                <CardContent className="pt-6 text-center space-y-6">
                  <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Upload Complete!</h3>
                    <p className="text-muted-foreground mt-2">Your video has been uploaded successfully and is now processing.</p>
                  </div>
                  <div className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" onClick={() => router.push('/')}>Go to Home</Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setThumbnail(null);
                        setThumbnailPreview(null);
                        autoThumbnails.forEach((url) => URL.revokeObjectURL(url));
                        setAutoThumbnails([]);
                        setAutoThumbnailBlobs([]);
                        setTitle('');
                        setDescription('');
                        setTags('');
                        setUploadStep('select');
                      }}
                    >
                      Upload Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
