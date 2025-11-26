'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { getThumbnailUrl } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';

interface SearchResult {
  id: string;
  title: string;
  type: 'video' | 'user';
  thumbnail?: string;
  username?: string;
  views?: number;
}

const TRENDING_SEARCHES = [
  'gaming highlights',
  'cooking tutorials',
  'travel vlogs',
  'music production',
  'fitness workouts',
];

export function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSuggestions([]);
    }
  }, [isOpen]);

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
          // Use vector search for better semantic search results
          const response = await apiClient.vectorSearch(query.trim());
          
          // Convert API response to SearchResult format and limit to 5 suggestions
          const videosArray = response.videos || []
          const videoSuggestions: SearchResult[] = videosArray.slice(0, 5).map((video: any) => ({
            id: video.video_id || video.videoId || '',
            title: video.video_title || video.videoTitle || '',
            type: 'video' as const,
            thumbnail: video.video_thumbnail || video.videoThumbnail || '',
            username: video.user_username || video.userUsername || '',
            views: video.video_views || video.videoViews || 0,
          }));
          
          setSuggestions(videoSuggestions);
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
                type="search"
                placeholder="Search videos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) {
                    handleSearch(query);
                  } else if (e.key === 'Escape') {
                    onClose();
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
          <div className="max-h-[60vh] overflow-y-auto">
            {query.length === 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending Searches
                  </h3>
                  <div className="space-y-1">
                    {TRENDING_SEARCHES.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleSearch(search)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
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
                    {suggestions.map((result) => {
                      const isProfileLink = result.type === 'user';
                      const shouldBeClickable = user || !isProfileLink;
                      
                      const content = (
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            <img 
                              src={result.thumbnail ? getThumbnailUrl(result.thumbnail) : "/placeholder.svg"} 
                              alt={result.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {result.title.split(new RegExp(`(${query})`, 'gi')).map((part, i) => 
                                part.toLowerCase() === query.toLowerCase() ? (
                                  <mark key={i} className="bg-primary/20 text-primary">{part}</mark>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            </p>
                            {result.type === 'video' && (
                              <p className="text-sm text-muted-foreground">
                                {result.username} • {result.views?.toLocaleString()} views
                              </p>
                            )}
                          </div>
                        </div>
                      );

                      if (shouldBeClickable) {
                        return (
                          <Link
                            key={result.id}
                            href={result.type === 'video' ? `/watch/${result.id}` : `/profile/${result.username}`}
                            onClick={onClose}
                          >
                            {content}
                          </Link>
                        );
                      } else {
                        return (
                          <div key={result.id}>
                            {content}
                          </div>
                        );
                      }
                    })}
                    <Button 
                      variant="ghost" 
                      className="w-full mt-2"
                      onClick={() => handleSearch(query)}
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
