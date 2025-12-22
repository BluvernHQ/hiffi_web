'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Edit, Share2, Calendar, UserPlus, UserCheck, Copy, Check, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { getColorFromName, getAvatarLetter, getProfilePictureUrl, fetchProfilePictureWithAuth } from '@/lib/utils';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';
import { ProfilePictureDialog } from '@/components/profile/profile-picture-dialog';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { userData: currentUserData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingAction, setIsFollowingAction] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [hasTriedFetch, setHasTriedFetch] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProfilePictureDialogOpen, setIsProfilePictureDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profilePictureVersion, setProfilePictureVersion] = useState(0);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);
  const [profilePictureBlobUrl, setProfilePictureBlobUrl] = useState<string | null>(null);
  
  const VIDEOS_PER_PAGE = 10;
  
  const username = params.username as string;
  const isOwnProfile = currentUserData?.username === username;
  const isRegularUser = profileUser?.role === "user" || profileUser?.role === undefined;
  
  // Debug: Log current user data to check if it's interfering
  console.log("[hiffi] Current user data (auth context):", {
    username: currentUserData?.username,
    profile_picture: currentUserData?.profile_picture,
    image: currentUserData?.image
  });

  const fetchUserData = useCallback(async (forceRefresh: boolean = false) => {
      if (!username) {
        setIsLoading(false);
        setHasTriedFetch(true);
        return;
      }

      // Wait for auth to be ready before making API call
      if (authLoading) {
        return;
      }
      
      // Check if user is authenticated - if not, we'll show login prompt
      const isAuthenticated = !!apiClient.getAuthToken();
      
      // If force refresh, clear any cached data to ensure fresh fetch
      if (forceRefresh && typeof window !== "undefined") {
        // Clear auth context cache for current user if viewing own profile
        if (currentUserData?.username === username) {
          localStorage.removeItem("hiffi_user_data");
          localStorage.removeItem("hiffi_user_data_timestamp");
        }
      }

      try {
        setIsLoading(true);
        setHasTriedFetch(true);
        
        // Check if this is the current user's own profile
        const isOwnProfileCheck = currentUserData?.username === username;
        
        // Use /users/self for current user's profile, /users/{username} for others
        // Add cache busting parameter if force refresh is requested
        let response;
        if (isOwnProfileCheck) {
          console.log("[hiffi] Fetching own profile using /users/self", forceRefresh ? "(force refresh)" : "");
          response = await apiClient.getCurrentUser();
        } else {
          console.log("[hiffi] Fetching profile using /users/{username}", forceRefresh ? "(force refresh)" : "");
          response = await apiClient.getUserByUsername(username);
        }
        
        console.log("[hiffi] User data from API (raw response):", JSON.stringify(response, null, 2));
        
        // Handle API response format: { success: true, user: {...}, following?: boolean }
        // or: { success: true, data: { user: {...} } }
        const responseAny = response as any;
        const profileData = (response?.success && response?.user) 
          ? response.user 
          : (responseAny?.data?.user || response?.user || (responseAny?.data && typeof responseAny.data === 'object' && !responseAny.data.user ? responseAny.data : null) || response);
        
        console.log("[hiffi] Extracted profile data:", JSON.stringify(profileData, null, 2));
        console.log("[hiffi] Profile picture field:", profileData?.profile_picture);
        console.log("[hiffi] Image field:", profileData?.image);
        console.log("[hiffi] Profile picture type:", typeof profileData?.profile_picture);
        console.log("[hiffi] Profile picture is URL:", profileData?.profile_picture?.startsWith?.("http"));
        console.log("[hiffi] Profile picture value:", profileData?.profile_picture);
        console.log("[hiffi] Updated at:", profileData?.updated_at);
        console.log("[hiffi] All profile data keys:", Object.keys(profileData || {}));
        
        // Check for any other image-related fields
        const imageFields = Object.keys(profileData || {}).filter(key => 
          key.toLowerCase().includes('image') || 
          key.toLowerCase().includes('avatar') || 
          key.toLowerCase().includes('picture') ||
          key.toLowerCase().includes('photo')
        );
        console.log("[hiffi] All image-related fields:", imageFields);
        imageFields.forEach(field => {
          console.log(`[hiffi] ${field}:`, profileData?.[field]);
        });
        
        console.log("[hiffi] Followers:", profileData?.followers);
        console.log("[hiffi] Following:", profileData?.following);
        
        // Update profile user state
        // Check if profile_picture changed before updating state
        // Also check 'image' field as it might be used in API responses
        const previousProfilePicture = profileUser?.profile_picture || profileUser?.image;
        const newProfilePicture = profileData?.profile_picture || profileData?.image;
        
        // Normalize: if API returns 'image', also set it as 'profile_picture' for consistency
        if (profileData?.image && !profileData?.profile_picture) {
          console.log("[hiffi] Normalizing: setting profile_picture from image field");
          profileData.profile_picture = profileData.image;
        }
        
        // Log final profile picture value before setting state
        console.log("[hiffi] Final profile_picture value before setting state:", profileData?.profile_picture);
        
        setProfileUser(profileData);
        
        // Always fetch fresh profile picture - don't cache blob URLs
        // Store previous blob URL for cleanup
        const previousBlobUrl = profilePictureBlobUrl;
        
        // Fetch profile picture with authentication if it's a Workers URL
        const profilePicUrl = getProfilePictureUrl(profileData, true);
        if (profilePicUrl && profilePicUrl.includes('black-paper-83cf.hiffi.workers.dev')) {
          // Fetch with auth and create blob URL - always fetch fresh (no caching)
          fetchProfilePictureWithAuth(profilePicUrl)
            .then(blobUrl => {
              // Clean up previous blob URL before setting new one
              if (previousBlobUrl && previousBlobUrl !== blobUrl) {
                URL.revokeObjectURL(previousBlobUrl);
              }
              setProfilePictureBlobUrl(blobUrl);
              console.log("[hiffi] Profile picture blob URL created (fresh fetch from API):", blobUrl);
            })
            .catch(error => {
              console.error("[hiffi] Failed to fetch profile picture with auth:", error);
              // Clean up previous blob URL on error
              if (previousBlobUrl) {
                URL.revokeObjectURL(previousBlobUrl);
              }
              setProfilePictureBlobUrl(null); // Fallback to direct URL
            });
        } else {
          // Not a Workers URL or no profile picture, clean up blob URL
          if (previousBlobUrl) {
            URL.revokeObjectURL(previousBlobUrl);
          }
          setProfilePictureBlobUrl(null);
        }
        
        // Increment profile picture version if profile_picture path changed OR if force refresh
        // This forces AvatarImage to re-render with new cache buster
        if (forceRefresh || (newProfilePicture && newProfilePicture !== previousProfilePicture)) {
          console.log("[hiffi] Profile picture changed or force refresh, incrementing version", {
            previous: previousProfilePicture,
            new: newProfilePicture,
            forceRefresh
          });
          setProfilePictureVersion(prev => prev + 1);
        }
        
        // Set following status from API response
        // The API now returns following status directly in the response
        // Only applicable if viewing someone else's profile (not own profile)
        if (currentUserData?.username && currentUserData.username !== username) {
          // Use the following field from the API response (NEW)
          const followingStatus = response?.following ?? false;
          console.log("[hiffi] Following status from API:", followingStatus);
          setIsFollowing(followingStatus);
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
        // Check if it's an authentication error (401)
        // ApiError has status property: { message: string, status: number }
        const errorStatus = error?.status;
        const authToken = apiClient.getAuthToken();
        const isAuthError = errorStatus === 401 && !authToken;
        
        console.log("[hiffi] Error handling:", {
          errorStatus,
          hasAuthToken: !!authToken,
          isAuthError,
          authLoading,
          errorMessage: error?.message,
        });
        
        if (isAuthError) {
          // User is not authenticated and got 401 - show login prompt
          setIsUnauthenticated(true);
          setProfileUser(null);
        } else {
          setIsUnauthenticated(false);
          // Only show error toast if it's not an auth error or if auth is still loading
          if (errorStatus !== 401 || authLoading) {
            setProfileUser(null);
            toast({
              title: "Error",
              description: errorStatus === 404 ? "User not found" : "Failed to load user profile",
              variant: "destructive",
            });
          }
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

      // Use the new endpoint: GET /videos/list/{username}
      const videosResponse = await apiClient.getUserVideos(username, { 
        offset: currentOffset, 
        limit: VIDEOS_PER_PAGE 
      });

      const videosArray = videosResponse.videos || [];

      // Enhance videos with profile user's profile picture if available
      // This ensures the profile picture is shown in video cards on the profile page
      // Since the API doesn't return profile_picture in video list responses, we add it from profileUser
      const enhancedVideos = videosArray.map((video: any) => {
        // Always add profile picture from profileUser if available (API doesn't include it)
        // Use profileUser first, then fallback to currentUserData if viewing own profile
        const sourceUser = profileUser || (isOwnProfile ? currentUserData : null);
        
        if (sourceUser?.profile_picture) {
          // Always set user_profile_picture from the profile user data
          // This ensures profile pictures show even when API doesn't return them
          video.user_profile_picture = sourceUser.profile_picture;
          video.user_updated_at = sourceUser.updated_at;
        } else if (sourceUser?.image) {
          // Fallback to image field if profile_picture is not available
          video.user_profile_picture = sourceUser.image;
          video.user_updated_at = sourceUser.updated_at;
          }
        
        return video;
      });

      if (currentOffset === 0) {
        // Initial load - replace videos
        setUserVideos(enhancedVideos);
      } else {
        // Append new videos to existing ones
        setUserVideos((prev) => {
          // Prevent duplicates by checking video IDs
          const existingIds = new Set(prev.map(v => (v as any).videoId || v.video_id));
          const newVideos = enhancedVideos.filter(v => !existingIds.has((v as any).videoId || v.video_id));
          return [...prev, ...newVideos];
        });
      }

      // Check if there are more videos to load
      // If we got fewer videos than requested, or if offset + videos.length >= count, there are no more
      if (videosArray.length < VIDEOS_PER_PAGE || (currentOffset + videosArray.length >= videosResponse.count)) {
        setHasMore(false);
      } else {
        setHasMore(true);
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
  }, [username, isFetching, profileUser, currentUserData, isOwnProfile]);

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
    fetchUserData(false);
  }, [fetchUserData]);

  // Update videos with profile user's profile picture when profileUser is loaded
  // This ensures videos loaded before profileUser is available get the profile picture
  // Always update to ensure profile picture is set even if API doesn't return it
  useEffect(() => {
    const sourceUser = profileUser || (isOwnProfile ? currentUserData : null);
    const profilePicture = sourceUser?.profile_picture || sourceUser?.image;
    
    if (profilePicture && userVideos.length > 0) {
      setUserVideos((prevVideos) => 
        prevVideos.map((video: any) => {
          // Always update profile picture from profile user data
          // This ensures profile pictures show even when API doesn't return them
            return {
              ...video,
            user_profile_picture: profilePicture,
            user_updated_at: sourceUser?.updated_at,
            };
        })
      );
    }
  }, [profileUser?.profile_picture, profileUser?.image, profileUser?.updated_at, currentUserData?.profile_picture, currentUserData?.image, currentUserData?.updated_at, isOwnProfile, userVideos.length]);
  
  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (profilePictureBlobUrl) {
        URL.revokeObjectURL(profilePictureBlobUrl);
      }
    };
  }, [profilePictureBlobUrl]);

  const handleCopy = async () => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    const profileUrl = `${window.location.origin}/profile/${username}`

    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard",
      })
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error("[hiffi] Clipboard error:", error)
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    const profileUrl = `${window.location.origin}/profile/${username}`
    const shareData = {
      title: `${profileUser?.name || profileUser?.username || username}'s Profile`,
      text: `Check out ${profileUser?.name || profileUser?.username || username}'s profile on Hiffi`,
      url: profileUrl,
    }

    try {
      // Check if Web Share API is available (mobile devices and modern browsers)
      if (navigator.share) {
        try {
          // Check if we can share this data
          if (navigator.canShare && !navigator.canShare(shareData)) {
            // If canShare exists but returns false, the data format is not shareable
            // Fall through to copy fallback
            throw new Error('Cannot share this data format')
          }
          
          // Attempt to share using Web Share API
          await navigator.share(shareData)
          toast({
            title: "Shared!",
            description: "Profile shared successfully",
          })
          return // Successfully shared, exit early
        } catch (shareError: any) {
          // If user cancelled the share dialog, don't show error or fallback
          if (shareError.name === 'AbortError') {
            return // User cancelled, exit silently
          }
          // For other share errors, fall through to copy fallback below
          console.log("[hiffi] Web Share API failed, falling back to copy:", shareError)
        }
      }
      
      // Fallback: Copy to clipboard if Web Share API is not available or failed
      // This happens on desktop browsers without share support
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard. Use the copy button to copy again.",
      })
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error: any) {
      console.error("[hiffi] Share error:", error)
      toast({
        title: "Error",
        description: "Failed to share profile. Please try copying the link instead.",
        variant: "destructive",
      })
    }
  }

  const handleFollow = async () => {
    if (!currentUserData) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow users",
      });
      return;
    }

    // Prevent double-clicks
    if (isFollowingAction) return;

    // Store previous state for rollback
    const previousFollowingState = isFollowing;
    const previousFollowersCount = profileUser?.followers || profileUser?.user?.followers || 0;

    try {
      setIsFollowingAction(true);
      
      // Optimistic update
      const newFollowingState = !isFollowing;
      setIsFollowing(newFollowingState);

      if (previousFollowingState) {
        // Unfollowing
        const response = await apiClient.unfollowUser(username);
        
        if (!response.success) {
          throw new Error("Failed to unfollow user");
        }
        
        // Refresh recipient user's profile data to get updated follower count
        try {
          // Use /users/self for current user's profile, /users/{username} for others
          const isOwnProfileCheck = currentUserData?.username === username;
          const refreshedResponse = isOwnProfileCheck 
            ? await apiClient.getCurrentUser()
            : await apiClient.getUserByUsername(username);
          console.log("[hiffi] Refreshed user data after unfollow:", refreshedResponse);
          // Handle API response format: { success: true, user: {...}, following?: boolean }
          const profileData = (refreshedResponse?.success && refreshedResponse?.user) ? refreshedResponse.user : (refreshedResponse?.user || refreshedResponse);
          setProfileUser(profileData);
          // Update following status from API response
          if (!isOwnProfileCheck && refreshedResponse?.following !== undefined) {
            setIsFollowing(refreshedResponse.following);
          }
        } catch (refreshError) {
          console.error("[hiffi] Failed to refresh user data:", refreshError);
          // Update optimistically if refresh fails
          if (profileUser) {
            setProfileUser({ 
              ...profileUser, 
              followers: Math.max(previousFollowersCount - 1, 0), 
              isfollowing: false 
            });
          }
        }
        
        toast({
          title: "Success",
          description: "Unfollowed user",
        });
      } else {
        // Following
        const response = await apiClient.followUser(username);
        
        if (!response.success) {
          throw new Error("Failed to follow user");
        }
        
        // Refresh recipient user's profile data to get updated follower count
        try {
          // Use /users/self for current user's profile, /users/{username} for others
          const isOwnProfileCheck = currentUserData?.username === username;
          const refreshedResponse = isOwnProfileCheck 
            ? await apiClient.getCurrentUser()
            : await apiClient.getUserByUsername(username);
          console.log("[hiffi] Refreshed user data after follow:", refreshedResponse);
          // Handle API response format: { success: true, user: {...}, following?: boolean }
          const profileData = (refreshedResponse?.success && refreshedResponse?.user) ? refreshedResponse.user : (refreshedResponse?.user || refreshedResponse);
          setProfileUser(profileData);
          // Update following status from API response
          if (!isOwnProfileCheck && refreshedResponse?.following !== undefined) {
            setIsFollowing(refreshedResponse.following);
          }
        } catch (refreshError) {
          console.error("[hiffi] Failed to refresh user data:", refreshError);
          // Update optimistically if refresh fails
          if (profileUser) {
            setProfileUser({ 
              ...profileUser, 
              followers: previousFollowersCount + 1, 
              isfollowing: true 
            });
          }
        }
        
        toast({
          title: "Success",
          description: "Following user",
        });
      }
      
      // State is already optimistically updated above
      // No need to verify since the follow/unfollow API calls are reliable
      // The state will be synced on next page load via getUserByUsername/getCurrentUser API
    } catch (error) {
      console.error("[hiffi] Failed to follow/unfollow user:", error);
      
      // Revert optimistic update on error
      setIsFollowing(previousFollowingState);
      if (profileUser) {
        setProfileUser({ 
          ...profileUser, 
          followers: previousFollowersCount,
          isfollowing: previousFollowingState
        });
      }
      
      toast({
        title: "Error",
        description: `Failed to ${previousFollowingState ? "unfollow" : "follow"} user`,
        variant: "destructive",
      });
    } finally {
      setIsFollowingAction(false);
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
            <div className="text-center space-y-4 px-4 max-w-md">
              {isUnauthenticated ? (
                <>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Please Sign In</h2>
                    <p className="text-muted-foreground">
                      You need to be signed in to view user profiles.
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center pt-2">
                    <Button asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-semibold">User not found</p>
                  <p className="text-muted-foreground text-sm">
                    The user profile you're looking for doesn't exist or has been removed.
                  </p>
                </div>
              )}
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
        <div className="flex flex-1 overflow-hidden gap-0">
          <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto bg-background w-full min-w-0">
            {/* Cover Image / Banner */}
            <div className="h-32 sm:h-40 md:h-48 lg:h-64 w-full relative overflow-hidden">
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

            <div className="w-full px-3 py-4 sm:px-4 md:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto pb-4 sm:pb-6 md:pb-8">
                {/* Profile Header */}
                <div className="relative -mt-12 sm:-mt-16 md:-mt-20 mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 md:gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 border-2 sm:border-3 md:border-4 border-background shadow-lg">
                      <AvatarImage
                        src={(() => {
                          if (!profileUser) return undefined;
                          
                          // Use blob URL if available (fetched with auth), otherwise use direct URL
                          if (profilePictureBlobUrl) {
                            console.log("[hiffi] AvatarImage using blob URL:", profilePictureBlobUrl);
                            return profilePictureBlobUrl;
                          }
                          
                          const profilePicUrl = getProfilePictureUrl(profileUser, true);
                          console.log("[hiffi] AvatarImage src for profile:", {
                            profile_picture: profileUser.profile_picture,
                            generatedUrl: profilePicUrl,
                            version: profilePictureVersion,
                            hasBlobUrl: !!profilePictureBlobUrl
                          });
                          // Add aggressive cache busting with version number when version > 0
                          // This ensures new uploads get fresh cache, but existing images don't reload constantly
                          if (profilePicUrl && profilePictureVersion > 0) {
                            const separator = profilePicUrl.includes("?") ? "&" : "?";
                            return `${profilePicUrl}${separator}v=${profilePictureVersion}`;
                          }
                          return profilePicUrl || undefined;
                        })()}
                        key={`avatar-main-${profileUser?.profile_picture || 'none'}-${profilePictureVersion}-${profileUser?.updated_at || 'no-update'}-${profilePictureBlobUrl ? 'blob' : 'direct'}`}
                        alt={`${profileUser?.name || profileUser?.username || username}'s profile picture`}
                      />
                      <AvatarFallback 
                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white"
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
                      className="absolute bottom-0 right-0 rounded-full shadow-md h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"
                      onClick={() => setIsProfilePictureDialogOpen(true)}
                      title="Edit profile picture"
                    >
                      <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                
                  <div className="flex-1 min-w-0 pt-1 sm:pt-0 sm:pb-2 w-full">
                    {profileUser.name && profileUser.name.trim() ? (
                      <>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate mb-1">
                          {profileUser.name.trim()}
                        </h1>
                        <p className="text-muted-foreground text-xs sm:text-sm md:text-base">@{profileUser.username || username}</p>
                      </>
                    ) : (
                      <>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate mb-1">
                          {profileUser.username || username}
                        </h1>
                        <p className="text-muted-foreground text-xs sm:text-sm md:text-base">@{profileUser.username || username}</p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 sm:gap-3 w-full sm:w-auto mt-3 sm:mt-0 sm:pb-4">
                    <Button 
                      className="flex-1 sm:flex-none text-xs sm:text-sm" 
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Edit Details</span>
                      <span className="xs:hidden">Edit</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="flex-shrink-0"
                      onClick={handleCopy}
                      aria-label="Copy profile link"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="flex-shrink-0"
                      onClick={handleShare}
                      aria-label="Share profile"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Personal Details Section */}
                <div className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-1">
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Full Name</Label>
                          <p className="text-sm sm:text-base font-medium break-words">
                            {profileUser.name && profileUser.name.trim() ? profileUser.name.trim() : "Not set"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Username</Label>
                          <p className="text-sm sm:text-base font-medium break-all">@{profileUser.username || username}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Email</Label>
                          <p className="text-sm sm:text-base font-medium break-all">
                            {profileUser.email || "Not set"}
                          </p>
                        </div>
                        {profileUser.createdat && (
                          <div className="space-y-1">
                            <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Member Since</Label>
                            <p className="text-sm sm:text-base font-medium">
                              {format(new Date(profileUser.createdat), 'MMMM d, yyyy')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg">About</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 pt-0">
                      <div className="space-y-1">
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Bio</Label>
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {profileUser.bio && profileUser.bio.trim() ? profileUser.bio.trim() : "No bio available. Click Edit to add one."}
                        </p>
                      </div>
                      
                      {/* Email display below bio */}
                      {(profileUser.email || (isOwnProfile && currentUserData?.email)) && (
                        <div className="pt-3 border-t">
                          <Label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</Label>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <a 
                              href={`mailto:${profileUser.email || currentUserData?.email}`}
                              className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors break-all"
                            >
                              {profileUser.email || currentUserData?.email}
                            </a>
                          </div>
                        </div>
                      )}
                      
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
                              prev.filter((v) => ((v as any).videoId || v.video_id) !== videoId)
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

        {/* Edit Profile Dialogs */}
        {isOwnProfile && profileUser && (
          <>
            <EditProfileDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              currentName={profileUser.name || profileUser.username || ""}
              currentUsername={profileUser.username || username}
              currentEmail={profileUser.email || currentUserData?.email || ""}
              currentBio={profileUser.bio || ""}
              onProfileUpdated={async () => {
              // Immediately increment profile picture version to force re-render
              // This ensures the new image displays even before backend refresh
              setProfilePictureVersion(prev => prev + 1)
              // Use a longer delay to ensure backend has processed the update and updated_at is refreshed
              await new Promise(resolve => setTimeout(resolve, 500))
              await fetchUserData(true)
            }}
            />
            <ProfilePictureDialog
              open={isProfilePictureDialogOpen}
              onOpenChange={setIsProfilePictureDialogOpen}
              currentProfilePicture={profileUser.profile_picture || ""}
              currentName={profileUser.name || profileUser.username || ""}
              currentUsername={profileUser.username || username}
              onProfileUpdated={async () => {
              // Immediately increment profile picture version to force re-render
              // This ensures the new image displays even before backend refresh
              setProfilePictureVersion(prev => prev + 1)
              // Use a longer delay to ensure backend has processed the update and updated_at is refreshed
              await new Promise(resolve => setTimeout(resolve, 500))
              await fetchUserData(true)
            }}
            />
          </>
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
          <div className="h-32 sm:h-40 md:h-48 lg:h-64 w-full relative overflow-hidden">
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

          <div className="w-full px-3 py-4 sm:px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto pb-4 sm:pb-6 md:pb-8">
              {/* Profile Header */}
              <div className="relative -mt-12 sm:-mt-16 md:-mt-20 mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 md:gap-6">
                <div className="relative">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 border-2 sm:border-3 md:border-4 border-background shadow-lg">
                    <AvatarImage
                      src={(() => {
                        if (!profileUser) return undefined;
                        
                        // Use blob URL if available (fetched with auth), otherwise use direct URL
                        if (profilePictureBlobUrl) {
                          return profilePictureBlobUrl;
                        }
                        
                        const baseUrl = getProfilePictureUrl(profileUser, true);
                        // Add aggressive cache busting with version number when version > 0
                        // This ensures new uploads get fresh cache, but existing images don't reload constantly
                        if (baseUrl && profilePictureVersion > 0) {
                          const separator = baseUrl.includes("?") ? "&" : "?";
                          return `${baseUrl}${separator}v=${profilePictureVersion}`;
                        }
                        return baseUrl || undefined;
                      })()}
                      key={`avatar-creator-${profileUser?.profile_picture || 'none'}-${profilePictureVersion}-${profileUser?.updated_at || 'no-update'}-${profilePictureBlobUrl ? 'blob' : 'direct'}`}
                      alt={`${profileUser?.name || profileUser?.username || username}'s profile picture`}
                    />
                    <AvatarFallback 
                      className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white"
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
                      className="absolute bottom-0 right-0 rounded-full shadow-md h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"
                      onClick={() => setIsProfilePictureDialogOpen(true)}
                      title="Edit profile picture"
                    >
                      <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </Button>
                  )}
                </div>
              
                <div className="flex-1 min-w-0 pt-1 sm:pt-0 sm:pb-2 w-full">
                  {profileUser.name && profileUser.name.trim() ? (
                    <>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate mb-1">
                        {profileUser.name.trim()}
                      </h1>
                      <p className="text-muted-foreground text-xs sm:text-sm md:text-base">@{profileUser.username || username}</p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate mb-1">
                        {profileUser.username || username}
                      </h1>
                      <p className="text-muted-foreground text-xs sm:text-sm md:text-base">@{profileUser.username || username}</p>
                    </>
                  )}
                </div>

                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto mt-3 sm:mt-0 sm:pb-4">
                  {isOwnProfile ? (
                    <Button 
                      className="flex-1 sm:flex-none text-xs sm:text-sm" 
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Edit Details</span>
                      <span className="xs:hidden">Edit</span>
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1 sm:flex-none text-xs sm:text-sm" 
                      size="sm"
                      variant={isFollowing ? "secondary" : "default"}
                      onClick={handleFollow}
                      disabled={isFollowingAction}
                    >
                      {isFollowingAction ? (
                        <>
                          <UserPlus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
                          <span className="hidden xs:inline">{isFollowing ? "Unfollowing..." : "Following..."}</span>
                          <span className="xs:hidden">...</span>
                        </>
                      ) : isFollowing ? (
                        <>
                          <UserCheck className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden xs:inline">Following</span>
                          <span className="xs:hidden">Followed</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="flex-shrink-0"
                    onClick={handleCopy}
                    aria-label="Copy profile link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="flex-shrink-0"
                    onClick={handleShare}
                    aria-label="Share profile"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {/* Left Sidebar Info */}
                <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg">About</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 pt-0">
                      <p className="text-xs sm:text-sm leading-relaxed break-words">{profileUser.bio || "No bio available"}</p>
                      
                      {/* Email display below bio */}
                      {(profileUser.email || (isOwnProfile && currentUserData?.email)) && (
                        <div className="pt-3 border-t">
                          <Label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</Label>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <a 
                              href={`mailto:${profileUser.email || currentUserData?.email}`}
                              className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors break-all"
                            >
                              {profileUser.email || currentUserData?.email}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                        {profileUser.createdat && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>Joined {format(new Date(profileUser.createdat), 'MMMM yyyy')}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 sm:pt-4 border-t">
                        <h3 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm">Stats</h3>
                        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                          <div className="p-1.5 sm:p-2 bg-muted rounded-lg text-center min-w-0 overflow-hidden">
                            <div className="text-sm sm:text-base md:text-lg font-bold mb-0.5">{(profileUser?.total_videos || profileUser?.totalVideos || profileUser?.totalvideos || userVideos.length || 0).toLocaleString()}</div>
                            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-normal leading-[1.2] break-all hyphens-auto">Videos</div>
                          </div>
                          <div className="p-1.5 sm:p-2 bg-muted rounded-lg text-center min-w-0 overflow-hidden">
                            <div className="text-sm sm:text-base md:text-lg font-bold mb-0.5">{(profileUser?.followers ?? 0).toLocaleString()}</div>
                            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-normal leading-[1.2] break-all hyphens-auto">Followers</div>
                          </div>
                          <div className="p-1.5 sm:p-2 bg-muted rounded-lg text-center min-w-0 overflow-hidden">
                            <div className="text-sm sm:text-base md:text-lg font-bold mb-0.5">{(profileUser?.following ?? 0).toLocaleString()}</div>
                            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-normal leading-[1.2] break-all hyphens-auto">Following</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 order-1 lg:order-2">
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 md:mb-6">Videos</h2>
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

      {/* Edit Profile Dialogs */}
      {isOwnProfile && profileUser && (
        <>
          <EditProfileDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            currentName={profileUser.name || profileUser.username || ""}
            currentUsername={profileUser.username || username}
            currentEmail={profileUser.email || currentUserData?.email || ""}
            currentBio={profileUser.bio || ""}
            onProfileUpdated={async () => {
              // Use a small delay to prevent rapid state updates
              await new Promise(resolve => setTimeout(resolve, 100))
              await fetchUserData(true)
            }}
          />
          <ProfilePictureDialog
            open={isProfilePictureDialogOpen}
            onOpenChange={setIsProfilePictureDialogOpen}
            currentProfilePicture={profileUser.profile_picture || ""}
            currentName={profileUser.name || profileUser.username || ""}
            currentUsername={profileUser.username || username}
            onProfileUpdated={async () => {
              // Use a small delay to prevent rapid state updates
              await new Promise(resolve => setTimeout(resolve, 100))
              await fetchUserData(true)
            }}
          />
        </>
      )}
    </div>
  );
}
