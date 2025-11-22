'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, ImageIcon, Film, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<'select' | 'details' | 'uploading' | 'success'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Show login prompt if not logged in instead of redirecting
  // Allow users to browse and choose to login when ready

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
        setUploadStep('details');
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
        setUploadStep('details');
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
      const bridgeResponse = await apiClient.uploadVideo({
        video_title: title,
        video_description: description,
        video_tags: tagsArray, // API expects array of strings
      });

      setProgress(25);

      // Step 2: Upload video file to gateway_url
      await apiClient.uploadFile(bridgeResponse.gateway_url, file);
      setProgress(60);

      // Step 3: Upload thumbnail if provided to gateway_url_thumbnail
      if (thumbnail && bridgeResponse.gateway_url_thumbnail) {
        try {
          console.log('[Upload] Starting thumbnail upload...')
          await apiClient.uploadFile(bridgeResponse.gateway_url_thumbnail, thumbnail);
          console.log('[Upload] Thumbnail uploaded successfully')
          setProgress(85);
        } catch (thumbnailError) {
          console.error('[Upload] Thumbnail upload failed:', thumbnailError)
          // Continue with upload even if thumbnail fails - video upload already succeeded
          toast({
            title: "Warning",
            description: "Video uploaded but thumbnail upload failed. You can update the thumbnail later.",
            variant: "default",
          });
          setProgress(85);
        }
      } else {
        console.log('[Upload] No thumbnail provided, skipping thumbnail upload')
        setProgress(85);
      }

      // Step 4: Acknowledge upload with bridge_id
      await apiClient.acknowledgeUpload(bridgeResponse.bridge_id);
      setProgress(100);

      setUploadStep('success');
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
    } catch (error) {
      console.error("[v0] Upload failed:", error);
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
      <div className="min-h-screen flex flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto bg-background w-full min-w-0 flex items-center justify-center">
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
      <div className="min-h-screen flex flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 p-6 overflow-y-auto w-full min-w-0">
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
    <div className="min-h-screen flex flex-col">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-6 overflow-y-auto w-full min-w-0">
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

                    <div className="space-y-2">
                      <Label>Thumbnail</Label>
                      <div className="flex gap-4 items-start">
                        <div 
                          className="relative w-40 aspect-video bg-muted rounded-lg overflow-hidden border flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => thumbnailInputRef.current?.click()}
                        >
                          {thumbnailPreview ? (
                            <Image src={thumbnailPreview || "/placeholder.svg"} alt="Thumbnail preview" fill className="object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                              <ImageIcon className="h-6 w-6 mb-1" />
                              <span className="text-xs">Upload</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">
                            Select or upload a picture that shows what's in your video. A good thumbnail stands out and draws viewers' attention.
                          </p>
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
                    <Button variant="outline" onClick={() => router.push('/')}>Go to Home</Button>
                    <Button onClick={() => {
                      setFile(null);
                      setThumbnail(null);
                      setThumbnailPreview(null);
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
