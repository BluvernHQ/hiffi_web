"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { getColorFromName, getAvatarLetter, getProfilePictureUrl } from "@/lib/utils"

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

export function CommentSection({ videoId }: { videoId: string }) {
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [videoId])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getComments(videoId, 1, 20)
      if (response.success) {
      setComments(response.comments || [])
        // Check if there are more comments based on count and current offset
        const totalLoaded = response.offset + response.comments.length
        setHasMore(totalLoaded < response.count)
        setPage(1)
      } else {
        setComments([])
        setHasMore(false)
      }
    } catch (error) {
      console.error("[hiffi] Failed to fetch comments:", error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      })
      setComments([])
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
      setComments([...comments, ...(response.comments || [])])
      setPage(nextPage)
        // Check if there are more comments based on count and current offset
        const totalLoaded = response.offset + response.comments.length
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold">Comments</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">{comments.length} Comments</h3>

      {user ? (
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getProfilePictureUrl(userData)} />
            <AvatarFallback 
              className="text-white font-semibold"
              style={{ backgroundColor: getColorFromName((userData?.name || userData?.username || "U")) }}
            >
              {getAvatarLetter(userData, "U")}
            </AvatarFallback>
          </Avatar>
          <form onSubmit={handleSubmit} className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!newComment.trim() || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Comment"
                )}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="text-muted-foreground mb-2">Sign in to leave a comment</p>
          <Button asChild variant="outline">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem 
            key={comment.comment_id} 
            comment={comment}
            onReplyAdded={fetchComments}
          />
        ))}

        {hasMore && comments.length > 0 && (
          <Button onClick={loadMoreComments} variant="outline" className="w-full bg-transparent">
            Load More Comments
          </Button>
        )}

        {comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No comments yet. Be the first to comment!</div>
        )}
      </div>
    </div>
  )
}

function CommentItem({ comment, onReplyAdded }: { comment: Comment; onReplyAdded?: () => void }) {
  const { toast } = useToast()
  const { user, userData } = useAuth()
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<Reply[]>([])
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  const fetchReplies = async () => {
    try {
      setIsLoadingReplies(true)
      const response = await apiClient.getReplies(comment.comment_id, 1, 50)
      if (response.success) {
      setReplies(response.replies || [])
      setShowReplies(true)
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

  return (
    <div className="flex gap-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={getProfilePictureUrl(comment)} />
        <AvatarFallback 
          className="text-white font-semibold"
          style={{ 
            backgroundColor: getColorFromName(
              ((comment as any).comment_by_name || comment.comment_by_username || "U")
            ) 
          }}
        >
          {getAvatarLetter({ 
            name: (comment as any).comment_by_name, 
            username: comment.comment_by_username 
          }, "U")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {user ? (
            <Link href={`/profile/${comment.comment_by_username}`} className="font-semibold text-sm hover:text-primary">
              @{comment.comment_by_username}
            </Link>
          ) : (
            <span className="font-semibold text-sm">@{comment.comment_by_username}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.commented_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm">{comment.comment}</p>
        <div className="flex items-center gap-4 pt-1">
          <button
            className="text-xs text-muted-foreground hover:text-foreground font-medium"
            onClick={() => {
              if (user) {
                setShowReplyInput(!showReplyInput)
              } else {
                toast({
                  title: "Sign in required",
                  description: "Please sign in to reply to comments",
                })
              }
            }}
          >
            Reply
          </button>
        </div>

        {showReplyInput && user && (
          <form onSubmit={handleReplySubmit} className="mt-2 space-y-2">
            <div className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getProfilePictureUrl(userData)} />
                <AvatarFallback 
                  className="text-white font-semibold text-sm"
                  style={{ backgroundColor: getColorFromName((userData?.name || userData?.username || "U")) }}
                >
                  {getAvatarLetter(userData, "U")}
                </AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[60px] text-sm"
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
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getProfilePictureUrl(reply)} />
                      <AvatarFallback 
                        className="text-white font-semibold text-sm"
                        style={{ 
                          backgroundColor: getColorFromName(
                            ((reply as any).reply_by_name || reply.reply_by_username || "U")
                          ) 
                        }}
                      >
                        {getAvatarLetter({ 
                          name: (reply as any).reply_by_name, 
                          username: reply.reply_by_username 
                        }, "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs">@{reply.reply_by_username || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.replied_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs">{reply.reply}</p>
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
    </div>
  )
}
