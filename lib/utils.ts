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
export function getProfilePictureUrl(user: any): string {
  if (!user) return "";
  
  // Check profile_picture first (API field name)
  if (user.profile_picture && user.profile_picture.trim()) {
    return user.profile_picture;
  }
  
  // Fall back to other common field names
  return (
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
}

// Check if user is a creator
// Handles both 'role' field and legacy 'is_creator' field
export function isCreator(user: any): boolean {
  if (!user) return false;
  return user.role === "creator" || user.is_creator === true;
}
