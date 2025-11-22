'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { VideoGrid } from '@/components/video/video-grid';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Edit, Share2, MapPin, LinkIcon, Calendar, UserPlus, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { getColorFromName, getAvatarLetter } from '@/lib/utils';

// Generate a gradient color based on user's name/username
function getGradientFromName(name: string): string {
  // Convert name to a number for consistent color generation
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate two colors for gradient
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60) % 360; // Offset by 60 degrees for complementary colors
  
  // Use HSL for vibrant colors
  const sat1 = 65 + (Math.abs(hash) % 20); // 65-85% saturation
  const sat2 = 65 + (Math.abs(hash * 2) % 20);
  const light1 = 45 + (Math.abs(hash) % 15); // 45-60% lightness
  const light2 = 50 + (Math.abs(hash * 3) % 15);
  
  return `linear-gradient(135deg, hsl(${hue1}, ${sat1}%, ${light1}%), hsl(${hue2}, ${sat2}%, ${light2}%))`;
}

export default function ProfilePage() {
  const params = useParams();
  const { userData: currentUserData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTriedFetch, setHasTriedFetch] = useState(false);
  
  const username = params.username as string;
  const isOwnProfile = currentUserData?.username === username;

  useEffect(() => {
    async function fetchUserData() {
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
        const userData = await apiClient.getUserByUsername(username);
        console.log("[v0] User data from API:", userData);
        console.log("[v0] Followers:", userData?.followers, userData?.user?.followers);
        console.log("[v0] Following:", userData?.following, userData?.user?.following);
        // Handle both direct response and nested user object
        const profileData = userData?.user || userData;
        setProfileUser(profileData);
        
        // Check if current user is following this profile user
        if (currentUserData?.username && currentUserData.username !== username) {
          try {
            const isFollowingStatus = await apiClient.checkFollowingStatus(
              currentUserData.username,
              username
            );
            setIsFollowing(isFollowingStatus);
          } catch (followError) {
            console.error("[v0] Failed to check following status:", followError);
            setIsFollowing(userData.isfollowing || false);
          }
        } else {
          setIsFollowing(false); // Can't follow yourself
        }
        
        // Fetch user's videos
        const videosResponse = await apiClient.getVideoList({ page: 1, limit: 50, search: username });
        // Filter videos by this user
        const filteredVideos = videosResponse.videos.filter(
          (v: any) => (v.user_username || v.userUsername) === username
        );
        setUserVideos(filteredVideos);
      } catch (error: any) {
        console.error("[v0] Failed to fetch user data:", error);
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
    }

    fetchUserData();
  }, [username, toast, authLoading, currentUserData?.username]);

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
          const refreshedUserData = await apiClient.getUserByUsername(username);
          console.log("[v0] Refreshed user data after unfollow:", refreshedUserData);
          // Handle both direct response and nested user object
          const profileData = refreshedUserData?.user || refreshedUserData;
          setProfileUser(profileData);
        } catch (refreshError) {
          console.error("[v0] Failed to refresh user data:", refreshError);
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
          const refreshedUserData = await apiClient.getUserByUsername(username);
          console.log("[v0] Refreshed user data after follow:", refreshedUserData);
          // Handle both direct response and nested user object
          const profileData = refreshedUserData?.user || refreshedUserData;
          setProfileUser(profileData);
        } catch (refreshError) {
          console.error("[v0] Failed to refresh user data:", refreshError);
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
        const verifiedStatus = await apiClient.checkFollowingStatus(
          currentUserData.username,
          username
        );
        setIsFollowing(verifiedStatus);
      } catch (verifyError) {
        console.error("[v0] Failed to verify following status:", verifyError);
      }
    } catch (error) {
      console.error("[v0] Failed to follow/unfollow user:", error);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-background w-full min-w-0">
          {/* Cover Image / Banner */}
          <div 
            className="h-48 md:h-64 w-full relative overflow-hidden"
            style={{
              background: profileUser.coverUrl 
                ? undefined
                : getGradientFromName((profileUser.name && profileUser.name.trim()) || profileUser.username || username || "User"),
            }}
          >
            {profileUser.coverUrl && (
              <img 
                src={profileUser.coverUrl} 
                alt="Cover" 
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
                    <AvatarImage src={profileUser.avatarUrl || profileUser.avatarurl || profileUser.profilepicture || ""} />
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
                    <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full shadow-md h-7 w-7 sm:h-8 sm:w-8">
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
                    <Button className="flex-1 sm:flex-none" size="sm">
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
                      <VideoGrid videos={userVideos} />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>No videos yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
