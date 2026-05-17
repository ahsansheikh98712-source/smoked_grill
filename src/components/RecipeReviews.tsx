'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star, ThumbsUp, MessageCircle, Edit2, Trash2 } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpful: number;
  modifications?: string;
  wouldMakeAgain: boolean;
}

interface RecipeReviewsProps {
  recipeId: string;
  existingReviews?: Review[];
}

export default function RecipeReviews({ recipeId, existingReviews = [] }: RecipeReviewsProps) {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<Review[]>(existingReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    comment: '',
    modifications: '',
    wouldMakeAgain: true
  });


  const handleRatingClick = (rating: number) => {
    setNewReview(prev => ({ ...prev, rating }));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      alert('Please sign in to leave a review');
      return;
    }

    if (newReview.rating === 0) {
      alert('Please select a star rating');
      return;
    }

    if (!newReview.comment.trim()) {
      alert('Please write a comment');
      return;
    }

    if (editingReview) {
      // Update existing review
      const updatedReviews = reviews.map(review => 
        review.id === editingReview 
          ? {
              ...review,
              rating: newReview.rating,
              title: newReview.title || '',
              comment: newReview.comment,
              modifications: newReview.modifications || undefined,
              wouldMakeAgain: newReview.wouldMakeAgain
            }
          : review
      );
      setReviews(updatedReviews);
      
      // Save to localStorage
      const storageKey = `reviews_${recipeId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedReviews));
      
      alert('Review updated successfully!');
    } else {
      // Create new review
      const review: Review = {
        id: Date.now().toString(),
        author: (session?.user as any)?.username || session?.user?.name || 'Anonymous',
        rating: newReview.rating,
        title: newReview.title || '',
        comment: newReview.comment,
        date: new Date().toISOString(),
        helpful: 0,
        modifications: newReview.modifications || undefined,
        wouldMakeAgain: newReview.wouldMakeAgain
      };

      // Add new review to the top of the list
      const updatedReviews = [review, ...reviews];
      setReviews(updatedReviews);
      
      // Save to localStorage for persistence across page reloads
      const storageKey = `reviews_${recipeId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedReviews));

      alert('Thank you for your review!');
    }

    // Reset form
    setNewReview({
      rating: 0,
      title: '',
      comment: '',
      modifications: '',
      wouldMakeAgain: true
    });
    setShowReviewForm(false);
    setEditingReview(null);
  };

  const handleEditReview = (review: Review) => {
    setNewReview({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment,
      modifications: review.modifications || '',
      wouldMakeAgain: review.wouldMakeAgain
    });
    setEditingReview(review.id);
    setShowReviewForm(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      const updatedReviews = reviews.filter(review => review.id !== reviewId);
      setReviews(updatedReviews);
      
      // Save to localStorage
      const storageKey = `reviews_${recipeId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedReviews));
      
      alert('Review deleted successfully!');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Reviews Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h2>
          <div className="flex items-center mt-2">
            <div className="flex items-center mr-4">
              <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
              <span className="text-lg font-semibold">{averageRating}</span>
              <span className="text-gray-500 ml-2">({reviews.length} reviews)</span>
            </div>
          </div>
        </div>
        
        {status === 'authenticated' && session?.user && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Write Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-orange-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingReview ? 'Edit Your Review' : 'Write Your Review'}
          </h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating *
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className={`h-8 w-8 transition-colors hover:scale-110 ${
                      star <= newReview.rating
                        ? 'text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  >
                    <Star className={`h-full w-full ${
                      star <= newReview.rating ? 'fill-current' : ''
                    }`} />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {newReview.rating > 0 ? `${newReview.rating} stars` : 'Select rating'}
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your experience (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Tell others about your experience with this recipe..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Modifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Did you make any modifications?
              </label>
              <textarea
                value={newReview.modifications}
                onChange={(e) => setNewReview(prev => ({ ...prev, modifications: e.target.value }))}
                placeholder="Share any changes you made to the recipe (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Would Make Again */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newReview.wouldMakeAgain}
                  onChange={(e) => setNewReview(prev => ({ ...prev, wouldMakeAgain: e.target.checked }))}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">I would make this recipe again</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium"
              >
                {editingReview ? 'Update Review' : 'Post Review'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setEditingReview(null);
                  setNewReview({ rating: 0, title: '', comment: '', modifications: '', wouldMakeAgain: true });
                }}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sign-in prompt for non-authenticated users */}
      {status === 'unauthenticated' && !showReviewForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-600 mb-3">Want to share your experience with this recipe?</p>
          <a
            href="/auth/signin"
            className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Sign In to Write Review
          </a>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-semibold text-orange-800">
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{review.author}</div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {formatDate(review.date)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Edit/Delete buttons for review author */}
                {currentUser && currentUser.username === review.author && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditReview(review)}
                      className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                      title="Edit review"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Review Content */}
              {review.title && (
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
              )}
              
              <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>

              {/* Modifications */}
              {review.modifications && (
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <h5 className="font-medium text-blue-900 mb-1">Recipe Modifications:</h5>
                  <p className="text-blue-800 text-sm">{review.modifications}</p>
                </div>
              )}

              {/* Would Make Again Badge */}
              {review.wouldMakeAgain && (
                <div className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Would make again
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-500 mb-4">Be the first to review this recipe!</p>
            {currentUser && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
              >
                Write First Review
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}