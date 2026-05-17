'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Clock, User, Tag, AlertCircle } from 'lucide-react';
import { FollowButton } from '@/components/FollowButton';

interface Post {
  id: string;
  title: string;
  content?: string;
  problem?: string;
  details?: string;
  category: string;
  tags: string[];
  author: { id: string; username: string; image?: string | null };
  createdAt: string;
  votes: number;
  replies: number;
  type: 'DISCUSSION' | 'QUESTION';
  urgency?: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-100 text-gray-800',
  techniques: 'bg-orange-100 text-orange-800',
  equipment: 'bg-blue-100 text-blue-800',
  recipes: 'bg-green-100 text-green-800',
  competition: 'bg-purple-100 text-purple-800',
  beginners: 'bg-yellow-100 text-yellow-800',
  showoff: 'bg-pink-100 text-pink-800',
  troubleshooting: 'bg-red-100 text-red-800',
};

const URGENCY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-500 text-white',
  HIGH: 'bg-orange-500 text-white',
  NORMAL: 'bg-blue-500 text-white',
  LOW: 'bg-gray-500 text-white',
};

function formatTimeAgo(dateString: string) {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ForumPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?filter=${filter}&sortBy=${sortBy}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleVote = async (postId: string, direction: 'up' | 'down') => {
    if (!session?.user) {
      alert('Please sign in to vote');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      if (res.ok) {
        const data = await res.json();
        setPosts(prev =>
          prev.map(p => (p.id === postId ? { ...p, votes: data.votes } : p))
        );
        setUserVotes(prev => ({
          ...prev,
          [postId]: data.userVote ?? 0,
        }));
      }
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/community" className="flex items-center text-gray-600 hover:text-orange-600 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Link>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Community Forum</h1>
              <p className="text-gray-600 mt-1">{posts.length} discussions and questions</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/community/create-post"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
              >
                Share Your BBQ
              </Link>
              <Link
                href="/community/ask-question"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Ask for Help
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-2">
              {['all', 'questions', 'discussions', 'techniques', 'equipment', 'beginners'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                    filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All Posts' : f}
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-wrap gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <Link
                      href={`/profile/${post.author.username}`}
                      className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      @{post.author.username}
                    </Link>
                    <FollowButton userId={post.author.id} size="sm" />
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {post.urgency && post.type === 'QUESTION' && (
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${URGENCY_COLORS[post.urgency] || 'bg-gray-500 text-white'}`}>
                        {post.urgency}
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-800'}`}>
                      {post.category}
                    </span>
                    {post.type === 'QUESTION' && <AlertCircle className="w-4 h-4 text-blue-500" />}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                <div className="text-gray-600 text-sm mb-4">
                  {post.type === 'QUESTION' ? (
                    <>
                      {post.problem && <p className="mb-1 font-medium">Problem: {post.problem}</p>}
                      {post.details && <p className="line-clamp-2">{post.details}</p>}
                    </>
                  ) : (
                    post.content && <p className="line-clamp-2">{post.content}</p>
                  )}
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleVote(post.id, 'up')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                          userVotes[post.id] === 1 ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">{post.votes}</span>
                      </button>
                      <button
                        onClick={() => handleVote(post.id, 'down')}
                        className={`p-1 rounded transition-colors ${
                          userVotes[post.id] === -1 ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">
                        {post.replies} {post.type === 'QUESTION' ? 'answers' : 'replies'}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/community/forum/${post.id}`}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-4">Be the first to start a discussion or ask a question!</p>
            <Link href="/community/create-post" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium">
              Create First Post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
