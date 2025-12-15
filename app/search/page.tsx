'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { VideoGrid } from '@/components/video/video-grid';
import { Search, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [allVideos, setAllVideos] = useState<any[]>([]); // Cache all results
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  const fetchSearchResults = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setAllVideos([]);
      return;
    }

    try {
      setLoading(true);
      const searchLower = searchQuery.trim().toLowerCase();
      
      // Fetch multiple pages to get enough results for searching
      // Since vector search was removed, we do client-side filtering
      const allFetchedVideos: any[] = [];
      let currentPage = 1;
      const maxPages = 5; // Fetch up to 5 pages (100 videos) for search
      
      while (currentPage <= maxPages) {
        const response = await apiClient.getVideoList({
          page: currentPage,
          limit: 20,
        });
        
        if (!response.success || !response.videos || response.videos.length === 0) {
          break;
        }
        
        allFetchedVideos.push(...response.videos);
        
        // If we got fewer videos than requested, we've reached the end
        if (response.videos.length < 20) {
          break;
        }
        
        currentPage++;
      }
      
      // Filter videos by title, description, tags, or username
      const filteredVideos = allFetchedVideos.filter((video: any) => {
        const title = (video.video_title || '').toLowerCase();
        const description = (video.video_description || '').toLowerCase();
        const tags = (video.video_tags || []).join(' ').toLowerCase();
        const username = (video.user_username || '').toLowerCase();
        
        return (
          title.includes(searchLower) ||
          description.includes(searchLower) ||
          tags.includes(searchLower) ||
          username.includes(searchLower)
        );
      });
      
      setAllVideos(filteredVideos);
      
      // Show first page of results
      const limit = 20;
      const firstPageVideos = filteredVideos.slice(0, limit);
      setResults(firstPageVideos);
      setPage(1);
      setHasMore(filteredVideos.length > limit);
    } catch (error: any) {
      console.error('[hiffi] Failed to fetch search results:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load search results. Please try again.",
        variant: "destructive",
      });
      setResults([]);
      setAllVideos([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      fetchSearchResults(query);
    } else {
      setResults([]);
      setAllVideos([]);
      setPage(1);
      setHasMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const loadMore = () => {
    if (!loading && hasMore && allVideos.length > 0) {
      const limit = 20;
      const nextPage = page + 1;
      const startIndex = (nextPage - 1) * limit;
      const endIndex = startIndex + limit;
      const nextPageVideos = allVideos.slice(startIndex, endIndex);
      
      setResults(prev => [...prev, ...nextPageVideos]);
      setPage(nextPage);
      setHasMore(endIndex < allVideos.length);
    }
  };

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
                    Showing results for <span className="font-semibold text-foreground">"{query}"</span>
                  </p>
                )}
              </div>

              {query ? (
                <>
                  {loading && results.length === 0 ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Searching for "{query}"...</p>
                    </div>
                  ) : results.length > 0 ? (
                    <>
                      <div className="mb-4 text-sm text-muted-foreground">
                        Showing {results.length} of {allVideos.length} {allVideos.length === 1 ? 'result' : 'results'}
                      </div>
                      <VideoGrid
                        videos={results}
                        loading={loading && results.length > 0}
                        hasMore={hasMore}
                        onLoadMore={loadMore}
                      />
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No videos found</h3>
                      <p className="text-muted-foreground">Try different keywords or check your spelling</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start searching</h3>
                  <p className="text-muted-foreground">Enter a search term to find videos</p>
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
