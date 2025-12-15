'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { VideoGrid } from '@/components/video/video-grid';
import { Search, Loader2, User, Video } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getThumbnailUrl } from '@/lib/storage';
import { getColorFromName, getAvatarLetter, getProfilePictureUrl } from '@/lib/utils';
import { getSeed } from '@/lib/seed-manager';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const VIDEOS_PER_PAGE = 10;

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [videoResults, setVideoResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [videoCount, setVideoCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMoreVideos, setLoadingMoreVideos] = useState(false);
  const [videoOffset, setVideoOffset] = useState(0);
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'users'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string | null>(null); // Use null to detect initial mount
  const { toast } = useToast();

  const fetchSearchResults = async (searchQuery: string, isInitialLoad: boolean = true) => {
    if (!searchQuery.trim()) {
      setVideoResults([]);
      setUserResults([]);
      setVideoCount(0);
      setUserCount(0);
      setVideoOffset(0);
      setHasMoreVideos(false);
      return;
    }

    try {
      if (isInitialLoad) {
      setLoading(true);
        setVideoResults([]);
        setVideoOffset(0);
      }
      
      // Fetch users (only on initial load)
      if (isInitialLoad) {
        const usersResponse = await apiClient.searchUsers(searchQuery, 50).catch(() => ({ success: false, users: [], count: 0 }));
      if (usersResponse.success) {
        setUserResults(usersResponse.users || []);
        setUserCount(usersResponse.count || 0);
      } else {
        setUserResults([]);
        setUserCount(0);
      }
      }
      
      // For videos, use video list API with seed and filter client-side for infinite scroll
      const seed = getSeed();
      const currentOffset = isInitialLoad ? 0 : videoOffset;
      
      const videosResponse = await apiClient.getVideoList({
        offset: currentOffset,
        limit: VIDEOS_PER_PAGE,
        seed: seed,
      }).catch(() => ({ success: false, videos: [] }));
      
      if (videosResponse.success && videosResponse.videos) {
        // Filter videos by search query (case-insensitive)
        const queryLower = searchQuery.toLowerCase();
        const filteredVideos = videosResponse.videos.filter((video: any) => {
          const title = (video.video_title || video.videoTitle || '').toLowerCase();
          const description = (video.video_description || video.videoDescription || '').toLowerCase();
          return title.includes(queryLower) || description.includes(queryLower);
        });
        
        if (isInitialLoad) {
          setVideoResults(filteredVideos);
          // Use actual filtered count instead of API count to avoid mismatches
          // The count will be updated as we load more pages
          setVideoCount(filteredVideos.length);
        } else {
          setVideoResults((prev) => {
            // Prevent duplicates
            const existingIds = new Set(prev.map(v => v.videoId || v.video_id));
            const newVideos = filteredVideos.filter(v => !existingIds.has(v.videoId || v.video_id));
            return [...prev, ...newVideos];
          });
        }
        
        // If we got fewer videos than requested, there might be no more pages
        // Also check if we got any filtered results - if not, might need to keep searching
        setHasMoreVideos(videosResponse.videos.length === VIDEOS_PER_PAGE && filteredVideos.length >= 0);
        
        // Video count is now based on actual results length, updated automatically
      } else {
        if (isInitialLoad) {
        setVideoResults([]);
        setVideoCount(0);
        }
        setHasMoreVideos(false);
      }
    } catch (error: any) {
      console.error('[hiffi] Failed to fetch search results:', error);
      if (isInitialLoad) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load search results. Please try again.",
        variant: "destructive",
      });
      setVideoResults([]);
      setUserResults([]);
      setVideoCount(0);
      setUserCount(0);
      }
      setHasMoreVideos(false);
    } finally {
      setLoading(false);
      setLoadingMoreVideos(false);
      setIsFetchingVideos(false);
    }
  };

  const loadMoreVideos = useCallback(() => {
    if (!loading && !loadingMoreVideos && !isFetchingVideos && hasMoreVideos && query.trim()) {
      // Offset should be the number of items to skip, not page number
      // Increment by VIDEOS_PER_PAGE to get the next batch
      const nextOffset = videoOffset + VIDEOS_PER_PAGE;
      console.log(`[hiffi] Loading more videos for search "${query}" - Current offset: ${videoOffset}, Next offset: ${nextOffset}`);
      setVideoOffset(nextOffset);
      setIsFetchingVideos(true);
      setLoadingMoreVideos(true);
      fetchSearchResults(query, false);
    }
  }, [loading, loadingMoreVideos, isFetchingVideos, hasMoreVideos, videoOffset, query]);

  // Fetch results when query parameter changes
  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';
    const queryKey = searchQuery.trim() ? `q=${searchQuery}` : ''; // Empty string for no query
    
    // Always fetch if query changed or on initial mount
    if (currentQuery === null || queryKey !== currentQuery) {
      console.log('[hiffi] Query changed from', currentQuery, 'to', queryKey, 'searchQuery:', searchQuery);
      setCurrentQuery(queryKey);
      
      // Always reset state when query changes (including clearing on refresh with no query)
      setVideoResults([]);
      setUserResults([]);
      setVideoCount(0);
      setUserCount(0);
      setVideoOffset(0);
      setHasMoreVideos(false);
      
      if (searchQuery.trim()) {
        setLoading(true);
        fetchSearchResults(searchQuery, true);
      } else {
        // No query - ensure everything is cleared and loading is false
        setLoading(false);
        console.log('[hiffi] No query parameter, cleared all results');
      }
    }
    // Depend on searchParams to detect URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto w-full min-w-0">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Search Results</h1>
                {query && (videoResults.length > 0 || userResults.length > 0) && (
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Found <span className="font-semibold text-foreground">{videoResults.length + userResults.length}</span> results for <span className="font-semibold text-foreground">"{query}"</span>
                  </p>
                )}
              </div>

              {query ? (
                <>
                  {loading && videoResults.length === 0 && userResults.length === 0 ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Searching for "{query}"...</p>
                    </div>
                  ) : videoResults.length > 0 || userResults.length > 0 ? (
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'videos' | 'users')} className="space-y-6">
                      <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="all" className="gap-2">
                          All ({videoResults.length + userResults.length})
                        </TabsTrigger>
                        <TabsTrigger value="videos" className="gap-2">
                          <Video className="h-4 w-4" />
                          Videos ({videoResults.length})
                        </TabsTrigger>
                        <TabsTrigger value="users" className="gap-2">
                          <User className="h-4 w-4" />
                          Users ({userResults.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="space-y-8 mt-6">
                        {/* Users Section */}
                        {userResults.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <h2 className="text-xl font-bold">Users ({userCount})</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {userResults.map((user: any) => (
                                <Link key={user.uid || user.username} href={`/profile/${user.username}`}>
                                  <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer h-full">
                                    <CardContent className="p-6">
                                      <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16">
                                          <AvatarImage src={user.profile_picture ? getProfilePictureUrl({ profile_picture: user.profile_picture }) : undefined} />
                                          <AvatarFallback 
                                            className="text-white font-semibold text-lg"
                                            style={{ backgroundColor: getColorFromName(user.username || 'U') }}
                                          >
                                            {getAvatarLetter({ username: user.username }, 'U')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-semibold text-lg truncate">@{user.username}</h3>
                                          <p className="text-sm text-muted-foreground">View profile</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Videos Section */}
                        {videoResults.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Video className="h-5 w-5 text-muted-foreground" />
                              <h2 className="text-xl font-bold">Videos ({videoResults.length})</h2>
                            </div>
                            <VideoGrid
                              videos={videoResults}
                              loading={loading || loadingMoreVideos}
                              hasMore={hasMoreVideos}
                              onLoadMore={loadMoreVideos}
                              onVideoDeleted={(videoId) => {
                                // Remove deleted video from the list
                                setVideoResults((prev) => 
                                  prev.filter((v) => (v.videoId || v.video_id) !== videoId)
                                )
                              }}
                            />
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="videos" className="mt-6">
                        {videoResults.length > 0 ? (
                          <VideoGrid
                            videos={videoResults}
                            loading={false}
                            hasMore={false}
                            onVideoDeleted={(videoId) => {
                              // Remove deleted video from the list
                              setVideoResults((prev) => 
                                prev.filter((v) => (v.videoId || v.video_id) !== videoId)
                              )
                            }}
                          />
                        ) : (
                          <div className="text-center py-12">
                            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No videos found</h3>
                            <p className="text-muted-foreground">Try different keywords or check your spelling</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="users" className="mt-6">
                        {userResults.length > 0 ? (
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {userResults.map((user: any) => (
                              <Link key={user.uid || user.username} href={`/profile/${user.username}`}>
                                <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer h-full">
                                  <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                      <Avatar className="h-16 w-16">
                                        <AvatarImage src={user.profile_picture ? getProfilePictureUrl({ profile_picture: user.profile_picture }) : undefined} />
                                        <AvatarFallback 
                                          className="text-white font-semibold text-lg"
                                          style={{ backgroundColor: getColorFromName(user.username || 'U') }}
                                        >
                                          {getAvatarLetter({ username: user.username }, 'U')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg truncate">@{user.username}</h3>
                                        <p className="text-sm text-muted-foreground">View profile</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No users found</h3>
                            <p className="text-muted-foreground">Try different keywords or check your spelling</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No results found</h3>
                      <p className="text-muted-foreground">Try different keywords or check your spelling</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start searching</h3>
                  <p className="text-muted-foreground">Enter a search term to find videos and users</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Navbar onMenuClick={() => {}} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar isMobileOpen={false} onMobileClose={() => {}} />
            <main className="flex-1 overflow-y-auto w-full min-w-0">
              <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading search...</p>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
