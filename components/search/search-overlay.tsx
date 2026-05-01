'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Loader2, User, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { getThumbnailUrl } from '@/lib/storage';
import { AuthenticatedImage } from '@/components/video/authenticated-image';
import { useAuth } from '@/lib/auth-context';
import { ProfilePicture } from '@/components/profile/profile-picture';
import { getColorFromName, getAvatarLetter, getProfilePictureUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { isVideoProcessing, PROCESSING_VIDEO_TOAST } from '@/lib/video-utils';

interface SearchResult {
  id: string;
  title: string;
  type: 'video' | 'user';
  thumbnail?: string;
  username?: string;
  views?: number;
  user?: any; // Add user object for ProfilePicture
  status?: string;
}

const TRENDING_SEARCHES = [
  'hip hop music',
  'rap battles',
  'trap beats',
  'rap freestyle',
];

export function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const resultItemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const isAppPage = pathname === '/app';
  const { toast } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousBlobUrlsRef = useRef<Set<string>>(new Set()); // Track blob URLs for cleanup

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSuggestions([]);
      setSelectedIndex(-1);
    } else {
      // Cleanup blob URLs when overlay closes
      previousBlobUrlsRef.current.forEach((blobUrl) => {
        if (blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl);
        }
      });
      previousBlobUrlsRef.current.clear();
    }
  }, [isOpen]);

  // Reset selected index when suggestions or query change
  useEffect(() => {
    setSelectedIndex(-1);
    resultItemRefs.current = [];
  }, [suggestions, query]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultItemRefs.current[selectedIndex]) {
      resultItemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length > 0) {
      setIsLoading(true);
      // Debounce API call
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const searchQuery = query.trim();

          // Fetch both users and videos in parallel
          const [usersResponse, videosResponse] = await Promise.all([
            apiClient.searchUsers(searchQuery, 5).catch(() => ({ success: false, users: [], count: 0 })),
            apiClient.searchVideos(searchQuery, 5).catch(() => ({ success: false, videos: [], count: 0 })),
          ]);

          const allSuggestions: SearchResult[] = [];

          // Add user suggestions
          if (usersResponse.success && usersResponse.users) {
            const userSuggestions: SearchResult[] = usersResponse.users.map((user: any) => {
              return {
                id: user.uid || user.username || '',
                title: user.username || '',
                type: 'user' as const,
                username: user.username || '',
                thumbnail: user.profile_picture || user.image || '',
                user: user,
              };
            });
            allSuggestions.push(...userSuggestions);
          }

          // Add video suggestions
          if (videosResponse.success && videosResponse.videos) {
            const videoSuggestions: SearchResult[] = videosResponse.videos.map((video: any) => {
              const videoId = video.video_id || video.videoId || '';
              const thumbnailPath = video.video_thumbnail || video.videoThumbnail || '';

              // If no thumbnail field, construct from video_id
              const thumbnail = thumbnailPath || (videoId ? `thumbnails/videos/${videoId}.jpg` : '');

              console.log('[SearchOverlay] Video:', {
                videoId,
                thumbnailPath,
                finalThumbnail: thumbnail
              });

              return {
                id: videoId,
                title: video.video_title || video.videoTitle || '',
                type: 'video' as const,
                thumbnail: thumbnail,
                username: video.user_username || video.userUsername || '',
                views: video.video_views || video.videoViews || 0,
                status: video.status,
              };
            });
            allSuggestions.push(...videoSuggestions);
          }

          // Limit to 8 total suggestions (mix of users and videos)
          setSuggestions(allSuggestions.slice(0, 8));
        } catch (error) {
          console.error('[hiffi] Failed to fetch search suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 400); // 400ms debounce
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      // 1. Close overlay immediately to feel responsive
      onClose();
      setQuery('');

      // 2. Perform navigation
      // Using window.location.href as a fallback if router.push feels slow in some Next.js setups,
      // but router.push is preferred for SPA transition. 
      // The delay described might be due to the search page blocking UI while fetching.
      // We will ensure the search page handles its own loading state properly.
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[90]',
          isAppPage ? 'bg-black/25 backdrop-blur-[2px]' : 'bg-black/50 backdrop-blur-sm',
        )}
        onClick={onClose}
      />

      {/* Search Panel */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-[100] border-b shadow-lg',
          isAppPage ? 'border-black/15 bg-[#f3f0e8] text-black' : 'border-border bg-background',
        )}
      >
        <div className="container max-w-3xl mx-auto p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search
                className={cn(
                  'absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2',
                  isAppPage ? 'text-black/45' : 'text-muted-foreground',
                )}
              />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search videos and users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedIndex >= 0 && resultItemRefs.current[selectedIndex]) {
                      // Navigate to selected item
                      const selectedItem = resultItemRefs.current[selectedIndex];
                      if (selectedItem instanceof HTMLAnchorElement) {
                        selectedItem.click();
                        return;
                      } else if (selectedItem instanceof HTMLButtonElement) {
                        selectedItem.click();
                        return;
                      }
                    }
                    // Always navigate to search page if there's a query
                    if (query.trim()) {
                      handleSearch(query);
                    }
                  } else if (e.key === 'Escape') {
                    onClose();
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    let totalItems = 0;
                    if (query.length === 0) {
                      totalItems = TRENDING_SEARCHES.length;
                    } else if (suggestions.length > 0) {
                      totalItems = suggestions.length + 1; // +1 for "View all results" button
                    }
                    setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                  }
                }}
                className={cn(
                  'pl-10 pr-10 h-12 text-lg',
                  isAppPage &&
                    'border-black/20 bg-white text-black shadow-sm placeholder:text-black/45 focus-visible:border-black/30 focus-visible:ring-black/15 dark:bg-white dark:text-black dark:placeholder:text-black/45',
                )}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2',
                    isAppPage ? 'text-black/45 hover:text-black' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className={isAppPage ? 'text-black/80 hover:bg-black/5 hover:text-black' : undefined}
            >
              Cancel
            </Button>
          </div>

          {/* Search Results */}
          <div ref={resultsContainerRef} className="max-h-[60vh] overflow-y-auto">
            {query.length === 0 ? (
              <div className="space-y-4">
                <div>
                  <h3
                    className={cn(
                      'mb-3 flex items-center gap-2 text-sm font-semibold',
                      isAppPage ? 'text-black/55' : 'text-muted-foreground',
                    )}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Trending Searches
                  </h3>
                  <div className="space-y-1">
                    {TRENDING_SEARCHES.map((search, index) => (
                      <button
                        key={search}
                        onClick={() => handleSearch(search)}
                        data-analytics-name="search-overlay-trending-search-button"
                        className={cn(
                          'w-full rounded-lg px-3 py-2 text-left transition-colors',
                          isAppPage
                            ? 'text-black/90 hover:bg-black/8'
                            : 'hover:bg-muted',
                          selectedIndex === index && (isAppPage ? 'bg-black/10' : 'bg-muted'),
                        )}
                        ref={(el) => {
                          if (el) resultItemRefs.current[index] = el;
                        }}
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {isLoading ? (
                  <div
                    className={cn(
                      'py-8 text-center',
                      isAppPage ? 'text-black/55' : 'text-muted-foreground',
                    )}
                  >
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    <p>Searching...</p>
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    {/* Group suggestions by type */}
                    {(() => {
                      const users = suggestions.filter(s => s.type === 'user');
                      const videos = suggestions.filter(s => s.type === 'video');

                      return (
                        <div className="space-y-4">
                          {/* Users Section */}
                          {users.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2 px-1">
                                <User
                                  className={cn('h-4 w-4', isAppPage ? 'text-black/45' : 'text-muted-foreground')}
                                />
                                <h3
                                  className={cn(
                                    'text-xs font-semibold uppercase tracking-wider',
                                    isAppPage ? 'text-black/55' : 'text-muted-foreground',
                                  )}
                                >
                                  Users
                                </h3>
                              </div>
                              <div className="space-y-1">
                                {users.map((result, index) => {
                                  const itemIndex = suggestions.indexOf(result);
                                  return (
                                    <Link
                                      key={result.id}
                                      href={`/profile/${result.username}`}
                                      data-analytics-name="search-overlay-user-result-link"
                                      onClick={onClose}
                                      className="block"
                                      ref={(el) => {
                                        if (el) resultItemRefs.current[itemIndex] = el;
                                      }}
                                    >
                                      <div
                                        className={cn(
                                          'group flex items-center gap-3 rounded-lg p-3 transition-colors',
                                          isAppPage
                                            ? 'hover:bg-black/8'
                                            : 'hover:bg-muted',
                                          selectedIndex === itemIndex &&
                                            (isAppPage ? 'bg-black/10' : 'bg-muted'),
                                        )}
                                      >
                                        <ProfilePicture user={result.user} size="sm" />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">
                                            @{result.title.split(new RegExp(`(${query})`, 'gi')).map((part, i) =>
                                              part.toLowerCase() === query.toLowerCase() ? (
                                                <mark key={i} className="bg-primary/20 text-primary font-semibold">{part}</mark>
                                              ) : (
                                                <span key={i}>{part}</span>
                                              )
                                            )}
                                          </p>
                                        </div>
                                        <User
                                          className={cn(
                                            'h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100',
                                            isAppPage ? 'text-black/45' : 'text-muted-foreground',
                                          )}
                                        />
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Videos Section */}
                          {videos.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2 px-1">
                                <Video
                                  className={cn('h-4 w-4', isAppPage ? 'text-black/45' : 'text-muted-foreground')}
                                />
                                <h3
                                  className={cn(
                                    'text-xs font-semibold uppercase tracking-wider',
                                    isAppPage ? 'text-black/55' : 'text-muted-foreground',
                                  )}
                                >
                                  Videos
                                </h3>
                              </div>
                              <div className="space-y-1">
                                {videos.map((result) => {
                                  const itemIndex = suggestions.indexOf(result);
                                  const processing = isVideoProcessing(result);
                                  const row = (
                                    <div
                                      className={cn(
                                        'group flex items-center gap-3 rounded-lg p-3 transition-colors',
                                        isAppPage
                                          ? 'hover:bg-black/8'
                                          : 'hover:bg-muted',
                                        selectedIndex === itemIndex &&
                                          (isAppPage ? 'bg-black/10' : 'bg-muted'),
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          'relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg',
                                          isAppPage ? 'bg-black/10' : 'bg-muted',
                                        )}
                                      >
                                        {result.thumbnail ? (
                                          <AuthenticatedImage
                                            src={getThumbnailUrl(result.thumbnail)}
                                            alt={result.title}
                                            fill
                                            className="object-cover"
                                            authenticated={false}
                                          />
                                        ) : (
                                          <div
                                            className={cn(
                                              'flex h-full w-full items-center justify-center',
                                              isAppPage ? 'bg-black/10' : 'bg-muted',
                                            )}
                                          >
                                            <Video
                                              className={cn(
                                                'h-4 w-4',
                                                isAppPage ? 'text-black/40' : 'text-muted-foreground',
                                              )}
                                            />
                                          </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                          <Video className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate mb-1">
                                          {result.title.split(new RegExp(`(${query})`, 'gi')).map((part, i) =>
                                            part.toLowerCase() === query.toLowerCase() ? (
                                              <mark key={i} className="bg-primary/20 text-primary font-semibold">{part}</mark>
                                            ) : (
                                              <span key={i}>{part}</span>
                                            )
                                          )}
                                        </p>
                                        <p
                                          className={cn(
                                            'truncate text-sm',
                                            isAppPage ? 'text-black/55' : 'text-muted-foreground',
                                          )}
                                        >
                                          @{result.username}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                  if (processing) {
                                    return (
                                      <button
                                        key={result.id}
                                        type="button"
                                        data-analytics-name="search-overlay-processing-video-result-button"
                                        className="block w-full text-left"
                                        onClick={() => toast(PROCESSING_VIDEO_TOAST)}
                                        ref={(el) => {
                                          if (el) resultItemRefs.current[itemIndex] = el;
                                        }}
                                      >
                                        {row}
                                      </button>
                                    );
                                  }
                                  return (
                                    <Link
                                      key={result.id}
                                      href={`/watch/${result.id}`}
                                      data-analytics-name="search-overlay-video-result-link"
                                      onClick={onClose}
                                      className="block"
                                      ref={(el) => {
                                        if (el) resultItemRefs.current[itemIndex] = el;
                                      }}
                                    >
                                      {row}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <Button
                      variant="ghost"
                      className={cn(
                        'mt-4 w-full border-t pt-4',
                        isAppPage && 'border-black/15 text-black/90 hover:bg-black/8 hover:text-black',
                        selectedIndex === suggestions.length &&
                          (isAppPage ? 'bg-black/10' : 'bg-muted'),
                      )}
                      data-analytics-name="search-overlay-view-all-results-button"
                      onClick={() => handleSearch(query)}
                      ref={(el) => {
                        if (el) resultItemRefs.current[suggestions.length] = el;
                      }}
                    >
                      View all results for "{query}"
                    </Button>
                  </>
                ) : query.trim().length > 0 ? (
                  <div
                    className={cn(
                      'py-8 text-center',
                      isAppPage ? 'text-black/60' : 'text-muted-foreground',
                    )}
                  >
                    <p>No results found for "{query}"</p>
                    <Button
                      variant="ghost"
                      className={cn('mt-2', isAppPage && 'text-black/80 hover:bg-black/8 hover:text-black')}
                      onClick={() => handleSearch(query)}
                    >
                      Search anyway
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
