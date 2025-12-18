'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Loader2, User, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { getThumbnailUrl } from '@/lib/storage';
import { AuthenticatedImage } from '@/components/video/authenticated-image';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getColorFromName, getAvatarLetter, getProfilePictureUrl, fetchProfilePictureWithAuth } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  type: 'video' | 'user';
  thumbnail?: string;
  username?: string;
  views?: number;
  profilePictureBlobUrl?: string; // Store blob URL for authenticated profile pictures
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
            // Cleanup previous blob URLs
            previousBlobUrlsRef.current.forEach((blobUrl) => {
              if (blobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(blobUrl);
              }
            });
            previousBlobUrlsRef.current.clear();
            
            const userSuggestions: SearchResult[] = await Promise.all(
              usersResponse.users.map(async (user: any) => {
                const profilePicPath = user.profile_picture || user.image || '';
                let profilePictureBlobUrl: string | undefined = undefined;
                
                if (profilePicPath) {
                  const profilePicUrl = getProfilePictureUrl({ profile_picture: profilePicPath, image: profilePicPath }, true);
                  if (profilePicUrl && profilePicUrl.includes('black-paper-83cf.hiffi.workers.dev')) {
                    try {
                      // Fetch with authentication and create blob URL
                      profilePictureBlobUrl = await fetchProfilePictureWithAuth(profilePicUrl);
                      if (profilePictureBlobUrl) {
                        previousBlobUrlsRef.current.add(profilePictureBlobUrl);
                      }
                    } catch (error) {
                      console.error('[SearchOverlay] Failed to fetch profile picture with auth:', error);
                    }
                  }
                }
                
                return {
                  id: user.uid || user.username || '',
                  title: user.username || '',
                  type: 'user' as const,
                  username: user.username || '',
                  thumbnail: profilePicPath,
                  profilePictureBlobUrl,
                };
              })
            );
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
    if (searchQuery.trim()) {
      // Navigate to search page - router.push will trigger the search page to update
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      onClose();
      setQuery('');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search Panel */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-lg">
        <div className="container max-w-3xl mx-auto p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                className="pl-10 pr-10 h-12 text-lg"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>

          {/* Search Results */}
          <div ref={resultsContainerRef} className="max-h-[60vh] overflow-y-auto">
            {query.length === 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending Searches
                  </h3>
                  <div className="space-y-1">
                    {TRENDING_SEARCHES.map((search, index) => (
                      <button
                        key={search}
                        onClick={() => handleSearch(search)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors",
                          selectedIndex === index && "bg-muted"
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
                  <div className="text-center py-8 text-muted-foreground">
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
                                <User className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users</h3>
                              </div>
                              <div className="space-y-1">
                                {users.map((result, index) => {
                                  const itemIndex = suggestions.indexOf(result);
                                  return (
                                  <Link
                                    key={result.id}
                                    href={`/profile/${result.username}`}
                                    onClick={onClose}
                                    className="block"
                                    ref={(el) => {
                                      if (el) resultItemRefs.current[itemIndex] = el;
                                    }}
                                  >
                                    <div className={cn(
                                      "flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group",
                                      selectedIndex === itemIndex && "bg-muted"
                                    )}>
                                      <Avatar className="h-10 w-10 flex-shrink-0">
                                        <AvatarImage 
                                          src={result.profilePictureBlobUrl || (result.thumbnail ? getProfilePictureUrl({ profile_picture: result.thumbnail, image: result.thumbnail }, true) : undefined)} 
                                          alt={result.username}
                                          key={`search-user-${result.id}-${result.profilePictureBlobUrl ? 'blob' : 'direct'}`}
                                        />
                                        <AvatarFallback 
                                          className="text-white font-semibold"
                                          style={{ backgroundColor: getColorFromName(result.username || 'U') }}
                                        >
                                          {getAvatarLetter({ username: result.username }, 'U')}
                                        </AvatarFallback>
                                      </Avatar>
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
                                      <User className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
                                <Video className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Videos</h3>
                              </div>
                              <div className="space-y-1">
                                {videos.map((result) => {
                                  const itemIndex = suggestions.indexOf(result);
                                  return (
                                  <Link
                                    key={result.id}
                                    href={`/watch/${result.id}`}
                                    onClick={onClose}
                                    className="block"
                                    ref={(el) => {
                                      if (el) resultItemRefs.current[itemIndex] = el;
                                    }}
                                  >
                                    <div className={cn(
                                      "flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group",
                                      selectedIndex === itemIndex && "bg-muted"
                                    )}>
                                      <div className="h-12 w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                                        {result.thumbnail ? (
                                          <AuthenticatedImage
                                            src={getThumbnailUrl(result.thumbnail)}
                                          alt={result.title}
                                            fill
                                            className="object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <Video className="h-4 w-4 text-muted-foreground" />
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
                                        <p className="text-sm text-muted-foreground truncate">
                                          @{result.username}
                                        </p>
                                      </div>
                                    </div>
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
                        "w-full mt-4 border-t pt-4",
                        selectedIndex === suggestions.length && "bg-muted"
                      )}
                      onClick={() => handleSearch(query)}
                      ref={(el) => {
                        if (el) resultItemRefs.current[suggestions.length] = el;
                      }}
                    >
                      View all results for "{query}"
                    </Button>
                  </>
                ) : query.trim().length > 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No results found for "{query}"</p>
                    <Button 
                      variant="ghost" 
                      className="mt-2"
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
