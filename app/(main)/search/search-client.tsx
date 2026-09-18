'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { VideoGrid } from '@/components/video/video-grid';
import { ArrowRight, Loader2, Search, User, Video } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { getProfilePictureUrl, getProfilePictureProxyUrl } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchCreatorCard } from '@/components/search/search-creator-card';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { addPendingFollowIntent } from '@/lib/guest-conversion/pending-intents';
import { markGuestFollowAttempt } from '@/lib/guest-conversion/session';
import {
  getUserSearchTerm,
  isSuspiciousSqlLikeQuery,
  isUserHandleSearch,
  normalizeSearchQueryForRequest,
} from '@/lib/search-query';
import { onSearchQuerySubmitted } from '@/lib/analytics/journey-tracking';
import { isConnectivityError, userFacingNetworkMessage } from '@/lib/network-errors';

const VIDEOS_PER_PAGE = 10;
const USERS_PER_PAGE = 50;
const TOP_CREATORS_PREVIEW = 6;
const FEATURED_VIDEOS_PREVIEW = 6;

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [videoResults, setVideoResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [videoCount, setVideoCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMoreVideos, setLoadingMoreVideos] = useState(false);
  const [videoOffset, setVideoOffset] = useState(0);
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'users'>('all');
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, userData } = useAuth();
  const [userProfilePictures, setUserProfilePictures] = useState<Map<string, string>>(new Map());
  const [followedUsernames, setFollowedUsernames] = useState<Set<string>>(new Set());
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogUser, setAuthDialogUser] = useState<{ username: string; displayName: string } | null>(null);

  const currentUsername = userData?.username || user?.username || null;

  useEffect(() => {
    if (!user) {
      setFollowedUsernames(new Set());
      return;
    }

    let cancelled = false;

    const loadFollowing = async () => {
      try {
        const response = await apiClient.getFollowingList(100, 0);
        if (cancelled || !response.success || !response.following) return;

        const usernames = new Set(
          response.following
            .map((entry) => entry.followed_to_username || entry.followed_to)
            .filter(Boolean),
        );
        setFollowedUsernames(usernames);
      } catch (error) {
        console.error('[hiffi] Failed to load following list for search:', error);
      }
    };

    loadFollowing();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const isUserFollowed = useCallback(
    (searchUser: any) => {
      const username = searchUser?.username;
      if (!username) return false;

      return (
        searchUser.following === true ||
        searchUser.isfollowing === true ||
        searchUser.is_following === true ||
        followedUsernames.has(username)
      );
    },
    [followedUsernames],
  );

  const handleFollowingChange = useCallback((username: string, following: boolean) => {
    setFollowedUsernames((prev) => {
      const next = new Set(prev);
      if (following) {
        next.add(username);
      } else {
        next.delete(username);
      }
      return next;
    });
  }, []);

  const handleRequestAuth = useCallback(
    (username: string, displayName: string) => {
      addPendingFollowIntent(username, displayName);
      markGuestFollowAttempt();
      setAuthDialogUser({ username, displayName });
      setAuthDialogOpen(true);
    },
    [],
  );

  const fetchSearchResults = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setVideoResults([]);
      setUserResults([]);
      setVideoCount(0);
      setUserCount(0);
      setVideoOffset(0);
      setHasMoreVideos(false);
      setLoadingInitial(false);
      setLoadingMoreVideos(false);
      setIsFetchingVideos(false);
      return;
    }

    try {
      setLoadingInitial(true);
      setIsFetchingVideos(true);
      setVideoResults([]);
      setUserResults([]);
      setVideoOffset(0);
      setHasMoreVideos(false);

      const q = normalizeSearchQueryForRequest(searchQuery);
      if (isSuspiciousSqlLikeQuery(q)) {
        setVideoCount(0);
        setUserCount(0);
        return;
      }

      const userHandleSearch = isUserHandleSearch(q);
      const userSearchTerm = userHandleSearch ? getUserSearchTerm(q) : q;

      if (userHandleSearch && !userSearchTerm) {
        setVideoResults([]);
        setUserResults([]);
        setVideoCount(0);
        setUserCount(0);
        return;
      }

      const [usersResponse, videosResponse] = await Promise.all([
        apiClient.searchUsers(userSearchTerm, USERS_PER_PAGE, 0).catch(() => ({ success: false, users: [], count: 0 })),
        userHandleSearch
          ? Promise.resolve({ success: false, videos: [], count: 0 })
          : apiClient.searchVideos(q, VIDEOS_PER_PAGE, 0).catch(() => ({ success: false, videos: [], count: 0 })),
      ]);

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

      if (videosResponse.success) {
        const videos = videosResponse.videos || [];
        const totalVideos = videosResponse.count || 0;
        setVideoResults(videos);
        setVideoCount(totalVideos);
        setVideoOffset(videos.length);
        setHasMoreVideos(videos.length === VIDEOS_PER_PAGE);
      }

    } catch (error: any) {
      console.error('[hiffi] Failed to fetch search results:', error);
      toast({
        title: isConnectivityError(error) ? 'No internet connection' : 'Error',
        description: isConnectivityError(error) ? userFacingNetworkMessage() : 'Failed to load search results.',
        variant: 'destructive',
      });
    } finally {
      setLoadingInitial(false);
      setIsFetchingVideos(false);
    }
  };

  const loadMoreVideos = async () => {
    if (!currentQuery?.trim() || loadingInitial || loadingMoreVideos || !hasMoreVideos || isFetchingVideos) return;

    const q = normalizeSearchQueryForRequest(currentQuery);
    if (isSuspiciousSqlLikeQuery(q)) {
      setHasMoreVideos(false);
      return;
    }

    try {
      setLoadingMoreVideos(true);
      setIsFetchingVideos(true);

      const videosResponse = await apiClient.searchVideos(q, VIDEOS_PER_PAGE, videoOffset);
      if (!videosResponse.success) {
        setHasMoreVideos(false);
        return;
      }

      const nextVideos = videosResponse.videos || [];
      const totalVideos = videosResponse.count || 0;
      setVideoCount(totalVideos);
      setVideoResults((prev) => {
        const seen = new Set(prev.map((video: any) => video.videoId || video.video_id));
        const deduped = nextVideos.filter((video: any) => !seen.has(video.videoId || video.video_id));
        const merged = [...prev, ...deduped];
        setVideoOffset(merged.length);
        setHasMoreVideos(nextVideos.length === VIDEOS_PER_PAGE);
        return merged;
      });
    } catch (error) {
      console.error('[hiffi] Failed to load more search videos:', error);
      setHasMoreVideos(false);
    } finally {
      setLoadingMoreVideos(false);
      setIsFetchingVideos(false);
    }
  };

  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';

    if (searchQuery !== currentQuery) {
      setCurrentQuery(searchQuery);

      if (searchQuery.trim()) {
        onSearchQuerySubmitted(searchQuery.trim(), 'enter', 'search_page');
        fetchSearchResults(searchQuery);
      } else {
        setVideoResults([]);
        setUserResults([]);
        setVideoCount(0);
        setUserCount(0);
        setLoadingInitial(false);
        setLoadingMoreVideos(false);
        setVideoOffset(0);
        setHasMoreVideos(false);
        setIsFetchingVideos(false);
      }
    }
  }, [searchParams, currentQuery]);

  const getCreatorAvatarSrc = (user: any) => {
    const profilePicPath = user.profile_picture || user.image || '';
    const blobUrl = userProfilePictures.get(user.username || user.uid || '');
    return blobUrl || (profilePicPath ? getProfilePictureUrl({ profile_picture: profilePicPath, image: profilePicPath }, true) : undefined);
  };

  const renderCreatorCards = (users: any[]) => (
    <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3">
      {users.map((searchUser: any) => (
        <SearchCreatorCard
          key={searchUser.uid || searchUser.username}
          user={searchUser}
          avatarSrc={getCreatorAvatarSrc(searchUser)}
          fill
          initialFollowing={isUserFollowed(searchUser)}
          isAuthenticated={Boolean(user)}
          currentUsername={currentUsername}
          onRequestAuth={handleRequestAuth}
          onFollowingChange={handleFollowingChange}
        />
      ))}
    </div>
  );

  const featuredVideos = videoResults.slice(0, FEATURED_VIDEOS_PREVIEW);
  const previewCreators = userResults.slice(0, TOP_CREATORS_PREVIEW);

  return (
    <div className="w-full px-3 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center justify-between mb-1 sm:justify-start">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Search Results</h1>
              </div>
              {query && (videoResults.length > 0 || userResults.length > 0) && (
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                  Showing top results for{' '}
                  <span className="font-semibold text-foreground">&apos;{query}&apos;</span>
                </p>
              )}
            </div>
          </div>

          {query ? (
            <>
              {loadingInitial ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Searching for "{query}"...</p>
                </div>
              ) : videoResults.length > 0 || userResults.length > 0 ? (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'videos' | 'users')} className="space-y-4 sm:space-y-6">
                  <TabsList className="inline-flex h-auto w-fit gap-2 rounded-full bg-transparent p-0">
                    <TabsTrigger
                      value="all"
                      className="rounded-full border border-transparent bg-muted px-5 py-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="users"
                      className="gap-1.5 rounded-full border border-transparent bg-muted px-5 py-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                    >
                      <User className="h-3.5 w-3.5" />
                      Users
                    </TabsTrigger>
                    <TabsTrigger
                      value="videos"
                      className="gap-1.5 rounded-full border border-transparent bg-muted px-5 py-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Videos
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-6 space-y-8 sm:space-y-10">
                    {previewCreators.length > 0 && (
                      <div>
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h2 className="text-lg font-bold sm:text-xl">Users</h2>
                          {userCount > TOP_CREATORS_PREVIEW && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('users')}
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                            >
                              View all users ({userCount})
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {renderCreatorCards(previewCreators)}
                      </div>
                    )}

                    {featuredVideos.length > 0 && (
                      <div>
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h2 className="text-lg font-bold sm:text-xl">Videos</h2>
                          {(videoCount > FEATURED_VIDEOS_PREVIEW || videoResults.length > FEATURED_VIDEOS_PREVIEW) && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('videos')}
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                            >
                              See all videos
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <VideoGrid
                          videos={featuredVideos}
                          loading={false}
                          hasMore={false}
                          openVideoUiName="opened-video-from-search"
                          hideTimestamp
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="videos" className="mt-6">
                    <VideoGrid
                      videos={videoResults}
                      loading={loadingInitial || loadingMoreVideos}
                      hasMore={hasMoreVideos}
                      onLoadMore={loadMoreVideos}
                      openVideoUiName="opened-video-from-search"
                      hideTimestamp
                    />
                  </TabsContent>

                  <TabsContent value="users" className="mt-6 space-y-4">
                    <h2 className="text-lg font-bold sm:text-xl">Users</h2>
                    {renderCreatorCards(userResults)}
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
              <p className="text-muted-foreground">
                Search videos by title, or use <span className="font-medium text-foreground/80">@username</span> to find
                users and creators.
              </p>
            </div>
          )}
        </div>

        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          title="Never miss a drop"
          description="Sign up to follow artists and get notified when they upload something new."
          artistUsername={authDialogUser?.username}
          artistDisplayName={authDialogUser?.displayName}
          conversionTrigger="follow_attempt"
        />
      </div>
  );
}

export function SearchClient() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading search...</p>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
