import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

// Star Rating Component
const StarRating = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        
        return (
          <button
            type="button"
            key={index}
            className={`text-2xl bg-white focus:outline-none ${
              ratingValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => setRating(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
          >
            ★
          </button>
        );
      })}
      <span className="ml-2 text-sm bg-white text-gray-600">
        {rating > 0 ? `${rating}/5` : 'Select rating'}
      </span>
    </div>
  );
};

const LeaveReview = ({ 
  mealKitId, 
  currentReview, 
  onReviewSubmit, 
  isModal = false,
  isEditMode = false 
}) => {
  const [rating, setRating] = useState(currentReview?.rating || 0);
  const [comment, setComment] = useState(currentReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update form when currentReview changes
  useEffect(() => {
    if (currentReview) {
      setRating(currentReview.rating || 0);
      setComment(currentReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [currentReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (rating < 1) {
        throw new Error('Please select a rating');
      }

      const endpoint = isEditMode 
        ? `http://localhost:3000/api/review/${currentReview._id}`
        : 'http://localhost:3000/api/review';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mealKitId,
          rating,
          comment,
          ...(isEditMode && { userId: currentReview.author._id })
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      toast.success(isEditMode ? 'Review updated successfully!' : 'Review submitted successfully!');
      onReviewSubmit();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={isModal ? '' : 'mt-4'}>
      {/* Rating input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating
        </label>
        <StarRating className= 'bg-white' rating={rating} setRating={setRating} />
      </div>

      {/* Comment input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          rows="4"
          placeholder="Share your experience with this meal kit..."
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          rating === 0 ? 'bg-gray-400' : ' hover:bg-green-700'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          isEditMode ? 'Update Review' : 'Submit Review'
        )}
      </button>
    </form>
  );
};

export default LeaveReview;