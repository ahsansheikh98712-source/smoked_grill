'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Star, MessageCircle, Trash2 } from 'lucide-react';

interface DBReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { username: string; email: string; image?: string | null };
}

interface RecipeReviewsProps {
  recipeId: string;
  existingReviews?: any[];
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      {value > 0 && <span className="ml-2 text-sm text-gray-600">{value} star{value !== 1 ? 's' : ''}</span>}
    </div>
  );
}

function Avatar({ username, image }: { username: string; image?: string | null }) {
  if (image) return <img src={image} alt={username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />;
  return (
    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {username[0].toUpperCase()}
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function RecipeReviews({ recipeId }: RecipeReviewsProps) {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<DBReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/ratings?recipeId=${recipeId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
      }
    } catch {}
    setLoading(false);
  }, [recipeId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating'); return; }
    if (!comment.trim()) { setError('Please write a comment'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, rating, comment: comment.trim() }),
      });
      if (res.ok) {
        setRating(0);
        setComment('');
        setShowForm(false);
        await fetchReviews();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to submit review');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h2>
          <div className="flex items-center mt-2 gap-2">
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
            <span className="text-lg font-semibold">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</span>
            <span className="text-gray-500">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
          </div>
        </div>
        {status === 'authenticated' && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm font-medium"
          >
            <MessageCircle className="h-4 w-4" />
            Write Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && status === 'authenticated' && (
        <div className="bg-orange-50 rounded-lg p-6 mb-6 border border-orange-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review *</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your experience with this recipe..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium text-sm disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Review'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setRating(0); setComment(''); setError(''); }}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sign-in prompt */}
      {status === 'unauthenticated' && !showForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-600 mb-3">Want to share your experience?</p>
          <a href="/auth/signin" className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium">
            Sign In to Write Review
          </a>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-16 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="flex items-start gap-3">
                <Avatar username={review.user.username} image={review.user.image} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{review.user.username}</span>
                    <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews yet</h3>
          <p className="text-gray-500 text-sm mb-4">Be the first to review this recipe!</p>
          {status === 'authenticated' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium"
            >
              Write First Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}
