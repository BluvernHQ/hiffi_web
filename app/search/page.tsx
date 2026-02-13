'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { VideoGrid } from '@/components/video/video-grid';
import { Search, Loader2, User, Video } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getThumbnailUrl } from '@/lib/storage';
import { getColorFromName, getAvatarLetter, getProfilePictureUrl, getProfilePictureProxyUrl } from '@/lib/utils';
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
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'users'>('all');
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);
  const { toast } = useToast();
  const [userProfilePictures, setUserProfilePictures] = useState<Map<string, string>>(new Map());

  const fetchSearchResults = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setVideoResults([]);
      setUserResults([]);
      setVideoCount(0);
      setUserCount(0);
      return;
    }

    try {
      setLoading(true);
      // Reset results immediately to show loading state
      setVideoResults([]);
      setUserResults([]);

      // Fetch both users and videos in parallel
      const [usersResponse, videosResponse] = await Promise.all([
        apiClient.searchUsers(searchQuery, 50).catch(() => ({ success: false, users: [], count: 0 })),
        apiClient.searchVideos(searchQuery, 100).catch(() => ({ success: false, videos: [], count: 0 }))
      ]);

      // Process User Results
      if (usersResponse.success) {
        const users = usersResponse.users || [];
        setUserResults(users);
        setUserCount(usersResponse.count || 0);

        const profilePictureMap = new Map<string, string>();
        users.forEach((user: any) => {
          const profilePicPath = user.profile_picture || user.image || '';
          if (profilePicPath) {
            const profilePicUrl = getProfilePictureUrl({ profile_picture: profilePicPath, image: profilePicPath }, true);
            const proxyUrl = getProfilePictureProxyUrl(profilePicUrl);
            profilePictureMap.set(user.username || user.uid || '', proxyUrl);
          }
        });
        setUserProfilePictures(profilePictureMap);
      }

      // Process Video Results
      if (videosResponse.success) {
        setVideoResults(videosResponse.videos || []);
        setVideoCount(videosResponse.count || 0);
      }

    } catch (error: any) {
      console.error('[hiffi] Failed to fetch search results:', error);
      toast({
        title: "Error",
        description: "Failed to load search results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch results when query parameter changes
  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';

    // Only fetch if query has actually changed
    if (searchQuery !== currentQuery) {
      setCurrentQuery(searchQuery);

      if (searchQuery.trim()) {
        fetchSearchResults(searchQuery);
      } else {
        setVideoResults([]);
        setUserResults([]);
        setLoading(false);
      }
    }
  }, [searchParams, currentQuery]);

  return (
    <AppLayout>
      <div className="w-full px-3 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center justify-between mb-1 sm:justify-start">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Search Results</h1>
              </div>
              {query && (videoResults.length > 0 || userResults.length > 0) && (
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                  Found <span className="font-semibold text-foreground">{videoResults.length + userResults.length}</span> results for <span className="font-semibold text-foreground">"{query}"</span>
                </p>
              )}
            </div>
          </div>

          {query ? (
            <>
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Searching for "{query}"...</p>
                </div>
              ) : videoResults.length > 0 || userResults.length > 0 ? (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'videos' | 'users')} className="space-y-4 sm:space-y-6">
                  <TabsList className="grid w-full max-w-md grid-cols-3 text-xs sm:text-sm">
                    <TabsTrigger value="all" className="gap-1 sm:gap-2 px-2 sm:px-4">All ({videoResults.length + userResults.length})</TabsTrigger>
                    <TabsTrigger value="videos" className="gap-1 sm:gap-2 px-2 sm:px-4"><Video className="h-3.5 w-3.5" /> Videos ({videoResults.length})</TabsTrigger>
                    <TabsTrigger value="users" className="gap-2"><User className="h-4 w-4" /> Users ({userResults.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-8 mt-6">
                    {/* Users Section */}
                    {userResults.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4"><User className="h-5 w-5 text-muted-foreground" /><h2 className="text-xl font-bold">Users</h2></div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {userResults.map((user: any) => {
                            const profilePicPath = user.profile_picture || user.image || '';
                            const blobUrl = userProfilePictures.get(user.username || user.uid || '');
                            const avatarSrc = blobUrl || (profilePicPath ? getProfilePictureUrl({ profile_picture: profilePicPath, image: profilePicPath }, true) : undefined);
                            return (
                              <Link key={user.uid || user.username} href={`/profile/${user.username}`}>
                                <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer h-full">
                                  <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                      <Avatar className="h-16 w-16">
                                        <AvatarImage src={avatarSrc} />
                                        <AvatarFallback style={{ backgroundColor: getColorFromName(user.username || 'U') }}>{getAvatarLetter({ username: user.username }, 'U')}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg truncate">@{user.username}</h3>
                                        <p className="text-sm text-muted-foreground">View profile</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Videos Section */}
                    {videoResults.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4"><Video className="h-5 w-5 text-muted-foreground" /><h2 className="text-xl font-bold">Videos</h2></div>
                        <VideoGrid videos={videoResults} loading={false} hasMore={false} />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="videos" className="mt-6">
                    <VideoGrid videos={videoResults} loading={false} hasMore={false} />
                  </TabsContent>

                  <TabsContent value="users" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {userResults.map((user: any) => {
                        const profilePicPath = user.profile_picture || user.image || '';
                        const blobUrl = userProfilePictures.get(user.username || user.uid || '');
                        const avatarSrc = blobUrl || (profilePicPath ? getProfilePictureUrl({ profile_picture: profilePicPath, image: profilePicPath }, true) : undefined);
                        return (
                          <Link key={user.uid || user.username} href={`/profile/${user.username}`}>
                            <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer h-full">
                              <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={avatarSrc} />
                                    <AvatarFallback style={{ backgroundColor: getColorFromName(user.username || 'U') }}>{getAvatarLetter({ username: user.username }, 'U')}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg truncate">@{user.username}</h3>
                                    <p className="text-sm text-muted-foreground">View profile</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
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
    </AppLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading search...</p>
            </div>
          </div>
        </AppLayout>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
