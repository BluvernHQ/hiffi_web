'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  cn,
  getAvatarLetter,
  getColorFromName,
  getDisplayName,
} from '@/lib/utils';
import {
  formatCompactCount,
  getProfileFollowerCount,
  shouldShowPublicFollowerCount,
} from '@/lib/video-utils';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface SearchCreatorCardProps {
  user: Record<string, unknown>;
  avatarSrc?: string;
  className?: string;
  /** Stretch to fill a grid column (responsive row layout) */
  fill?: boolean;
  initialFollowing?: boolean;
  isAuthenticated?: boolean;
  currentUsername?: string | null;
  onRequestAuth?: (username: string, displayName: string) => void;
  onFollowingChange?: (username: string, following: boolean) => void;
}

export function SearchCreatorCard({
  user,
  avatarSrc,
  className,
  fill = false,
  initialFollowing = false,
  isAuthenticated = false,
  currentUsername = null,
  onRequestAuth,
  onFollowingChange,
}: SearchCreatorCardProps) {
  const displayName = getDisplayName(user);
  const username = String(user.username ?? '');
  const followerCount = getProfileFollowerCount(user);
  const showFollowers = shouldShowPublicFollowerCount(followerCount);
  const isVerified = user.role === 'creator' || user.verified === true;
  const isOwnProfile = Boolean(currentUsername && username === currentUsername);

  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isFollowingAction, setIsFollowingAction] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  if (!username) return null;

  const handleFollow = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      onRequestAuth?.(username, displayName);
      return;
    }

    if (isFollowingAction || isOwnProfile) return;

    const previousFollowing = isFollowing;

    try {
      setIsFollowingAction(true);
      setIsFollowing(!previousFollowing);

      const response = previousFollowing
        ? await apiClient.unfollowUser(username)
        : await apiClient.followUser(username);

      if (!response.success) {
        throw new Error('Follow action failed');
      }

      onFollowingChange?.(username, !previousFollowing);
    } catch {
      setIsFollowing(previousFollowing);
      toast({
        title: 'Error',
        description: 'Could not update follow status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsFollowingAction(false);
    }
  };

  return (
    <div
      className={cn(
        'flex h-auto w-full items-center justify-between gap-3 rounded-[12px] border border-border bg-card p-4 transition-colors hover:border-primary/25',
        fill ? 'max-w-none' : 'max-w-[394.66px]',
        className,
      )}
    >
      <Link
        href={`/profile/${username}`}
        className="group flex min-w-0 items-center gap-3"
      >
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarImage src={avatarSrc} alt={displayName} />
          <AvatarFallback
            className="text-sm"
            style={{ backgroundColor: getColorFromName(displayName) }}
          >
            {getAvatarLetter(user)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1">
            <h3 className="truncate text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
              {displayName}
            </h3>
            {isVerified ? (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#E8192C]" aria-label="Verified creator" />
            ) : null}
          </div>
          <p className="truncate text-xs leading-tight text-muted-foreground">@{username}</p>
          {showFollowers ? (
            <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
              {formatCompactCount(followerCount)} followers
            </p>
          ) : null}
        </div>
      </Link>

      {!isOwnProfile ? (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Button
            type="button"
            size="sm"
            variant={isFollowing ? 'secondary' : 'default'}
            className="h-8 min-w-[5.25rem] rounded-md px-4 text-xs font-medium"
            onClick={handleFollow}
            disabled={isFollowingAction}
          >
            {isFollowingAction ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isFollowing ? (
              'Following'
            ) : (
              'Follow'
            )}
          </Button>
          <Link
            href={`/profile/${username}`}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Profile
          </Link>
        </div>
      ) : (
        <Link
          href={`/profile/${username}`}
          className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Profile
        </Link>
      )}
    </div>
  );
}
