"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDistanceToNow } from "date-fns"
import { ArrowRight, Loader2, Trash2, AlertTriangle, Flag, SendHorizontal, MessageSquare, User } from "lucide-react"
import { ContentReportDialog } from "@/components/report/content-report-dialog"
import { buildCommentReportMetadata } from "@/lib/report/build-metadata"
import { canReportContentTarget } from "@/lib/report/ownership"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { captureVideoCommented } from "@/lib/analytics/journey-tracking"
import { useToast } from "@/hooks/use-toast"
import { usePathname, useSearchParams } from "next/navigation"
import { buildLoginUrl, buildSignupUrl } from "@/lib/auth-utils"
import { isConnectivityError, userFacingNetworkMessage } from "@/lib/network-errors"
import { useCallback, useRef } from "react"

interface Comment {
  comment_id: string
  commented_by: string
  comment_by_username: string
  commented_to: string
  commented_at: string
  comment: string
  total_replies: number
}

interface Reply {
  reply_id: string
  replied_by: string
  reply_by_username?: string
  replied_to: string
  replied_at: string
  reply: string
}

export function CommentSection({
  videoId,
  autoFocusInput = false,
}: {
  videoId: string
  autoFocusInput?: boolean
}) {
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : undefined
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({})
  const pendingFetches = useRef<Set<string>>(new Set())
  const commentFormRef = useRef<HTMLFormElement>(null)
  const [newComment, setNewComment] = useState("")
  const [guestPromptOpen, setGuestPromptOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchComments()
    setGuestPromptOpen(false)
  }, [videoId])

  useEffect(() => {
    if (!autoFocusInput || !user) return

    const timer = window.setTimeout(() => {
      const input = commentFormRef.current?.querySelector("textarea")
      if (!input) return
      input.focus()
      input.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [autoFocusInput, user])

  const fetchUserProfiles = useCallback(async (usernames: string[]) => {
    const toFetch = usernames.filter(u => 
      u && 
      !userProfiles[u] && 
      !pendingFetches.current.has(u)
    )
    
    if (toFetch.length === 0) return

    toFetch.forEach(u => pendingFetches.current.add(u))

    await Promise.all(
      toFetch.map(async (username) => {
        try {
          const response = await apiClient.getUserByUsername(username)
          if (response.success && response.user) {
            setUserProfiles(prev => ({
              ...prev,
              [username]: response.user
            }))
          }
        } catch (error) {
          console.error(`[hiffi] Failed to fetch profile for ${username}:`, error)
        } finally {
          pendingFetches.current.delete(username)
        }
      })
    )
  }, [userProfiles])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getComments(videoId, 1, 20)
      if (response.success) {
        const fetchedComments = response.comments || []
        setComments(fetchedComments)
        
        // Fetch profiles for commenters
        const usernames = fetchedComments.map(c => c.comment_by_username)
        fetchUserProfiles(usernames)

        // Check if there are more comments based on count and current offset
        const totalLoaded = response.offset + fetchedComments.length
        setCommentCount(response.count ?? fetchedComments.length)
        setHasMore(totalLoaded < response.count)
        setPage(1)
      } else {
        setComments([])
        setCommentCount(0)
        setHasMore(false)
      }
    } catch (error) {
      console.error("[hiffi] Failed to fetch comments:", error)
      toast({
        title: isConnectivityError(error) ? "No internet connection" : "Error",
        description: isConnectivityError(error) ? userFacingNetworkMessage() : "Failed to load comments",
        variant: "destructive",
      })
      setComments([])
      setCommentCount(0)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    try {
      setIsSubmitting(true)
      await apiClient.postComment(videoId, newComment.trim())

      captureVideoCommented(videoId)

      toast({
        title: "Success",
        description: "Comment posted successfully",
      })

      setNewComment("")
      // Refresh comments
      await fetchComments()
    } catch (error) {
      console.error("[hiffi] Failed to post comment:", error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadMoreComments = async () => {
    try {
      const nextPage = page + 1
      const response = await apiClient.getComments(videoId, nextPage, 20)
      if (response.success) {
        const newComments = response.comments || []
        setComments([...comments, ...newComments])
        
        // Fetch profiles for new commenters
        const usernames = newComments.map(c => c.comment_by_username)
        fetchUserProfiles(usernames)

        setPage(nextPage)
        // Check if there are more comments based on count and current offset
        const totalLoaded = response.offset + newComments.length
        setHasMore(totalLoaded < response.count)
      }
    } catch (error) {
      console.error("[hiffi] Failed to load more comments:", error)
      toast({
        title: "Error",
        description: "Failed to load more comments",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-w-0 max-w-full">
      <h2 className="mb-3 text-base font-bold tracking-tight sm:text-lg">
        {!isLoading && commentCount > 0
          ? `${commentCount.toLocaleString()} Comments`
          : "Comments"}
      </h2>

      {user ? (
        <div className="flex min-w-0 items-center gap-3">
          <ProfilePicture user={userData} size="sm" />
          <form ref={commentFormRef} onSubmit={handleSubmit} className="min-w-0 flex-1">
            <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-muted/20 px-3 py-2 transition-colors focus-within:border-border focus-within:bg-background">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={1}
                className="min-h-[24px] max-h-28 min-w-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    e.currentTarget.form?.requestSubmit()
                  }
                }}
              />
              {(newComment.trim() || isSubmitting) && (
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
                  disabled={!newComment.trim() || isSubmitting}
                  aria-label="Post comment"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-hidden
            >
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "rounded-2xl border border-border/50 bg-muted/20 px-3 py-2 transition-colors",
                  guestPromptOpen && "border-border bg-background",
                )}
              >
                <Textarea
                  readOnly
                  placeholder="Add a comment..."
                  rows={1}
                  aria-label="Add a comment"
                  onFocus={() => setGuestPromptOpen(true)}
                  onClick={() => setGuestPromptOpen(true)}
                  className="min-h-[24px] max-h-28 min-w-0 flex-1 cursor-text resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>

          {guestPromptOpen && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-border/50 bg-muted/20 pl-11 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="border-l-[3px] border-[#DA291C] px-3.5 py-3 sm:px-4">
                  <p className="text-sm font-semibold leading-snug text-foreground">Got something to say?</p>
                  <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                    Sign up free to drop your take on the track.
                  </p>
                  <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-fit rounded-lg border-foreground/20 bg-background/60 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] hover:bg-background"
                      asChild
                    >
                      <Link
                        href={buildSignupUrl(pathname, searchParamsString)}
                        data-analytics-name="guest-comment-signup-link"
                      >
                        Sign up
                      </Link>
                    </Button>
                    <Link
                      href={buildLoginUrl(pathname, searchParamsString)}
                      data-analytics-name="guest-comment-login-link"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Already have an account?
                      <span className="inline-flex items-center gap-0.5 font-medium text-foreground/85">
                        Log in
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {!isLoading && comments.length > 0 && (
        <div className="mt-5 space-y-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.comment_id}
              comment={comment}
              videoId={videoId}
              userProfiles={userProfiles}
              fetchUserProfiles={fetchUserProfiles}
              onReplyAdded={fetchComments}
              onCommentDeleted={fetchComments}
            />
          ))}

          {hasMore && (
            <Button onClick={loadMoreComments} variant="ghost" size="sm" className="w-full text-muted-foreground">
              Load more
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function CommentItem({ 
  comment,
  videoId,
  userProfiles,
  fetchUserProfiles,
  onReplyAdded,
  onCommentDeleted
}: { 
  comment: Comment;
  videoId: string;
  userProfiles: Record<string, any>;
  fetchUserProfiles: (usernames: string[]) => Promise<void>;
  onReplyAdded?: () => void;
  onCommentDeleted?: () => void;
}) {
  const { toast } = useToast()
  const { user, userData } = useAuth()
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<Reply[]>([])
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)

  // Fetch profile if missing
  const profileLoaded = !!userProfiles[comment.comment_by_username]
  useEffect(() => {
    if (comment.comment_by_username && !profileLoaded) {
      fetchUserProfiles([comment.comment_by_username])
    }
  }, [comment.comment_by_username, profileLoaded, fetchUserProfiles])

  const fetchReplies = async () => {
    try {
      setIsLoadingReplies(true)
      const response = await apiClient.getReplies(comment.comment_id, 1, 50)
      if (response.success) {
        const fetchedReplies = response.replies || []
        setReplies(fetchedReplies)
        setShowReplies(true)

        // Fetch profiles for repliers
        const usernames = fetchedReplies.map(r => r.reply_by_username).filter((u): u is string => !!u)
        fetchUserProfiles(usernames)
      } else {
        setReplies([])
      }
    } catch (error) {
      console.error("[hiffi] Failed to fetch replies:", error)
      toast({
        title: "Error",
        description: "Failed to load replies",
        variant: "destructive",
      })
      setReplies([])
    } finally {
      setIsLoadingReplies(false)
    }
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !user) return

    const replyTextToPost = replyText.trim()
    
    try {
      setIsSubmittingReply(true)
      
      // Optimistically add reply to the list immediately
      const optimisticReply: Reply = {
        reply_id: `temp-${Date.now()}`,
        replied_by: userData?.uid || "",
        reply_by_username: userData?.username || "",
        replied_to: comment.comment_id,
        replied_at: new Date().toISOString(),
        reply: replyTextToPost,
      }
      
      // Ensure replies section is visible before adding optimistic reply
      setShowReplies(true)
      setReplies([...replies, optimisticReply])
      
      setReplyText("")
      setShowReplyInput(false)
      
      // Post reply to API
      await apiClient.postReply(comment.comment_id, replyTextToPost)

      toast({
        title: "Success",
        description: "Reply posted successfully",
      })

      // Refresh replies from API to get the actual reply data
      await fetchReplies()
      
      // Notify parent to refresh comments if callback provided
      if (onReplyAdded) {
        onReplyAdded()
      }
    } catch (error) {
      console.error("[hiffi] Failed to post reply:", error)
      
      // Remove optimistic reply on error
      setReplies(replies.filter(r => !r.reply_id.startsWith('temp-')))
      
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!user) return

    try {
      setIsDeleting(true)
      const response = await apiClient.deleteComment(comment.comment_id)
      
      if (response.success) {
        toast({
          title: "Comment deleted",
          description: "Your comment has been deleted successfully.",
        })
        
        setShowDeleteDialog(false)
        
        // Give the dialog time to close before refreshing comments
        setTimeout(() => {
          // Notify parent to refresh comments
          if (onCommentDeleted) {
            onCommentDeleted()
          }
        }, 300)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[hiffi] Failed to delete comment:", error)
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const reportViewer = user
    ? { uid: user.uid, username: userData?.username ?? user.username }
    : null
  const isOwner = !canReportContentTarget(reportViewer, comment)
  const canReportComment = canReportContentTarget(reportViewer, comment)

  return (
    <div className="flex gap-4">
      <ProfilePicture 
        user={userProfiles[comment.comment_by_username] || {
          username: comment.comment_by_username,
          profile_picture: (comment as any).profile_picture || (comment as any).comment_by_avatar,
          name: (comment as any).comment_by_name
        }} 
        size="md" 
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">
              {userProfiles[comment.comment_by_username]?.name || (comment as any).comment_by_name || comment.comment_by_username}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {user ? (
              <Link href={`/profile/${comment.comment_by_username}`} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                @{comment.comment_by_username}
              </Link>
            ) : (
              <span className="truncate max-w-[150px]">@{comment.comment_by_username}</span>
            )}
            <span className="flex-shrink-0">•</span>
            <span className="flex-shrink-0">
              {formatDistanceToNow(new Date(comment.commented_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <p className="break-words text-sm pt-0.5">{comment.comment}</p>
        <div className="flex items-center gap-4 pt-1">
          <button
            className="text-xs text-muted-foreground hover:text-foreground font-medium"
            onClick={() => {
              if (user) {
                setShowReplyInput(!showReplyInput)
              } else {
                toast({
                  title: "Log in to reply",
                  description: "Log in or sign up to join the conversation.",
                })
              }
            }}
          >
            Reply
          </button>
          {isOwner && (
            <button
              className="text-xs text-muted-foreground hover:text-destructive font-medium flex items-center gap-1"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
          {canReportComment && (
            <button
              type="button"
              data-analytics-name="report-comment"
              className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
              onClick={() => setReportDialogOpen(true)}
            >
              <Flag className="h-3 w-3" />
              Report
            </button>
          )}
        </div>

        {canReportComment && (
          <ContentReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            reportType="comment"
            targetId={comment.comment_id}
            targetType="comment"
            metadata={buildCommentReportMetadata(comment, videoId)}
            contextLabel="Report comment"
          />
        )}

        {showReplyInput && user && (
          <form onSubmit={handleReplySubmit} className="mt-2 space-y-2">
            <div className="flex min-w-0 gap-2">
              <ProfilePicture user={userData} size="sm" />
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[60px] min-w-0 flex-1 text-sm"
                disabled={isSubmittingReply}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReplyInput(false)
                  setReplyText("")
                }}
                disabled={isSubmittingReply}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!replyText.trim() || isSubmittingReply}>
                {isSubmittingReply ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Reply"
                )}
              </Button>
            </div>
          </form>
        )}

        {comment.total_replies > 0 && (
          <div className="mt-2">
            {!showReplies ? (
              <button
                onClick={fetchReplies}
                disabled={isLoadingReplies}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded"
              >
                {isLoadingReplies ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-3 w-3" />
                    {comment.total_replies} {comment.total_replies === 1 ? "reply" : "replies"}
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4 mt-3 pl-4 border-l-2 border-muted">
                {replies.map((reply) => (
                  <div key={reply.reply_id} className="flex gap-3">
                    <ProfilePicture 
                      user={userProfiles[reply.reply_by_username || ""] || {
                        username: reply.reply_by_username,
                        profile_picture: (reply as any).profile_picture || (reply as any).reply_by_avatar,
                        name: (reply as any).reply_by_name
                      }} 
                      size="sm" 
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs truncate">
                          {userProfiles[reply.reply_by_username || ""]?.name || (reply as any).reply_by_name || reply.reply_by_username || "Unknown"}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                          <span className="truncate max-w-[120px]">@{reply.reply_by_username || "unknown"}</span>
                          <span className="flex-shrink-0">•</span>
                          <span className="flex-shrink-0">
                            {formatDistanceToNow(new Date(reply.replied_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <p className="break-words text-xs pt-0.5">{reply.reply}</p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowReplies(false)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  Hide replies
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Delete Comment</DialogTitle>
                <DialogDescription className="mt-1">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this comment? This will permanently remove the comment and all its replies.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteComment}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Comment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
