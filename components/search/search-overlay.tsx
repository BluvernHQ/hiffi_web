'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Loader2, User, Video, AtSign, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { getThumbnailUrl } from '@/lib/storage';
import { AuthenticatedImage } from '@/components/video/authenticated-image';
import { ProfilePicture } from '@/components/profile/profile-picture';
import { getColorFromName, getAvatarLetter, getProfilePictureUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { isVideoProcessing, PROCESSING_VIDEO_TOAST } from '@/lib/video-utils';
import {
  getUserSearchTerm,
  highlightParts,
  isSuspiciousSqlLikeQuery,
  isUserHandleSearch,
  normalizeSearchQueryForRequest,
} from '@/lib/search-query';

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

const RECENT_SEARCHES_KEY = 'hiffi_recent_searches';
const MAX_RECENT_SEARCHES = 5;

function readRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string').slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  const trimmed = term.trim();
  if (!trimmed) return;
  const next = [trimmed, ...readRecentSearches().filter((s) => s !== trimmed)].slice(0, MAX_RECENT_SEARCHES);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

export function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const resultItemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const isAppPage = pathname === '/app';
  const { toast } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousBlobUrlsRef = useRef<Set<string>>(new Set()); // Track blob URLs for cleanup

  const isHandleMode = isUserHandleSearch(query);
  const handleTerm = getUserSearchTerm(query);
  const highlightNeedle = isHandleMode ? handleTerm : query;

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(readRecentSearches());
      inputRef.current?.focus();
      setQuery('');
      setSuggestions([]);
      setSelectedIndex(-1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // Cleanup blob URLs when overlay closes
      previousBlobUrlsRef.current.forEach((blobUrl) => {
        if (blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl);
        }
      });
      previousBlobUrlsRef.current.clear();
    }
    return () => {
      document.body.style.overflow = '';
    };
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
          const searchQuery = normalizeSearchQueryForRequest(query)
          if (!searchQuery) {
            setSuggestions([])
            setIsLoading(false)
            return
          }
          if (isSuspiciousSqlLikeQuery(searchQuery)) {
            setSuggestions([])
            setIsLoading(false)
            return
          }

          const userHandleSearch = isUserHandleSearch(searchQuery)
          const userSearchTerm = userHandleSearch ? getUserSearchTerm(searchQuery) : searchQuery

          if (userHandleSearch && !userSearchTerm) {
            setSuggestions([])
            setIsLoading(false)
            return
          }

          // @ prefix → users/creators only; otherwise search both
          const [usersResponse, videosResponse] = await Promise.all([
            apiClient.searchUsers(userSearchTerm, 5).catch(() => ({ success: false, users: [], count: 0 })),
            userHandleSearch
              ? Promise.resolve({ success: false, videos: [], count: 0 })
              : apiClient.searchVideos(searchQuery, 5).catch(() => ({ success: false, videos: [], count: 0 })),
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
      saveRecentSearch(trimmedQuery);
      onClose();
      setQuery('');
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const emptyStateItems = [
    ...recentSearches.map((term) => ({ type: 'recent' as const, term })),
    ...TRENDING_SEARCHES.filter((t) => !recentSearches.includes(t)).map((term) => ({
      type: 'trending' as const,
      term,
    })),
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[90]',
          isAppPage ? 'bg-black/15' : 'bg-black/25',
        )}
        onClick={onClose}
      />

      {/* Floating search — centered, comfortable width without full-bleed gutters */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-3 pt-2 sm:pt-3">
        <div className="pointer-events-auto w-full max-w-xl">
          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200',
              isAppPage
                ? 'border-black/10 bg-white/95 text-black'
                : 'border-border/70 bg-background/95',
            )}
          >
            <div className="relative flex h-12 items-center">
              {isHandleMode ? (
                <AtSign
                  className={cn(
                    'pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2',
                    isAppPage ? 'text-black/55' : 'text-primary',
                  )}
                />
              ) : (
                <Search
                  className={cn(
                    'pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2',
                    isAppPage ? 'text-black/45' : 'text-muted-foreground',
                  )}
                />
              )}
              <Input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder={isHandleMode ? 'username' : 'Search videos or @username...'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedIndex >= 0 && resultItemRefs.current[selectedIndex]) {
                      const selectedItem = resultItemRefs.current[selectedIndex];
                      if (selectedItem instanceof HTMLAnchorElement) {
                        selectedItem.click();
                        return;
                      }
                      if (selectedItem instanceof HTMLButtonElement) {
                        selectedItem.click();
                        return;
                      }
                    }
                    if (query.trim() && !(isHandleMode && !handleTerm)) {
                      handleSearch(query);
                    }
                  } else if (e.key === 'Escape') {
                    onClose();
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    let totalItems = 0;
                    if (query.length === 0) {
                      totalItems = emptyStateItems.length;
                    } else if (suggestions.length > 0) {
                      totalItems = suggestions.length + 1;
                    }
                    setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                  }
                }}
                className={cn(
                  'h-12 border-0 bg-transparent pl-11 pr-11 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
                  isAppPage &&
                    'text-black placeholder:text-black/45 dark:bg-transparent dark:text-black dark:placeholder:text-black/45',
                )}
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 transition-colors',
                  isAppPage ? 'text-black/45 hover:text-black' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isHandleMode && (
              <div
                className={cn(
                  'flex items-center gap-2 border-t px-3 py-2 text-xs',
                  isAppPage ? 'border-black/10 bg-black/[0.03] text-black/60' : 'border-border/70 bg-muted/40 text-muted-foreground',
                )}
              >
                <User className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {handleTerm
                    ? `Showing creators matching “${handleTerm}”`
                    : 'Type a username to find users and creators'}
                </span>
              </div>
            )}

            {/* Search results — attached to the same floating card */}
            <div
              ref={resultsContainerRef}
              className={cn(
                'max-h-[min(60vh,calc(100dvh-5.5rem))] overflow-y-auto border-t px-3 py-3',
                isAppPage ? 'border-black/10' : 'border-border/70',
              )}
            >
            {query.length === 0 ? (
              <div className="space-y-4">
                {recentSearches.length > 0 && (
                  <div>
                    <h3
                      className={cn(
                        'mb-2 text-xs font-semibold uppercase tracking-wide',
                        isAppPage ? 'text-black/50' : 'text-muted-foreground',
                      )}
                    >
                      Recent
                    </h3>
                    <div className="space-y-0.5">
                      {recentSearches.map((search, index) => (
                        <button
                          key={`recent-${search}`}
                          type="button"
                          onClick={() => handleSearch(search)}
                          data-analytics-name="search-overlay-recent-search-button"
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                            isAppPage ? 'text-black/90 hover:bg-black/8' : 'hover:bg-muted',
                            selectedIndex === index && (isAppPage ? 'bg-black/10' : 'bg-muted'),
                          )}
                          ref={(el) => {
                            if (el) resultItemRefs.current[index] = el;
                          }}
                        >
                          <Search className={cn('h-4 w-4 shrink-0', isAppPage ? 'text-black/35' : 'text-muted-foreground/70')} />
                          <span className="truncate">{search}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3
                    className={cn(
                      'mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide',
                      isAppPage ? 'text-black/50' : 'text-muted-foreground',
                    )}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Trending
                  </h3>
                  <div className="space-y-0.5">
                    {TRENDING_SEARCHES.filter((t) => !recentSearches.includes(t)).map((search, i) => {
                      const index = recentSearches.length + i;
                      return (
                        <button
                          key={search}
                          type="button"
                          onClick={() => handleSearch(search)}
                          data-analytics-name="search-overlay-trending-search-button"
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                            isAppPage ? 'text-black/90 hover:bg-black/8' : 'hover:bg-muted',
                            selectedIndex === index && (isAppPage ? 'bg-black/10' : 'bg-muted'),
                          )}
                          ref={(el) => {
                            if (el) resultItemRefs.current[index] = el;
                          }}
                        >
                          <TrendingUp className={cn('h-4 w-4 shrink-0', isAppPage ? 'text-black/35' : 'text-muted-foreground/70')} />
                          <span className="truncate">{search}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : isHandleMode && !handleTerm ? (
              <div
                className={cn(
                  'py-6 text-center text-sm',
                  isAppPage ? 'text-black/55' : 'text-muted-foreground',
                )}
              >
                <AtSign className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p>Enter a username after @</p>
              </div>
            ) : (
              <div className="space-y-2">
                {isLoading && suggestions.length === 0 ? (
                  <div className="space-y-2 py-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg p-2">
                        <div className={cn('h-10 w-10 shrink-0 rounded-full', isAppPage ? 'bg-black/10' : 'bg-muted')} />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className={cn('h-3.5 w-2/3 rounded', isAppPage ? 'bg-black/10' : 'bg-muted')} />
                          <div className={cn('h-3 w-1/3 rounded', isAppPage ? 'bg-black/8' : 'bg-muted/70')} />
                        </div>
                      </div>
                    ))}
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
                                            @
                                            {highlightParts(result.title, highlightNeedle).map((seg, i) =>
                                              seg.hit ? (
                                                <mark key={i} className="bg-primary/20 text-primary font-semibold">
                                                  {seg.text}
                                                </mark>
                                              ) : (
                                                <span key={i}>{seg.text}</span>
                                              ),
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
                                          {highlightParts(result.title, highlightNeedle).map((seg, i) =>
                                            seg.hit ? (
                                              <mark key={i} className="bg-primary/20 text-primary font-semibold">
                                                {seg.text}
                                              </mark>
                                            ) : (
                                              <span key={i}>{seg.text}</span>
                                            ),
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
                    <div className="relative mt-2 border-t pt-2">
                      {isLoading && (
                        <Loader2
                          className={cn(
                            'absolute right-2 top-3 h-4 w-4 animate-spin',
                            isAppPage ? 'text-black/40' : 'text-muted-foreground',
                          )}
                        />
                      )}
                      <Button
                        variant="ghost"
                        className={cn(
                          'h-10 w-full justify-between px-2.5 text-sm font-normal',
                          isAppPage && 'text-black/90 hover:bg-black/8 hover:text-black',
                          selectedIndex === suggestions.length && (isAppPage ? 'bg-black/10' : 'bg-muted'),
                        )}
                        data-analytics-name="search-overlay-view-all-results-button"
                        onClick={() => handleSearch(query)}
                        ref={(el) => {
                          if (el) resultItemRefs.current[suggestions.length] = el;
                        }}
                      >
                        <span className="truncate">
                          {isHandleMode ? `See all creators for “${handleTerm}”` : `See all results for “${query}”`}
                        </span>
                        <ArrowRight className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                      </Button>
                    </div>
                  </>
                ) : !isLoading && query.trim().length > 0 ? (
                  <div
                    className={cn(
                      'py-8 text-center text-sm',
                      isAppPage ? 'text-black/60' : 'text-muted-foreground',
                    )}
                  >
                    {isHandleMode ? (
                      <>
                        <User className="mx-auto mb-2 h-8 w-8 opacity-40" />
                        <p className="mb-1">No creators found for “{handleTerm}”</p>
                        <p className="text-xs opacity-80">Check the spelling or try a different username</p>
                      </>
                    ) : (
                      <>
                        <Search className="mx-auto mb-2 h-8 w-8 opacity-40" />
                        <p className="mb-1">No results for “{query}”</p>
                        <p className="mb-3 text-xs opacity-80">
                          Try <button type="button" className="font-medium underline-offset-2 hover:underline" onClick={() => setQuery(`@${getUserSearchTerm(query)}`)}>@username</button> for creators
                        </p>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn('mt-1', isAppPage && 'text-black/80 hover:bg-black/8 hover:text-black')}
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
      </div>
    </>
  );
}
