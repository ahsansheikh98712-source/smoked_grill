'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { MessageCircle, Send, Trash2, Reply, ChevronDown, ChevronUp, Image, X } from 'lucide-react';

interface CommentUser {
  id: string;
  username: string;
  image?: string | null;
}

interface Comment {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  user: CommentUser;
  replies: Comment[];
}

interface RecipeCommentsProps {
  recipeId: string;
}

function formatTimeAgo(dateString: string) {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ username, image }: { username: string; image?: string | null }) {
  if (image) {
    return <img src={image} alt={username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {username[0].toUpperCase()}
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onReply,
  depth = 0,
}: {
  comment: Comment;
  currentUserId?: string;
  onDelete: (id: string) => void;
  onReply: (parentId: string, username: string) => void;
  depth?: number;
}) {
  const [showReplies, setShowReplies] = useState(true);
  const replies = comment.replies ?? [];

  return (
    <div className={depth > 0 ? 'ml-8 mt-3 border-l-2 border-orange-100 pl-4' : ''}>
      <div className="flex items-start gap-3">
        <Link href={`/profile/${comment.user.username}`}>
          <Avatar username={comment.user.username} image={comment.user.image} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <Link href={`/profile/${comment.user.username}`} className="font-semibold text-sm text-gray-900 hover:text-orange-600 transition-colors">{comment.user.username}</Link>
              <span className="text-xs text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
            {comment.imageUrl && (
              <div className="mt-2">
                <img
                  src={comment.imageUrl}
                  alt="Comment attachment"
                  className="max-h-64 rounded-lg object-cover cursor-pointer"
                  onClick={() => window.open(comment.imageUrl!, '_blank')}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 px-1">
            {depth === 0 && (
              <button
                onClick={() => onReply(comment.id, comment.user.username)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 transition-colors"
              >
                <Reply className="w-3 h-3" />
                Reply
              </button>
            )}
            {currentUserId === comment.user.id && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 transition-colors ml-auto"
              >
                {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showReplies && replies.length > 0 && (
        <div className="space-y-3">
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecipeComments({ recipeId }: RecipeCommentsProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch {}
    finally { setLoading(false); }
  }, [recipeId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId: replyTo?.id ?? null,
          imageUrl: imagePreview ?? null,
        }),
      });

      if (res.ok) {
        setNewComment('');
        setReplyTo(null);
        setImagePreview(null);
        if (fileRef.current) fileRef.current.value = '';
        await fetchComments();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to post comment');
      }
    } catch {
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      const res = await fetch(`/api/recipes/${recipeId}/comments?commentId=${commentId}`, { method: 'DELETE' });
      if (res.ok) await fetchComments();
    } catch {
      alert('Failed to delete comment');
    }
  };

  const handleReply = (parentId: string, username: string) => {
    setReplyTo({ id: parentId, username });
    setNewComment(`@${username} `);
    document.getElementById('comment-input')?.focus();
  };

  const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5 text-orange-600" />
        <h2 className="text-xl font-bold text-gray-900">
          Comments {totalCount > 0 && <span className="text-gray-500 font-normal text-base">({totalCount})</span>}
        </h2>
      </div>

      {/* Comment Form */}
      {status === 'loading' ? (
        <div className="mb-8 h-24 bg-gray-50 rounded-lg animate-pulse" />
      ) : status === 'authenticated' && session?.user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
              <Reply className="w-4 h-4" />
              Replying to <span className="font-semibold">{replyTo.username}</span>
              <button
                type="button"
                onClick={() => { setReplyTo(null); setNewComment(''); }}
                className="ml-auto text-gray-400 hover:text-gray-600 text-xs"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Avatar username={session.user.name || session.user.email || 'U'} />
            <div className="flex-1">
              <textarea
                id="comment-input"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share a tip, ask a question, or leave feedback..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
              />
              {imagePreview && (
                <div className="relative mt-2 inline-block">
                  <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-orange-50"
                >
                  <Image className="w-4 h-4" />
                  Add photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : status === 'unauthenticated' ? (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-600 text-sm mb-2">Sign in to join the conversation</p>
          <a href="/auth/signin" className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium">
            Sign In to Comment
          </a>
        </div>
      ) : null}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1"><div className="h-16 bg-gray-100 rounded-lg" /></div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={session?.user?.id as string | undefined}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
}
