import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
  if (!user) return "";
  
  // Check profile_picture first (API field name)
  if (user.profile_picture && user.profile_picture.trim()) {
    const profilePicturePath = user.profile_picture.trim();
    
    // If it's already a full URL (starts with http:// or https://), add cache busting if needed
    if (profilePicturePath.startsWith("http://") || profilePicturePath.startsWith("https://")) {
      if (useCacheBusting && user.updated_at) {
        // Add cache busting parameter using updated_at timestamp
        const separator = profilePicturePath.includes("?") ? "&" : "?";
        return `${profilePicturePath}${separator}t=${new Date(user.updated_at).getTime()}`;
      }
      return profilePicturePath;
    }
    
    // If it's a path (like "ProfileProto/users/..."), route through proxy with API key
    // Proxy route: /proxy/profile-picture/[...path]
    let url = `/proxy/profile-picture/${profilePicturePath}`;
    
    // Add cache busting parameter if updated_at is available
    if (useCacheBusting && user.updated_at) {
      url += `?t=${new Date(user.updated_at).getTime()}`;
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

// Check if user is a creator
// Handles both 'role' field and legacy 'is_creator' field
export function isCreator(user: any): boolean {
  if (!user) return false;
  return user.role === "creator" || user.is_creator === true;
}
