'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { VideoGrid } from '@/components/video/video-grid';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { getSeed } from '@/lib/seed-manager';
import { Edit, Share2, MapPin, LinkIcon, Calendar, UserPlus, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { getColorFromName, getAvatarLetter, getProfilePictureUrl } from '@/lib/utils';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';

export default function ProfilePage() {
  const params = useParams();
  const { userData: currentUserData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [hasTriedFetch, setHasTriedFetch] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const VIDEOS_PER_PAGE = 10;
  
  const username = params.username as string;
  const isOwnProfile = currentUserData?.username === username;
  const isRegularUser = profileUser?.role === "user" || profileUser?.role === undefined;

  const fetchUserData = useCallback(async () => {
      if (!username) {
        setIsLoading(false);
        setHasTriedFetch(true);
        return;
      }

      // Wait for auth to be ready before making API call
      if (authLoading) {
        return;
      }

      try {
        setIsLoading(true);
        setHasTriedFetch(true);
        
        // Check if this is the current user's own profile
        const isOwnProfileCheck = currentUserData?.username === username;
        
        // Use /users/self for current user's profile, /users/{username} for others
        let response;
        if (isOwnProfileCheck) {
          console.log("[hiffi] Fetching own profile using /users/self");
          response = await apiClient.getCurrentUser();
        } else {
          console.log("[hiffi] Fetching profile using /users/{username}");
          response = await apiClient.getUserByUsername(username);
        }
        
        console.log("[hiffi] User data from API:", response);
        
        // Handle API response format: { success: true, user: {...} }
        const profileData = (response?.success && response?.user) ? response.user : (response?.user || response);
        console.log("[hiffi] Profile data:", profileData);
        console.log("[hiffi] Followers:", profileData?.followers);
        console.log("[hiffi] Following:", profileData?.following);
        setProfileUser(profileData);
        
        // Check if current user is following this profile user
        // Only check if viewing someone else's profile (not own profile)
        if (currentUserData?.username && currentUserData.username !== username) {
          try {
            // checkFollowingStatus now only takes targetUsername (uses current user's following list)
            const isFollowingStatus = await apiClient.checkFollowingStatus(username);
            setIsFollowing(isFollowingStatus);
          } catch (followError) {
            console.error("[hiffi] Failed to check following status:", followError);
            setIsFollowing(profileData?.isfollowing || false);
          }
        } else {
          setIsFollowing(false); // Can't follow yourself
        }
        
        // Reset video state
        setUserVideos([]);
        setOffset(0);
        setHasMore(true);
        
        // Fetch initial page of user's videos
        await fetchUserVideos(0, true, isOwnProfileCheck);
      } catch (error: any) {
        console.error("[hiffi] Failed to fetch user data:", error);
        // Only set to null if it's a real error (not just auth not ready)
        if (error?.status !== 401 || authLoading) {
          setProfileUser(null);
          toast({
            title: "Error",
            description: error?.status === 404 ? "User not found" : "Failed to load user profile",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
  }, [username, toast, authLoading, currentUserData?.username]);

  // Fetch user videos with infinite scroll support
  const fetchUserVideos = useCallback(async (currentOffset: number, isInitialLoad: boolean, isOwnProfile: boolean) => {
    if (isFetching) {
      console.log("[hiffi] Already fetching videos, skipping duplicate request");
      return;
    }

    try {
      setIsFetching(true);
      
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }

      const seed = getSeed();
      let videosArray: any[] = [];

      if (isOwnProfile) {
        try {
          // For own profile, try listSelfVideos first (if it supports pagination)
          // Otherwise fall back to getVideoList
          const selfVideosResponse = await apiClient.listSelfVideos({ page: currentOffset + 1, limit: VIDEOS_PER_PAGE });
          videosArray = selfVideosResponse.videos || [];
          // If listSelfVideos doesn't support pagination well, we might get all videos
          // In that case, we need to handle it differently
          if (currentOffset > 0 && videosArray.length === 0) {
            setHasMore(false);
            return;
          }
        } catch (error) {
          console.error("[hiffi] Failed to fetch own videos, falling back to getVideoList:", error);
          // Fall back to filtering from all videos
          const videosResponse = await apiClient.getVideoList({ offset: currentOffset, limit: VIDEOS_PER_PAGE, seed });
          videosArray = videosResponse.videos || [];
        }
      } else {
        // For other users, fetch pages and filter client-side
        const videosResponse = await apiClient.getVideoList({ offset: currentOffset, limit: VIDEOS_PER_PAGE, seed });
        videosArray = videosResponse.videos || [];
      }

      // Filter videos by this user (if not using listSelfVideos or if filtering is needed)
      const filteredVideos = videosArray.filter(
        (v: any) => (v.user_username || v.userUsername) === username
      );

      if (currentOffset === 0) {
        // Initial load - replace videos
        setUserVideos(filteredVideos);
      } else {
        // Append new videos to existing ones
        setUserVideos((prev) => {
          // Prevent duplicates by checking video IDs
          const existingIds = new Set(prev.map(v => v.videoId || v.video_id));
          const newVideos = filteredVideos.filter(v => !existingIds.has(v.videoId || v.video_id));
          return [...prev, ...newVideos];
        });
      }

      // If we got fewer videos than requested, there might be no more pages
      // But for filtered results, we need to check if we got any videos at all
      if (videosArray.length < VIDEOS_PER_PAGE) {
        setHasMore(false);
      } else if (filteredVideos.length === 0 && videosArray.length > 0) {
        // Got videos but none match this user - might be more pages with this user's videos
        // Continue loading
        setHasMore(true);
      } else {
        setHasMore(filteredVideos.length > 0);
      }
    } catch (error) {
      console.error("[hiffi] Failed to fetch user videos:", error);
      if (currentOffset === 0) {
        setUserVideos([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      setIsFetching(false);
    }
  }, [username, isFetching]);

  const loadMoreVideos = useCallback(() => {
    if (!isLoading && !loadingMore && !isFetching && hasMore) {
      // Offset should be the number of items to skip, not page number
      // Calculate next offset based on current number of videos loaded
      const nextOffset = userVideos.length;
      console.log(`[hiffi] Loading more videos for user ${username} - Current videos: ${userVideos.length}, Next offset: ${nextOffset}`);
      setOffset(nextOffset);
      fetchUserVideos(nextOffset, false, isOwnProfile);
    }
  }, [isLoading, loadingMore, isFetching, hasMore, userVideos.length, username, isOwnProfile, fetchUserVideos]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleFollow = async () => {
    if (!currentUserData) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow users",
      });
      return;
    }

    try {
      if (isFollowing) {
        await apiClient.unfollowUser(username);
        setIsFollowing(false);
        
        // Refresh recipient user's profile data to get updated follower count
        try {
          // Use /users/self for current user's profile, /users/{username} for others
          const isOwnProfileCheck = currentUserData?.username === username;
          const refreshedResponse = isOwnProfileCheck 
            ? await apiClient.getCurrentUser()
            : await apiClient.getUserByUsername(username);
          console.log("[hiffi] Refreshed user data after unfollow:", refreshedResponse);
          // Handle API response format: { success: true, user: {...} }
          const profileData = (refreshedResponse?.success && refreshedResponse?.user) ? refreshedResponse.user : (refreshedResponse?.user || refreshedResponse);
          setProfileUser(profileData);
        } catch (refreshError) {
          console.error("[hiffi] Failed to refresh user data:", refreshError);
          // Update optimistically if refresh fails
          if (profileUser) {
            setProfileUser({ 
              ...profileUser, 
              followers: Math.max((profileUser.followers || profileUser.user?.followers || 0) - 1, 0), 
              isfollowing: false 
            });
          }
        }
        
        toast({
          title: "Success",
          description: "Unfollowed user",
        });
      } else {
        await apiClient.followUser(username);
        setIsFollowing(true);
        
        // Refresh recipient user's profile data to get updated follower count
        try {
          // Use /users/self for current user's profile, /users/{username} for others
          const isOwnProfileCheck = currentUserData?.username === username;
          const refreshedResponse = isOwnProfileCheck 
            ? await apiClient.getCurrentUser()
            : await apiClient.getUserByUsername(username);
          console.log("[hiffi] Refreshed user data after follow:", refreshedResponse);
          // Handle API response format: { success: true, user: {...} }
          const profileData = (refreshedResponse?.success && refreshedResponse?.user) ? refreshedResponse.user : (refreshedResponse?.user || refreshedResponse);
          setProfileUser(profileData);
        } catch (refreshError) {
          console.error("[hiffi] Failed to refresh user data:", refreshError);
          // Update optimistically if refresh fails
          if (profileUser) {
            setProfileUser({ 
              ...profileUser, 
              followers: (profileUser.followers || profileUser.user?.followers || 0) + 1, 
              isfollowing: true 
            });
          }
        }
        
        toast({
          title: "Success",
          description: "Following user",
        });
      }
      
      // Verify the follow status after action
      try {
        // checkFollowingStatus now only takes targetUsername (uses current user's following list)
        const verifiedStatus = await apiClient.checkFollowingStatus(username);
        setIsFollowing(verifiedStatus);
      } catch (verifyError) {
        console.error("[hiffi] Failed to verify following status:", verifyError);
      }
    } catch (error) {
      console.error("[hiffi] Failed to follow/unfollow user:", error);
      toast({
        title: "Error",
        description: `Failed to ${isFollowing ? "unfollow" : "follow"} user`,
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto flex items-center justify-center w-full min-w-0">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading profile...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!isLoading && hasTriedFetch && !profileUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto flex items-center justify-center w-full min-w-0">
            <div className="text-center">
              <p>User not found</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    // Still loading or initial state - don't show anything yet
    return null;
  }

  // Show personal profile view for regular users viewing their own profile
  if (isRegularUser && isOwnProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto bg-background w-full min-w-0">
            {/* Cover Image / Banner */}
            <div className="h-48 md:h-64 w-full relative overflow-hidden">
              {profileUser.coverUrl ? (
                <img 
                  src={profileUser.coverUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src="/abstract-orange-pattern.png" 
                  alt="Profile header" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto pb-8">
                {/* Profile Header */}
                <div className="relative -mt-20 mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
                      <AvatarImage 
                        src={getProfilePictureUrl(profileUser)} 
                      />
                      <AvatarFallback 
                        className="text-3xl sm:text-4xl font-bold text-white"
                        style={{
                          backgroundColor: getColorFromName((profileUser.name && profileUser.name.trim()) || profileUser.username || username || "User"),
                        }}
                      >
                        {getAvatarLetter(profileUser, username || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="absolute bottom-0 right-0 rounded-full shadow-md h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                
                  <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-2">
                    {profileUser.name && profileUser.name.trim() ? (
                      <>
                        <h1 className="text-2xl sm:text-3xl font-bold truncate">
                          {profileUser.name.trim()}
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base">@{profileUser.username || username}</p>
                      </>
                    ) : (
                      <>
                        <h1 className="text-2xl sm:text-3xl font-bold truncate">
                          {profileUser.username || username}
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base">@{profileUser.username || username}</p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 sm:gap-3 w-full sm:w-auto mt-4 sm:mt-0 sm:pb-4">
                    <Button 
                      className="flex-1 sm:flex-none" 
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="icon" className="flex-shrink-0">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Personal Details Section */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Personal Information</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditDialogOpen(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                          <p className="text-base font-medium">
                            {profileUser.name && profileUser.name.trim() ? profileUser.name.trim() : "Not set"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                          <p className="text-base font-medium">@{profileUser.username || username}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                          <p className="text-base font-medium">
                            {profileUser.email || "Not set"}
                          </p>
                        </div>
                        {profileUser.createdat && (
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                            <p className="text-base font-medium">
                              {format(new Date(profileUser.createdat), 'MMMM d, yyyy')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>About</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditDialogOpen(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-muted-foreground">Bio</Label>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {profileUser.bio && profileUser.bio.trim() ? profileUser.bio.trim() : "No bio available. Click Edit to add one."}
                        </p>
                      </div>
                      
                      <div className="space-y-3 pt-4 border-t">
                        {profileUser.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="text-sm">{profileUser.location}</span>
                          </div>
                        )}
                        {profileUser.website && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <a 
                              href={`https://${profileUser.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary hover:underline text-sm"
                            >
                              {profileUser.website}
                            </a>
                          </div>
                        )}
                        {!profileUser.location && !profileUser.website && (
                          <p className="text-sm text-muted-foreground">
                            Add your location and website in the Edit Profile dialog.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {userVideos.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Your Videos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <VideoGrid 
                          videos={userVideos} 
                          loading={isLoading || loadingMore}
                          hasMore={hasMore}
                          onLoadMore={loadMoreVideos}
                          onVideoDeleted={(videoId) => {
                            // Remove deleted video from the list
                            setUserVideos((prev) => 
                              prev.filter((v) => (v.videoId || v.video_id) !== videoId)
                            )
                          }}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Edit Profile Dialog */}
        {isOwnProfile && profileUser && (
          <EditProfileDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            currentName={profileUser.name || profileUser.username || ""}
            currentUsername={profileUser.username || username}
            currentBio={profileUser.bio || ""}
            currentLocation={profileUser.location || ""}
            currentWebsite={profileUser.website || ""}
            onProfileUpdated={fetchUserData}
          />
        )}
      </div>
    );
  }

  // Show standard profile view for creators/admins or when viewing other users
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-background w-full min-w-0">
          {/* Cover Image / Banner */}
          <div className="h-48 md:h-64 w-full relative overflow-hidden">
            {profileUser.coverUrl ? (
              <img 
                src={profileUser.coverUrl} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <img 
                src="/abstract-orange-pattern.png" 
                alt="Profile header" 
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto pb-8">
              {/* Profile Header */}
              <div className="relative -mt-20 mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
                    <AvatarImage 
                      src={getProfilePictureUrl(profileUser)} 
                    />
                    <AvatarFallback 
                      className="text-3xl sm:text-4xl font-bold text-white"
                      style={{
                        backgroundColor: getColorFromName((profileUser.name && profileUser.name.trim()) || profileUser.username || username || "User"),
                      }}
                    >
                      {getAvatarLetter(profileUser, username || "U")}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="absolute bottom-0 right-0 rounded-full shadow-md h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  )}
                </div>
              
                <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-2">
                  {profileUser.name && profileUser.name.trim() ? (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold truncate">
                        {profileUser.name.trim()}
                      </h1>
                      <p className="text-muted-foreground text-sm sm:text-base">@{profileUser.username || username}</p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold truncate">
                        {profileUser.username || username}
                      </h1>
                      <p className="text-muted-foreground text-sm sm:text-base">@{profileUser.username || username}</p>
                    </>
                  )}
                </div>

                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto mt-4 sm:mt-0 sm:pb-4">
                  {isOwnProfile ? (
                    <Button 
                      className="flex-1 sm:flex-none" 
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1 sm:flex-none" 
                      size="sm"
                      variant={isFollowing ? "secondary" : "default"}
                      onClick={handleFollow}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                {/* Left Sidebar Info */}
                <div className="space-y-6 order-2 lg:order-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">About</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm leading-relaxed">{profileUser.bio || "No bio available"}</p>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {profileUser.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{profileUser.location}</span>
                          </div>
                        )}
                        {profileUser.website && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 flex-shrink-0" />
                            <a href={`https://${profileUser.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                              {profileUser.website}
                            </a>
                          </div>
                        )}
                        {profileUser.createdat && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>Joined {format(new Date(profileUser.createdat), 'MMMM yyyy')}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-3 text-sm">Stats</h3>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <div className="text-xl font-bold">{(profileUser?.total_videos || profileUser?.totalVideos || profileUser?.totalvideos || userVideos.length || 0).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Videos</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <div className="text-xl font-bold">{(profileUser?.followers ?? 0).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Followers</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <div className="text-xl font-bold">{(profileUser?.following ?? 0).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Following</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 order-1 lg:order-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Videos</h2>
                    {userVideos.length > 0 ? (
                      <VideoGrid 
                        videos={userVideos} 
                        loading={isLoading || loadingMore}
                        hasMore={hasMore}
                        onLoadMore={loadMoreVideos}
                        onVideoDeleted={(videoId) => {
                          // Remove deleted video from the list
                          setUserVideos((prev) => 
                            prev.filter((v) => (v.videoId || v.video_id) !== videoId)
                          )
                        }}
                      />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span>Loading videos...</span>
                          </div>
                        ) : (
                        <p>No videos yet</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Profile Dialog */}
      {isOwnProfile && profileUser && (
        <EditProfileDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          currentName={profileUser.name || profileUser.username || ""}
          currentUsername={profileUser.username || username}
          currentBio={profileUser.bio || ""}
          currentLocation={profileUser.location || ""}
          currentWebsite={profileUser.website || ""}
          onProfileUpdated={fetchUserData}
        />
      )}
    </div>
  );
}
