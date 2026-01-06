import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { WORKERS_BASE_URL, getWorkersApiKey } from '@/lib/storage'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get a color for avatar background based on name/username
export function getColorFromName(name: string): string {
  if (!name) return '#F97316'; // Fallback orange
  
  const colors = [
    '#F97316', // Orange
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#06B6D4', // Cyan
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
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
 * @deprecated Use getProfilePictureProxyUrl instead. 
 * Fetches a profile picture from Workers with authentication and returns a blob URL.
 * WARNING: This causes memory leaks if the returned Object URL is not revoked.
 */
export async function fetchProfilePictureWithAuth(profilePictureUrl: string): Promise<string> {
  console.warn("[utils] fetchProfilePictureWithAuth is deprecated and causes memory leaks. Use getProfilePictureProxyUrl instead.");
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
    return profilePictureUrl;
  }

  try {
    const separator = profilePictureUrl.includes("?") ? "&" : "?";
    const freshUrl = `${profilePictureUrl}${separator}_fresh=${Date.now()}`;
    
    const response = await fetch(freshUrl, {
      headers: { 'x-api-key': apiKey },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile picture: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("[utils] Error fetching profile picture with auth:", error);
    throw error;
  }
}

/**
 * Converts a Workers URL to use the proxy route.
 * This allows the browser to display images that require authentication
 * using native <img> tags, which avoids memory leaks and enables caching.
 * @param url - The original Workers URL or path
 * @param type - The type of image ('image' for general/cached, 'profile-picture' for no-cache)
 * @returns Proxy URL if it's a Workers URL, otherwise returns the original URL
 */
export function getImageProxyUrl(url: string, type: 'image' | 'profile-picture' = 'image'): string {
  if (!url) return "";
  
  // If it's already a proxy URL, return as is
  if (url.startsWith("/proxy/")) return url;
  
  const proxyPrefix = `/proxy/${type}/`;
  
  // If it's a Workers URL, convert to proxy URL
  if (url.includes(WORKERS_BASE_URL)) {
    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname.replace(/^\//, "");
      const queryString = parsedUrl.search;
      return `${proxyPrefix}${path}${queryString}`;
    } catch (e) {
      // Fallback for relative paths or malformed URLs
      const path = url.replace(WORKERS_BASE_URL, "").replace(/^\//, "");
      return `${proxyPrefix}${path}`;
    }
  }
  
  // If it's a path (not a full URL), use it with proxy
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    const cleanPath = url.replace(/^\//, "");
    return `${proxyPrefix}${cleanPath}`;
  }
  
  return url;
}

/**
 * Converts a profile picture URL to use the proxy route if it's a Workers URL
 * @param profilePictureUrl - Profile picture URL
 * @returns Proxy URL if it's a Workers URL, otherwise returns the original URL
 */
export function getProfilePictureProxyUrl(profilePictureUrl: string): string {
  return getImageProxyUrl(profilePictureUrl, 'profile-picture');
}

// Check if user is a creator
// Handles both 'role' field and legacy 'is_creator' field
export function isCreator(user: any): boolean {
  if (!user) return false;
  return user.role === "creator" || user.is_creator === true;
}
