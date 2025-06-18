import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

const Reviews = ({ mealKitId }) => {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [showReviewPanel, setShowReviewPanel] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
  
    useEffect(() => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      
      if (token) {
        try {
            const decoded = jwtDecode(token);
          setCurrentUserId(decoded.id);
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }
      
      if (mealKitId) {
        fetchReviews();
      }
    }, [mealKitId]);
    
    // Check if user has already reviewed after reviews are loaded
    useEffect(() => {
      if (reviews.length && currentUserId) {
        const userReview = reviews.find(review => 
          review.author && review.author._id === currentUserId
        );
        setHasReviewed(!!userReview);
      }
    }, [reviews, currentUserId]);

    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3000/api/review/meal-kit/${mealKitId}`);
        const data = await response.json();
        
        if (data.success) {
          setReviews(data.reviews || []);
        } else {
          console.error('Error fetching reviews:', data.message);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleLeaveReviewClick = () => {
      if (!isLoggedIn) {
        toast.info('Please login to leave a review');
        return;
      }
      setShowReviewPanel(true);
    };

    const handleReviewSubmit = async () => {
        if (!rating) {
          toast.error('Please select a rating');
          return;
        }
        if (!reviewText.trim()) {
          toast.error('Review cannot be empty');
          return;
        }
      
        setIsSubmittingReview(true);
        
        try {
          const response = await fetch('http://localhost:3000/api/review', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              mealKitId,
              rating,
              comment: reviewText
            })
          });
      
          // Even if there's a 500 error, the review might have been saved
          // So let's refresh the reviews list anyway
          
          try {
            const data = await response.json();
            
            if (data.success) {
              toast.success('Review submitted successfully');
            } else {
              // If we got a response but success is false
              console.warn('Server returned an error:', data.message);
              toast.info('Your review might have been submitted. Refreshing...');
            }
          } catch (parseError) {
            // If we can't parse the response, the review might still be saved
            console.warn('Unable to parse server response, but review might be saved');
            toast.info('Your review might have been submitted. Refreshing...');
          }
          
          // Regardless of server response, reset form and refresh reviews
          setShowReviewPanel(false);
          setRating(5);
          setReviewText('');
          setHasReviewed(true);
          fetchReviews(); // Refresh to see if the review was actually saved
          
        } catch (error) {
          console.error('Error submitting review:', error);
          toast.error('Error submitting review');
          
          // Still try to refresh reviews in case it was actually saved
          fetchReviews();
        } finally {
          setIsSubmittingReview(false);
        }
      };

    const handleDeleteReview = async (reviewId) => {
      if (!window.confirm('Are you sure you want to delete this review?')) return;

      try {
        const response = await fetch(`http://localhost:3000/api/review/${reviewId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
          toast.success('Review deleted successfully');
          setHasReviewed(false);
          fetchReviews();
        } else {
          toast.error(data.message || 'Failed to delete review');
        }
      } catch (error) {
        console.error('Error deleting review:', error);
        toast.error('Failed to delete review');
      }
    };

    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      );
    }

    return (
      <div className="mt-6">
         <h2 className="text-lg font-semibold mb-2">Reviews ({reviews.length})</h2>
        {/* <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Reviews ({reviews.length})</h2>
          {isLoggedIn && !hasReviewed && (
            <button
              onClick={handleLeaveReviewClick}
              className="px-4 py-2 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
            >
              <i className="fa-solid fa-star"></i> Leave a Review
            </button>
          )}
        </div> */}

        {showReviewPanel && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
            <h3 className="text-md font-medium mb-3">Write Your Review</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating:</label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl bg-white mr-1 text-yellow-400"
                  >
                    {star <= rating ? <i className="fa-solid fa-star"></i> : <i className="fa-regular fa-star"></i>}
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">{rating} out of 5</span>
              </div>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this meal kit..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex justify-end mt-3 space-x-3">
              <button
                onClick={() => setShowReviewPanel(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={isSubmittingReview}
                className="px-4 py-2 text-white rounded hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingReview ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </div>
        )}

        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review._id} className="bg-gray-50 p-4 rounded-lg shadow-sm mb-4">
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                    <i className={i < review.rating ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
                  </span>
                ))}
              </div>
              <p className="text-gray-700 text-base">{review.comment}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-gray-600 text-sm">- {review.author?.name || 'Anonymous'}</p>
                {isLoggedIn && review.author && review.author._id === currentUserId && (
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    className="text-red-600 bg-white hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
              {review.adminReply && (
                <div className="mt-3 pl-4 border-l-4 border-blue-200">
                  <p className="text-blue-600 font-medium">Admin Response:</p>
                  <p className="text-gray-700">{review.adminReply}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-600 text-base">No reviews yet. {isLoggedIn && !hasReviewed && "Be the first to review!"}</p>
        )}
      </div>
    );
};

export default Reviews;