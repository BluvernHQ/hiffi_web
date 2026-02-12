'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, ImageIcon, Film, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { extractVideoThumbnail, extractMultipleVideoThumbnails, blobToFile } from '@/lib/video-utils';

export default function UploadPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [autoThumbnails, setAutoThumbnails] = useState<string[]>([]); // Preview URLs for auto-generated thumbnails
  const [autoThumbnailBlobs, setAutoThumbnailBlobs] = useState<Blob[]>([]); // Actual blob data for upload
  const [extractingThumbnail, setExtractingThumbnail] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<'select' | 'details' | 'uploading' | 'success'>('select');
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
        setThumbnail(null);
        setThumbnailPreview(null);
        setAutoThumbnails([]);
        setUploadStep('details');
        
        // Automatically extract thumbnails from video
        try {
          setExtractingThumbnail(true);
          const thumbnailBlobs = await extractMultipleVideoThumbnails(selectedFile, 3);
          const previewUrls = thumbnailBlobs.map(blob => URL.createObjectURL(blob));
          setAutoThumbnails(previewUrls);
          setAutoThumbnailBlobs(thumbnailBlobs);
          
          // Set the first auto-generated thumbnail as default
          if (thumbnailBlobs.length > 0) {
            const firstThumbnail = blobToFile(thumbnailBlobs[0], 'thumbnail.jpg');
            setThumbnail(firstThumbnail);
            setThumbnailPreview(previewUrls[0]);
          }
        } catch (error) {
          console.error('[Upload] Failed to extract thumbnails:', error);
          toast({
            title: "Notice",
            description: "Could not extract thumbnail from video. You can upload one manually or the system will generate one automatically.",
            variant: "default",
          });
        } finally {
          setExtractingThumbnail(false);
        }
      } else {
        alert('Please select a valid video file');
      }
    }
  };

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
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
        setThumbnail(null);
        setThumbnailPreview(null);
        setAutoThumbnails([]);
        setUploadStep('details');
        
        // Automatically extract thumbnails from video
        try {
          setExtractingThumbnail(true);
          const thumbnailBlobs = await extractMultipleVideoThumbnails(droppedFile, 3);
          const previewUrls = thumbnailBlobs.map(blob => URL.createObjectURL(blob));
          setAutoThumbnails(previewUrls);
          setAutoThumbnailBlobs(thumbnailBlobs);
          
          // Set the first auto-generated thumbnail as default
          if (thumbnailBlobs.length > 0) {
            const firstThumbnail = blobToFile(thumbnailBlobs[0], 'thumbnail.jpg');
            setThumbnail(firstThumbnail);
            setThumbnailPreview(previewUrls[0]);
          }
        } catch (error) {
          console.error('[Upload] Failed to extract thumbnails:', error);
          toast({
            title: "Notice",
            description: "Could not extract thumbnail from video. You can upload one manually or the system will generate one automatically.",
            variant: "default",
          });
        } finally {
          setExtractingThumbnail(false);
        }
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title) return;

    try {
      setUploading(true);
      setUploadStep('uploading');
      setProgress(0);

      // Step 1: Create upload bridge
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      console.log('[Upload] Creating upload bridge...', { title, description, tags: tagsArray });
      const bridgeResponse = await apiClient.uploadVideo({
        video_title: title,
        video_description: description,
        video_tags: tagsArray, // API expects array of strings
      });

      // Validate bridge response
      if (!bridgeResponse.bridge_id || bridgeResponse.bridge_id.trim() === "") {
        throw new Error("Failed to get bridge ID from upload response. Please try again.");
      }
      if (!bridgeResponse.gateway_url || bridgeResponse.gateway_url.trim() === "") {
        throw new Error("Failed to get upload URL from upload response. Please try again.");
      }

      console.log('[Upload] Bridge created successfully:', {
        bridge_id: bridgeResponse.bridge_id,
        has_gateway_url: !!bridgeResponse.gateway_url,
        has_thumbnail_url: !!bridgeResponse.gateway_url_thumbnail,
      });

      // Step 2: Upload video file to gateway_url with real-time progress
      console.log('[Upload] Uploading video file...');
      await apiClient.uploadFile(
        bridgeResponse.gateway_url, 
        file,
        (p) => {
          // Map 0-100% of file upload to 5-80% of total progress
          const overallProgress = Math.round(5 + (p * 0.75));
          setProgress(overallProgress);
        }
      );
      console.log('[Upload] Video file uploaded successfully');
      setProgress(80);

      // Step 3: Upload thumbnail if provided to gateway_url_thumbnail
      // Thumbnail is optional - video upload will proceed even without thumbnail
      if (thumbnail && bridgeResponse.gateway_url_thumbnail) {
        try {
          console.log('[Upload] Starting thumbnail upload...')
          await apiClient.uploadFile(
            bridgeResponse.gateway_url_thumbnail, 
            thumbnail,
            (p) => {
              // Map 0-100% of thumbnail upload to 80-95% of total progress
              const overallProgress = Math.round(80 + (p * 0.15));
              setProgress(overallProgress);
            }
          );
          console.log('[Upload] Thumbnail uploaded successfully')
          setProgress(95);
        } catch (thumbnailError) {
          console.error('[Upload] Thumbnail upload failed:', thumbnailError)
          // Continue with upload even if thumbnail fails - video upload already succeeded
          toast({
            title: "Warning",
            description: "Video uploaded but thumbnail upload failed. You can update the thumbnail later.",
            variant: "default",
          });
          setProgress(95);
        }
      } else {
        // No thumbnail provided - this is allowed, system will auto-generate one
        console.log('[Upload] No thumbnail provided, skipping thumbnail upload. System will auto-generate thumbnail.')
        setProgress(95);
      }

      // Step 4: Acknowledge upload with bridge_id
      console.log('[Upload] Acknowledging upload with bridge_id:', bridgeResponse.bridge_id);
      await apiClient.acknowledgeUpload(bridgeResponse.bridge_id);
      console.log('[Upload] Upload acknowledged successfully');
      setProgress(100);

      setUploadStep('success');
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
    } catch (error) {
      console.error("[hiffi] Upload failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Upload failed",
        description: errorMessage.length > 100 ? `${errorMessage.substring(0, 100)}...` : errorMessage,
        variant: "destructive",
      });
      setUploadStep('details');
      setUploading(false);
      setProgress(0);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
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
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
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
                      <Link href="/home">Go to Home</Link>
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
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
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
                  <Button variant="outline" onClick={() => setUploadStep('select')}>Cancel</Button>
                  <Button onClick={handleUpload} disabled={!title}>Upload Video</Button>
                </div>
              </div>
            )}

            {uploadStep === 'uploading' && (
              <Card>
                <CardContent className="pt-6 text-center space-y-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Uploading video...</h3>
                    <p className="text-muted-foreground mt-2">Please keep this page open until upload completes.</p>
                  </div>
                  <div className="space-y-2 max-w-md mx-auto">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-right">{progress}%</p>
                  </div>
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
                    <Button variant="outline" onClick={() => router.push('/home')}>Go to Home</Button>
                    <Button onClick={() => {
                      setFile(null);
                      setThumbnail(null);
                      setThumbnailPreview(null);
                      // Clean up auto thumbnail URLs
                      autoThumbnails.forEach(url => URL.revokeObjectURL(url));
                      setAutoThumbnails([]);
                      setAutoThumbnailBlobs([]);
                      setTitle('');
                      setDescription('');
                      setTags('');
                      setProgress(0);
                      setUploadStep('select');
                    }}>Upload Another</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
