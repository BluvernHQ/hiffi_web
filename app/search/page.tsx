'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { VideoGrid } from '@/components/video/video-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  const fetchSearchResults = async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.getVideoList({
        page: pageNum,
        limit: 20,
        search: searchQuery.trim()
      });

      if (pageNum === 1) {
        setResults(response.videos || []);
      } else {
        setResults(prev => [...prev, ...(response.videos || [])]);
      }

      setHasMore(response.videos && response.videos.length === 20);
    } catch (error) {
      console.error('[v0] Failed to fetch search results:', error);
      toast({
        title: "Error",
        description: "Failed to load search results",
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      setPage(1);
      setHasMore(true);
      fetchSearchResults(query, 1);
    } else {
      setResults([]);
      setPage(1);
      setHasMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const loadMore = () => {
    if (!loading && hasMore && query) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSearchResults(query, nextPage);
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
                <Tabs defaultValue="videos" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="videos">Videos</TabsTrigger>
                    <TabsTrigger value="creators">Creators</TabsTrigger>
                  </TabsList>

                  <TabsContent value="videos" className="mt-6">
                    {loading && results.length === 0 ? (
                      <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Searching for "{query}"...</p>
                      </div>
                    ) : results.length > 0 ? (
                      <>
                        <VideoGrid
                          videos={results}
                          loading={loading && results.length > 0}
                          hasMore={hasMore}
                          onLoadMore={loadMore}
                        />
                      </>
                    ) : query ? (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No videos found</h3>
                        <p className="text-muted-foreground">Try different keywords or check your spelling</p>
                      </div>
                    ) : null}
                  </TabsContent>

                  <TabsContent value="creators" className="mt-6">
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No creators found</h3>
                      <p className="text-muted-foreground">Try different keywords</p>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start searching</h3>
                  <p className="text-muted-foreground">Enter a search term to find videos and creators</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
