import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { WORKERS_BASE_URL, getWorkersApiKey } from '@/lib/storage'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get a single color for avatar background based on name/username
export function getColorFromName(name: string): string {
  return '#F97316'; // Theme orange
}

// Get display name for avatar (prioritizes name over username)
export function getDisplayName(user: any, fallback: string = "U"): string {
  if (!user) return fallback;
  const name = user.name || user.user_name || "";
  const username = user.username || user.user_username || user.userUsername || "";
  return (name.trim() || username || fallback).trim();
}

// Get first letter for avatar fallback
export function getAvatarLetter(user: any, fallback: string = "U"): string {
  const displayName = getDisplayName(user, fallback);
  return (displayName[0] || fallback).toUpperCase();
}

// Get profile picture URL with consistent logic
// Checks profile_picture first, then falls back to other avatar fields
// If profile_picture is a path (not a full URL), it routes through our proxy
// Includes cache busting parameter using updated_at timestamp if available
export function getProfilePictureUrl(user: any, useCacheBusting: boolean = true): string {
  if (!user) {
    console.log("[utils] getProfilePictureUrl: user is null/undefined");
    return "";
  }
  
  // Check profile_picture first (API field name)
  // Also check 'image' field as it might be used in some API responses
  const profilePicturePath = (user.profile_picture || user.image || "").toString().trim();
  console.log("[utils] getProfilePictureUrl:", {
    hasUser: !!user,
    profile_picture: user.profile_picture,
    image: user.image,
    profilePicturePath,
    useCacheBusting
  });
  
  if (profilePicturePath) {
    
    // If it's already a full URL (starts with http:// or https://), use it directly
    // This includes full Workers URLs like https://black-paper-83cf.hiffi.workers.dev/...
    if (profilePicturePath.startsWith("http://") || profilePicturePath.startsWith("https://")) {
      console.log("[utils] Profile picture is a full URL, using directly:", profilePicturePath);
      if (useCacheBusting) {
        // Add cache busting parameter - use updated_at if available, otherwise use current timestamp
        const separator = profilePicturePath.includes("?") ? "&" : "?";
        const cacheBuster = user.updated_at 
          ? new Date(user.updated_at).getTime() 
          : Date.now();
        return `${profilePicturePath}${separator}t=${cacheBuster}`;
      }
      return profilePicturePath;
    }
    
    // If it's a path (like "ProfileProto/users/..."), construct full Workers URL
    // We'll fetch it with authentication and create a blob URL
    console.log("[utils] Profile picture is a path, constructing full Workers URL:", profilePicturePath);
    let url = `${WORKERS_BASE_URL}/${profilePicturePath}`;
    
    // Add cache busting parameter if updated_at is available
    if (useCacheBusting) {
      const separator = url.includes("?") ? "&" : "?";
      if (user.updated_at) {
        // Use updated_at timestamp for cache busting
        url += `${separator}t=${new Date(user.updated_at).getTime()}`;
      } else {
        // Fallback to current timestamp if updated_at is not available
        // This ensures we always get a fresh image even if updated_at is missing
        url += `${separator}t=${Date.now()}`;
      }
    }
    
    return url;
  }
  
  // Fall back to other common field names (these are likely already full URLs)
  const fallbackUrl = (
    user.avatarUrl || 
    user.avatar_url || 
    user.avatarurl || 
    user.profilepicture || 
    user.userAvatar || 
    user.user_avatar ||
    user.comment_by_avatar ||
    user.comment_by_avatar_url ||
    user.reply_by_avatar ||
    user.reply_by_avatar_url ||
    ""
  );
  
  // Add cache busting to fallback URLs if needed
  if (fallbackUrl && useCacheBusting && user.updated_at) {
    const separator = fallbackUrl.includes("?") ? "&" : "?";
    return `${fallbackUrl}${separator}t=${new Date(user.updated_at).getTime()}`;
  }
  
  return fallbackUrl;
}

/**
 * Fetches a profile picture from Workers with authentication and returns a blob URL
 * This is needed when the Workers endpoint requires x-api-key header
 * Always fetches fresh - no caching
 * @param profilePictureUrl - Full Workers URL to the profile picture
 * @returns Promise<string> - Blob URL that can be used in img src
 */
export async function fetchProfilePictureWithAuth(profilePictureUrl: string): Promise<string> {
  if (!profilePictureUrl) {
    throw new Error("Profile picture URL is required");
  }
  
  // If it's not a Workers URL, return as is (no auth needed)
  if (!profilePictureUrl.includes(WORKERS_BASE_URL)) {
    return profilePictureUrl;
  }
  
  const apiKey = getWorkersApiKey();
  if (!apiKey) {
    console.error("[utils] No API key found, profile picture may fail to load");
    // Return the URL anyway - might work if Workers doesn't require auth
    return profilePictureUrl;
  }

  try {
    // Add cache busting to ensure fresh fetch every time
    const separator = profilePictureUrl.includes("?") ? "&" : "?";
    const freshUrl = `${profilePictureUrl}${separator}_fresh=${Date.now()}`;
    
    console.log("[utils] Fetching profile picture from Workers with auth (fresh):", freshUrl);
    const response = await fetch(freshUrl, {
      headers: {
        'x-api-key': apiKey,
      },
      cache: 'no-store', // Don't cache to ensure fresh images
    });

    if (!response.ok) {
      console.error(`[utils] Failed to fetch profile picture: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch profile picture: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    console.log("[utils] Profile picture fetched successfully (fresh), created blob URL");
    return blobUrl;
  } catch (error) {
    console.error("[utils] Error fetching profile picture with auth:", error);
    // Return the original URL as fallback - might work if Workers allows public access
    return profilePictureUrl;
  }
}

/**
 * Converts a profile picture URL to use the proxy route if it's a Workers URL
 * This allows the browser to display profile pictures that require authentication
 * @param profilePictureUrl - Profile picture URL (can be Workers URL or path)
 * @returns Proxy URL if it's a Workers URL, otherwise returns the original URL
 */
export function getProfilePictureProxyUrl(profilePictureUrl: string): string {
  if (!profilePictureUrl) {
    return "";
  }
  
  // If it's already a proxy URL, return as is
  if (profilePictureUrl.startsWith("/proxy/profile-picture/")) {
    return profilePictureUrl;
  }
  
  // If it's a Workers URL, convert to proxy URL
  if (profilePictureUrl.includes(WORKERS_BASE_URL)) {
    // Extract the path after the base URL
    const url = new URL(profilePictureUrl);
    const path = url.pathname.replace(/^\//, "");
    
    // Preserve query parameters (for cache busting)
    const queryString = url.search;
    return `/proxy/profile-picture/${path}${queryString}`;
  }
  
  // If it's a path (not a full URL), use it directly with proxy
  if (!profilePictureUrl.startsWith("http://") && !profilePictureUrl.startsWith("https://")) {
    // Remove leading slash if present
    const cleanPath = profilePictureUrl.replace(/^\//, "");
    // Check if there are query parameters in the path
    const [pathPart, queryPart] = cleanPath.split("?");
    const queryString = queryPart ? `?${queryPart}` : "";
    return `/proxy/profile-picture/${pathPart}${queryString}`;
  }
  
  // For other URLs (not Workers), return as is
  return profilePictureUrl;
}

// Check if user is a creator
// Handles both 'role' field and legacy 'is_creator' field
export function isCreator(user: any): boolean {
  if (!user) return false;
  return user.role === "creator" || user.is_creator === true;
}
