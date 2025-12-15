'use client';

import { useState, useEffect, Suspense } from 'react';
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
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [videoResults, setVideoResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [videoCount, setVideoCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'users'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

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
      
      // Fetch both users and videos in parallel
      const [usersResponse, videosResponse] = await Promise.all([
        apiClient.searchUsers(searchQuery, 50).catch(() => ({ success: false, users: [], count: 0 })),
        apiClient.searchVideos(searchQuery, 50).catch(() => ({ success: false, videos: [], count: 0 })),
      ]);
      
      if (usersResponse.success) {
        setUserResults(usersResponse.users || []);
        setUserCount(usersResponse.count || 0);
      } else {
        setUserResults([]);
        setUserCount(0);
      }
      
      if (videosResponse.success) {
        setVideoResults(videosResponse.videos || []);
        setVideoCount(videosResponse.count || 0);
      } else {
        setVideoResults([]);
        setVideoCount(0);
      }
    } catch (error: any) {
      console.error('[hiffi] Failed to fetch search results:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load search results. Please try again.",
        variant: "destructive",
      });
      setVideoResults([]);
      setUserResults([]);
      setVideoCount(0);
      setUserCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      fetchSearchResults(query);
    } else {
      setVideoResults([]);
      setUserResults([]);
      setVideoCount(0);
      setUserCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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
                {query && (
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Found <span className="font-semibold text-foreground">{videoCount + userCount}</span> results for <span className="font-semibold text-foreground">"{query}"</span>
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
                          All ({videoCount + userCount})
                        </TabsTrigger>
                        <TabsTrigger value="videos" className="gap-2">
                          <Video className="h-4 w-4" />
                          Videos ({videoCount})
                        </TabsTrigger>
                        <TabsTrigger value="users" className="gap-2">
                          <User className="h-4 w-4" />
                          Users ({userCount})
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
                              <h2 className="text-xl font-bold">Videos ({videoCount})</h2>
                            </div>
                            <VideoGrid
                              videos={videoResults}
                              loading={false}
                              hasMore={false}
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
