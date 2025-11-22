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
