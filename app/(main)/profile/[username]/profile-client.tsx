'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { getColorFromName, getAvatarLetter, getProfilePictureUrl, getProfilePictureProxyUrl, isCreator } from '@/lib/utils';
import { shareUrl } from '@/lib/share';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';
import { ProfilePictureDialog } from '@/components/profile/profile-picture-dialog';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { ProfilePersonalView } from '@/components/profile/profile-personal-view';
import { ProfilePublicView } from '@/components/profile/profile-public-view';
import { ProfileMemberView } from '@/components/profile/profile-member-view';
import { debugLog, debugWarn } from '@/lib/debug';

const VIDEOS_PER_PAGE = 10;

export type ProfilePageProps = {
  /** Public profile from server (GET /users/{username}). */
  initialProfileUser?: Record<string, unknown> | null;
  /** First page of public videos from server. */
  initialVideos?: Record<string, unknown>[];
};

function sortVideosByUpdatedDateStatic(videos: Record<string, unknown>[]): Record<string, unknown>[] {
  const ts = (video: Record<string, unknown>) => {
    const raw =
      video.updated_at ??
      video.updatedAt ??
      video.video_updated_at ??
      video.videoUpdatedAt ??
      video.created_at ??
      video.createdAt ??
      video.createdat;
    if (!raw) return 0;
    const t = new Date(String(raw)).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  return [...videos].sort((a, b) => ts(b) - ts(a));
}

export default function ProfilePage({
  initialProfileUser = null,
  initialVideos = [],
}: ProfilePageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { userData: currentUserData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const sortedInitialVideos = useMemo(
    () => sortVideosByUpdatedDateStatic(initialVideos),
    [initialVideos],
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingAction, setIsFollowingAction] = useState(false);
  const [followActionType, setFollowActionType] = useState<"follow" | "unfollow" | null>(null);
  const [profileUser, setProfileUser] = useState<any>(() => initialProfileUser ?? null);
  const [userVideos, setUserVideos] = useState<any[]>(() => sortedInitialVideos);
  const [isLoading, setIsLoading] = useState(() => !initialProfileUser);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(() => sortedInitialVideos.length === VIDEOS_PER_PAGE);
  const [offset, setOffset] = useState(() => sortedInitialVideos.length);
  const [isFetching, setIsFetching] = useState(false);
  const [hasTriedFetch, setHasTriedFetch] = useState(() => !!initialProfileUser);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProfilePictureDialogOpen, setIsProfilePictureDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profilePictureVersion, setProfilePictureVersion] = useState(0);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);

  const serverHasProfileRef = useRef(!!initialProfileUser);
  const serverHasVideosRef = useRef(sortedInitialVideos.length > 0);
  const profileSyncInFlightRef = useRef(false);
  const ownProfileVideosSyncedRef = useRef(false);
  const profileUserRef = useRef<any>(initialProfileUser ?? null);
  const userVideosRef = useRef<any[]>(sortedInitialVideos);
  profileUserRef.current = profileUser;
  userVideosRef.current = userVideos;

  const username = params.username as string;
  const isOwnProfile = currentUserData?.username === username;
  const profileIsCreator = isCreator(profileUser ?? initialProfileUser);
  const referralUrl =
    typeof window !== "undefined" ? `${window.location.origin}/referrar/${username}` : `/referrar/${username}`;
  const profileUrl =
    typeof window !== "undefined" ? `${window.location.origin}/profile/${encodeURIComponent(username)}` : `/profile/${encodeURIComponent(username)}`;

  const getVideoUpdatedTimestamp = useCallback((video: any): number => {
    const updatedCandidate =
      video?.updated_at ??
      video?.updatedAt ??
      video?.video_updated_at ??
      video?.videoUpdatedAt ??
      video?.created_at ??
      video?.createdAt ??
      video?.createdat;

    if (!updatedCandidate) return 0;
    const timestamp = new Date(updatedCandidate).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }, []);

  const sortVideosByUpdatedDate = useCallback(
    (videos: any[]) =>
      [...videos].sort((a, b) => getVideoUpdatedTimestamp(b) - getVideoUpdatedTimestamp(a)),
    [getVideoUpdatedTimestamp],
  );
  
  debugLog("[hiffi] Current user data (auth context):", {
    username: (currentUserData as any)?.username,
    profile_picture: (currentUserData as any)?.profile_picture,
    image: (currentUserData as any)?.image,
  })

  const fetchUserData = useCallback(async (forceRefresh: boolean = false) => {
      if (!username) {
        setIsLoading(false);
        setHasTriedFetch(true);
        return;
      }

      if (authLoading) {
        return;
      }

      if (profileSyncInFlightRef.current && !forceRefresh) {
        return;
      }
      profileSyncInFlightRef.current = true;

      const viewingOwnProfile = currentUserData?.username === username;

      if (forceRefresh && typeof window !== "undefined" && viewingOwnProfile) {
        localStorage.removeItem("hiffi_user_data");
        localStorage.removeItem("hiffi_user_data_timestamp");
      }

      const hasServerSeed =
        !forceRefresh && (serverHasProfileRef.current || !!profileUserRef.current);

      try {
        if (!hasServerSeed) {
          setIsLoading(true);
        }
        setHasTriedFetch(true);
        
        // Use /users/{username} for all profiles (including own profile)
        // /users/self is deprecated
        debugLog("[hiffi] Fetching profile using /users/{username}", forceRefresh ? "(force refresh)" : "")
        const response = await apiClient.getUserByUsername(username);
        debugLog("[hiffi] User data from API (raw response):", JSON.stringify(response, null, 2))
        
        // Handle API response format: { success: true, user: {...}, following?: boolean }
        // or: { success: true, data: { user: {...} } }
        const responseAny = response as any;
        const profileData = (response?.success && response?.user) 
          ? response.user 
          : (responseAny?.data?.user || response?.user || (responseAny?.data && typeof responseAny.data === 'object' && !responseAny.data.user ? responseAny.data : null) || response);
        
        debugLog("[hiffi] Extracted profile data:", JSON.stringify(profileData, null, 2))
        debugLog("[hiffi] Profile picture field:", (profileData as any)?.profile_picture)
        debugLog("[hiffi] Image field:", (profileData as any)?.image)
        debugLog("[hiffi] Profile picture type:", typeof (profileData as any)?.profile_picture)
        debugLog("[hiffi] Profile picture is URL:", (profileData as any)?.profile_picture?.startsWith?.("http"))
        debugLog("[hiffi] Profile picture value:", (profileData as any)?.profile_picture)
        debugLog("[hiffi] Updated at:", (profileData as any)?.updated_at)
        debugLog("[hiffi] All profile data keys:", Object.keys(profileData || {}))
        
        // Check for any other image-related fields
        const imageFields = Object.keys(profileData || {}).filter(key => 
          key.toLowerCase().includes('image') || 
          key.toLowerCase().includes('avatar') || 
          key.toLowerCase().includes('picture') ||
          key.toLowerCase().includes('photo')
        );
        debugLog("[hiffi] All image-related fields:", imageFields)
        imageFields.forEach(field => {
          debugLog(`[hiffi] ${field}:`, (profileData as any)?.[field])
        });
        debugLog("[hiffi] Followers:", (profileData as any)?.followers)
        debugLog("[hiffi] Following:", (profileData as any)?.following)
        
        const previousProfilePicture =
          profileUserRef.current?.profile_picture || profileUserRef.current?.image;
        const newProfilePicture = profileData?.profile_picture || profileData?.image;

        if (profileData?.image && !profileData?.profile_picture) {
          debugLog("[hiffi] Normalizing: setting profile_picture from image field")
          profileData.profile_picture = profileData.image;
        }

        if (!profileData.profile_picture && userVideosRef.current.length > 0) {
          const videoWithPicture = userVideosRef.current.find(
            (v: any) => v.user_profile_picture && String(v.user_profile_picture).trim() !== "",
          );
          if (videoWithPicture?.user_profile_picture) {
            debugLog(
              "[hiffi] Rescuing profile_picture from seeded video metadata:",
              videoWithPicture.user_profile_picture,
            );
            profileData.profile_picture = videoWithPicture.user_profile_picture;
          }
        }

        debugLog("[hiffi] Final profile_picture value before setting state:", (profileData as any)?.profile_picture)

        setProfileUser(profileData);
        serverHasProfileRef.current = true;

        // Increment profile picture version if profile_picture path changed OR if force refresh
        // This forces AvatarImage to re-render with new cache buster
        if (forceRefresh || (newProfilePicture && newProfilePicture !== previousProfilePicture)) {
          debugLog("[hiffi] Profile picture changed or force refresh, incrementing version", {
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
          debugLog("[hiffi] Following status from API:", followingStatus)
          setIsFollowing(followingStatus);
        } else {
          setIsFollowing(false); // Can't follow yourself
        }
        
        const needsVideoFetch =
          isCreator(profileData) &&
          (forceRefresh ||
            (!serverHasVideosRef.current && userVideosRef.current.length === 0));

        if (needsVideoFetch) {
          setUserVideos([]);
          setOffset(0);
          setHasMore(true);
          serverHasVideosRef.current = false;
          await fetchUserVideos(0, true, viewingOwnProfile);
          serverHasVideosRef.current = userVideosRef.current.length > 0;
        }
      } catch (error: any) {
        console.error("[hiffi] Failed to fetch user data:", error);
        // Check if it's an authentication error (401)
        // ApiError has status property: { message: string, status: number }
        const errorStatus = error?.status;
        const authToken = apiClient.getAuthToken();
        const isAuthError = errorStatus === 401 && !authToken;
        
        debugLog("[hiffi] Error handling:", {
          errorStatus,
          hasAuthToken: !!authToken,
          isAuthError,
          authLoading,
          errorMessage: error?.message,
        });
        
        if (isAuthError) {
          setIsUnauthenticated(true);
          if (!profileUserRef.current) {
            setProfileUser(null);
          }
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
        profileSyncInFlightRef.current = false;
      }
  }, [username, toast, authLoading, currentUserData?.username]);

  // Fetch user videos with infinite scroll support
  const fetchUserVideos = useCallback(async (currentOffset: number, isInitialLoad: boolean, isOwnProfile: boolean) => {
    // Prevent duplicate requests
    if (isFetching) {
      debugLog("[hiffi] Already fetching videos, skipping duplicate request")
      return;
    }

    try {
      setIsFetching(true);
      
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Fetch videos from appropriate endpoint based on profile ownership
      let videosResponse;
      if (isOwnProfile) {
        console.log(`[hiffi] Fetching own videos - Offset: ${currentOffset}, Limit: ${VIDEOS_PER_PAGE}`);
        videosResponse = await apiClient.listSelfVideos({ 
          offset: currentOffset, 
          limit: VIDEOS_PER_PAGE 
        });
      } else {
        console.log(`[hiffi] Fetching videos for ${username} - Offset: ${currentOffset}, Limit: ${VIDEOS_PER_PAGE}`);
        videosResponse = await apiClient.getUserVideos(username, { 
          offset: currentOffset, 
          limit: VIDEOS_PER_PAGE 
        });
      }

      const videosArray = videosResponse.videos || [];
      console.log(`[hiffi] Received ${videosArray.length} videos at offset ${currentOffset}`);

      // Enhance videos with profile user's profile picture and username if available
      const enhancedVideos = videosArray.map((video: any) => {
        const sourceUser = profileUser || (isOwnProfile ? currentUserData : null);
        
        // Ensure username is present (sometimes missing in self-video list)
        if (!video.user_username && !video.userUsername && sourceUser?.username) {
          video.user_username = sourceUser.username;
        } else if (!video.user_username && !video.userUsername && username) {
          video.user_username = username;
        }

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
      const sortedEnhancedVideos = sortVideosByUpdatedDate(enhancedVideos);

      if (currentOffset === 0) {
        // Initial load - replace videos
        setUserVideos(sortedEnhancedVideos);
        setOffset(0);
      } else {
        // Append new videos to existing ones
        setUserVideos((prev) => {
          // Prevent duplicates by checking video IDs
          const existingIds = new Set(prev.map(v => (v as any).videoId || (v as any).video_id));
          const newVideos = sortedEnhancedVideos.filter(v => !existingIds.has((v as any).videoId || (v as any).video_id));
          const updatedVideos = sortVideosByUpdatedDate([...prev, ...newVideos]);
          const newOffset = prev.length + newVideos.length;
          setOffset(newOffset);
          return updatedVideos;
        });
      }

      // If we got fewer videos than requested, there are no more pages
      setHasMore(sortedEnhancedVideos.length === VIDEOS_PER_PAGE);
      
      if (sortedEnhancedVideos.length < VIDEOS_PER_PAGE) {
        console.log(`[hiffi] Reached end of pagination. Got ${sortedEnhancedVideos.length} videos, expected ${VIDEOS_PER_PAGE}`);
      }
    } catch (error) {
      console.error("[hiffi] Failed to fetch user videos:", error);
      
      // Retry logic for pagination (but not for initial load)
      if (currentOffset > 0) {
        debugLog("[hiffi] Retrying pagination request...")
        // Don't retry immediately, let user try scrolling again
        // Just set hasMore to false to prevent infinite retry loops
        setHasMore(false);
      } else {
        // Set empty array on error for initial load
        setUserVideos([]);
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      setIsFetching(false);
    }
  }, [username, isFetching, profileUser, currentUserData, isOwnProfile, sortVideosByUpdatedDate]);

  const loadMoreVideos = useCallback(() => {
    // Only load more if:
    // 1. Not currently loading (initial or more)
    // 2. Not already fetching
    // 3. There are more videos available
    if (!isLoading && !loadingMore && !isFetching && hasMore) {
      // Offset should be the number of items to skip, not page number
      // Calculate next offset based on current number of videos loaded
      const nextOffset = userVideos.length;
      console.log(`[hiffi] Loading more videos for user ${username} - Current videos: ${userVideos.length}, Next offset: ${nextOffset}`);
      setOffset(nextOffset);
      fetchUserVideos(nextOffset, false, isOwnProfile);
    } else {
      console.log(`[hiffi] Cannot load more - loading: ${isLoading}, loadingMore: ${loadingMore}, isFetching: ${isFetching}, hasMore: ${hasMore}`);
    }
  }, [isLoading, loadingMore, isFetching, hasMore, userVideos.length, username, isOwnProfile, fetchUserVideos]);

  // Reset SSR seed refs when navigating to another profile (new server props).
  useEffect(() => {
    serverHasProfileRef.current = !!initialProfileUser;
    serverHasVideosRef.current = sortedInitialVideos.length > 0;
    profileSyncInFlightRef.current = false;
    ownProfileVideosSyncedRef.current = false;
    setProfileUser(initialProfileUser ?? null);
    setUserVideos(sortedInitialVideos);
    setIsLoading(!initialProfileUser);
    setHasTriedFetch(!!initialProfileUser);
    setHasMore(sortedInitialVideos.length === VIDEOS_PER_PAGE);
    setOffset(sortedInitialVideos.length);
  }, [username, initialProfileUser, sortedInitialVideos, initialVideos]);

  // Single profile sync when auth is ready — do not depend on profileUser/videos (avoids fetch loops).
  useEffect(() => {
    if (authLoading || !username) return;
    void fetchUserData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, authLoading, currentUserData?.username]);

  // Own profile: refresh videos once via /videos/list/self after auth (SSR uses public list).
  useEffect(() => {
    if (authLoading || !username || !isOwnProfile || !profileIsCreator) return;
    if (!serverHasVideosRef.current || ownProfileVideosSyncedRef.current) return;
    ownProfileVideosSyncedRef.current = true;
    void fetchUserVideos(0, false, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isOwnProfile, username]);

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

  const handleCopy = async () => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    try {
      await navigator.clipboard.writeText(referralUrl)
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
    if (typeof window === 'undefined') return

    const displayName = profileUser?.name || profileUser?.username || username
    const title = `${displayName}'s Profile`
    const text = `Check out ${displayName}'s profile on Hiffi`

    const result = await shareUrl({ title, text, url: profileUrl })

    if (result.success && result.method === 'share') {
      toast({ title: "Shared!", description: "Profile shared successfully" })
      return
    }
    if (result.success && result.method === 'clipboard') {
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard. Use the copy button to copy again.",
      })
      setTimeout(() => setCopied(false), 2000)
      return
    }
    if (!result.success && !result.cancelled) {
      toast({
        title: "Could not share",
        description: "Try copying the URL from your browser address bar.",
        variant: "destructive",
      })
    }
  }

  const handleFollow = async () => {
    if (!currentUserData) {
      setAuthDialogOpen(true);
      return;
    }

    // Prevent double-clicks
    if (isFollowingAction) return;

    // Store previous state for rollback
    const previousFollowingState = isFollowing;
    const actionType: "follow" | "unfollow" = previousFollowingState ? "unfollow" : "follow";
    setFollowActionType(actionType);
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
          // Use /users/{username} for all profiles (including own profile)
          // /users/self is deprecated
          const refreshedResponse = await apiClient.getUserByUsername(username);
      debugLog("[hiffi] Refreshed user data after unfollow:", refreshedResponse)
          // Handle API response format: { success: true, user: {...}, following?: boolean }
          const profileData = (refreshedResponse?.success && refreshedResponse?.user) ? refreshedResponse.user : (refreshedResponse?.user || refreshedResponse);
          setProfileUser(profileData);
          // Update following status from API response
          if (!isOwnProfile && refreshedResponse?.following !== undefined) {
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
          // Use /users/{username} for all profiles (including own profile)
          // /users/self is deprecated
          const refreshedResponse = await apiClient.getUserByUsername(username);
      debugLog("[hiffi] Refreshed user data after follow:", refreshedResponse)
          // Handle API response format: { success: true, user: {...}, following?: boolean }
          const profileData = (refreshedResponse?.success && refreshedResponse?.user) ? refreshedResponse.user : (refreshedResponse?.user || refreshedResponse);
          setProfileUser(profileData);
          // Update following status from API response
          if (!isOwnProfile && refreshedResponse?.following !== undefined) {
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
      setFollowActionType(null);
    }
  };

  if ((authLoading && !profileUser) || (isLoading && !profileUser)) {
    return (
      <>
        <div className="flex items-center justify-center min-h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!isLoading && hasTriedFetch && !profileUser) {
    return (
      <>
        <div className="flex items-center justify-center min-h-full">
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
        </div>
      </>
    );
  }

  if (!profileUser) {
    // Still loading or initial state - don't show anything yet
    return null;
  }

  // Members viewing their own profile — personal settings layout (no creator videos grid)
  if (!profileIsCreator && isOwnProfile) {
    return (
      <ProfilePersonalView
        profileUser={profileUser}
        username={username}
        currentUserData={currentUserData}
        isOwnProfile={isOwnProfile}
        profilePictureVersion={profilePictureVersion}
        referralUrl={referralUrl}
        copied={copied}
        userVideos={userVideos}
        isLoading={isLoading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        isProfilePictureDialogOpen={isProfilePictureDialogOpen}
        setIsProfilePictureDialogOpen={setIsProfilePictureDialogOpen}
        authDialogOpen={authDialogOpen}
        setAuthDialogOpen={setAuthDialogOpen}
        handleShare={handleShare}
        handleCopy={handleCopy}
        loadMoreVideos={loadMoreVideos}
        onVideoDeleted={(videoId) => {
          setUserVideos((prev) => prev.filter((v) => ((v as any).videoId || v.video_id) !== videoId))
        }}
        onEditProfileUpdated={async () => {
          setProfilePictureVersion((prev) => prev + 1)
          await new Promise((resolve) => setTimeout(resolve, 500))
          await fetchUserData(true)
        }}
        onProfilePictureUpdated={async () => {
          setProfilePictureVersion((prev) => prev + 1)
          await new Promise((resolve) => setTimeout(resolve, 500))
          await fetchUserData(true)
        }}
      />
    );
  }

  // Members (non-creators) viewed by someone else — no videos / creator chrome
  if (!profileIsCreator && !isOwnProfile) {
    return (
      <ProfileMemberView
        profileUser={profileUser}
        username={username}
        isFollowing={isFollowing}
        isFollowingAction={isFollowingAction}
        followActionType={followActionType}
        profilePictureVersion={profilePictureVersion}
        authDialogOpen={authDialogOpen}
        setAuthDialogOpen={setAuthDialogOpen}
        handleShare={handleShare}
        handleFollow={handleFollow}
      />
    );
  }

  // Creator profiles — videos grid, stats, follow
  return (
    <ProfilePublicView
      profileUser={profileUser}
      username={username}
      currentUserData={currentUserData}
      isOwnProfile={isOwnProfile}
      isFollowing={isFollowing}
      isFollowingAction={isFollowingAction}
      followActionType={followActionType}
      profilePictureVersion={profilePictureVersion}
      referralUrl={referralUrl}
      copied={copied}
      userVideos={userVideos}
      isLoading={isLoading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      isEditDialogOpen={isEditDialogOpen}
      setIsEditDialogOpen={setIsEditDialogOpen}
      isProfilePictureDialogOpen={isProfilePictureDialogOpen}
      setIsProfilePictureDialogOpen={setIsProfilePictureDialogOpen}
      authDialogOpen={authDialogOpen}
      setAuthDialogOpen={setAuthDialogOpen}
      handleShare={handleShare}
      handleCopy={handleCopy}
      handleFollow={handleFollow}
      loadMoreVideos={loadMoreVideos}
      onVideoDeleted={(videoId) => {
        setUserVideos((prev) => prev.filter((v) => (v.videoId || v.video_id) !== videoId))
      }}
      onEditProfileUpdated={async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        await fetchUserData(true)
      }}
      onProfilePictureUpdated={async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        await fetchUserData(true)
      }}
    />
  );
  }
