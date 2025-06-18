import React, { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';

const ReviewAdmin = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Get proper image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return assets.homePage;

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:3000${imagePath}`;
    }

    return assets.homePage;
  };

  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Fetch all reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/review', {
          withCredentials: true
        });

        if (response.data.success) {
          setReviews(response.data.reviews);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err.response?.data?.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Filter and sort reviews
  const getFilteredAndSortedReviews = () => {
    let filteredReviews = [...reviews];

    // Apply filters
    if (filterStatus === 'replied') {
      filteredReviews = filteredReviews.filter(review => review.adminReply);
    } else if (filterStatus === 'notReplied') {
      filteredReviews = filteredReviews.filter(review => !review.adminReply);
    } else if (filterStatus === 'highRated') {
      filteredReviews = filteredReviews.filter(review => review.rating >= 4);
    } else if (filterStatus === 'lowRated') {
      filteredReviews = filteredReviews.filter(review => review.rating <= 2);
    }

    // Apply sorting
    if (sortOrder === 'newest') {
      filteredReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOrder === 'oldest') {
      filteredReviews.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortOrder === 'highestRating') {
      filteredReviews.sort((a, b) => b.rating - a.rating);
    } else if (sortOrder === 'lowestRating') {
      filteredReviews.sort((a, b) => a.rating - b.rating);
    }

    return filteredReviews;
  };

  // Handle showing reply form
  const handleShowReplyForm = (reviewId) => {
    setShowReplyForm(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));

    // Initialize reply text if not already set
    if (!replyText[reviewId]) {
      setReplyText(prev => ({
        ...prev,
        [reviewId]: ''
      }));
    }
  };

  // Handle reply text change
  const handleReplyChange = (reviewId, value) => {
    setReplyText(prev => ({
      ...prev,
      [reviewId]: value
    }));
  };

  // Submit reply to review
  const handleSubmitReply = async (reviewId) => {
    if (!replyText[reviewId]?.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    setSubmittingReply(prev => ({ ...prev, [reviewId]: true }));

    try {
      const response = await axios.put(
        `http://localhost:3000/api/review/admin/${reviewId}/reply`,
        { reply: replyText[reviewId] },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update the reviews list with the new reply
        setReviews(prev =>
          prev.map(review =>
            review._id === reviewId
              ? { ...review, adminReply: replyText[reviewId], adminReplyDate: new Date() }
              : review
          )
        );

        // Hide the reply form
        setShowReplyForm(prev => ({ ...prev, [reviewId]: false }));

        toast.success('Reply added successfully');
      } else {
        toast.error(response.data.message || 'Failed to add reply');
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
      toast.error(err.response?.data?.message || 'An error occurred while submitting your reply');
    } finally {
      setSubmittingReply(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  // Confirm delete review
  const confirmDeleteReview = (reviewId) => {
    setReviewToDelete(reviewId);
    setShowDeleteModal(true);
  };

  // Delete review
  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      const response = await axios.delete(
        `http://localhost:3000/api/review/${reviewToDelete}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Remove the deleted review from the list
        setReviews(prev => prev.filter(review => review._id !== reviewToDelete));
        toast.success('Review deleted successfully');
      } else {
        toast.error(response.data.message || 'Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error(err.response?.data?.message || 'An error occurred while deleting the review');
    } finally {
      setShowDeleteModal(false);
      setReviewToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setReviewToDelete(null);
  };

  // Get counts for filter badges
  const getRepliedCount = () => reviews.filter(review => review.adminReply).length;
  const getNotRepliedCount = () => reviews.filter(review => !review.adminReply).length;
  const getHighRatedCount = () => reviews.filter(review => review.rating >= 4).length;
  const getLowRatedCount = () => reviews.filter(review => review.rating <= 2).length;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex-1 ml-40 p-6 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex-1 ml-40 p-6">
          <div className="bg-gray-100 border border-gray-400 text-gray-700 px-6 py-4 rounded-lg shadow-md" role="alert">
            <h3 className="font-bold text-lg mb-2">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredReviews = getFilteredAndSortedReviews();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="flex-1 ml-40 p-6">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Management</h1>
          <p className="text-gray-600 border-b border-gray-200 pb-3">Manage customer reviews and respond to feedback</p>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Confirm Deletion</h3>
              <p className="text-gray-700 mb-6">Are you sure you want to delete this review? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-5 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReview}
                  className="px-5 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Sort Controls */}
        <div className="bg-white rounded-lg shadow-md p-2 mb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter Reviews:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 text-sm rounded-md ${filterStatus === 'all'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    } transition-colors`}
                >
                  All ({reviews.length})
                </button>
                <button
                  onClick={() => setFilterStatus('replied')}
                  className={`px-3 py-1.5 text-sm rounded-md ${filterStatus === 'replied'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    } transition-colors`}
                >
                  Replied ({getRepliedCount()})
                </button>
                <button
                  onClick={() => setFilterStatus('notReplied')}
                  className={`px-3 py-1.5 text-sm rounded-md ${filterStatus === 'notReplied'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    } transition-colors`}
                >
                  Not Replied ({getNotRepliedCount()})
                </button>
                <button
                  onClick={() => setFilterStatus('highRated')}
                  className={`px-3 py-1.5 text-sm rounded-md ${filterStatus === 'highRated'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    } transition-colors`}
                >
                  High Rated (4-5) ({getHighRatedCount()})
                </button>
                <button
                  onClick={() => setFilterStatus('lowRated')}
                  className={`px-3 py-1.5 text-sm rounded-md ${filterStatus === 'lowRated'
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    } transition-colors`}
                >
                  Low Rated (1-2) ({getLowRatedCount()})
                </button>
              </div>
            </div>

            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full md:w-48 rounded-md border-gray-300 px-2 shadow-sm focus:border-black focus:ring-black text-sm py-2"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highestRating">Highest Rating</option>
                <option value="lowestRating">Lowest Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews Count */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-700">
            Showing <span className="font-semibold">{filteredReviews.length}</span> of <span className="font-semibold">{reviews.length}</span> reviews
          </p>

          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="text-sm text-gray-600 hover:text-black transition-colors bg-gray-50"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-600">
              {filterStatus !== 'all' ?
                "Try changing your filter or sort options to see more reviews." :
                "There are currently no reviews in the system."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* <div className="flex-shrink-0">
                        {review.mealkit && review.mealkit.image ? (
                          <img
                            src={getImageUrl(review.mealkit.image)}
                            alt={review.mealkit.title}
                            className="w-16 h-16 object-cover rounded-md shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = assets.homePage;
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No image</span>
                          </div>
                        )}
                      </div> */}

                      <div>
                        <h2 className="text-md font-semibold text-gray-900">
                          {review.mealkit ? review.mealkit.title : 'Unknown Meal Kit'}
                        </h2>

                        <div className="flex items-center mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-gray-700' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            by {review.author?.name || 'Anonymous User'}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {formatDate(review.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => confirmDeleteReview(review._id)}
                      className="text-gray-600 bg-white hover:text-gray-900 transition-colors p-1"
                      aria-label="Delete review"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>

                  <div className="mt-2">
                    <p className="text-gray-700">{review.comment}</p>
                  </div>

                  {/* Admin Reply Section */}
                  {review.adminReply ? (
                    <div className="mt-2 bg-gray-100 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-800">Admin Reply</h3>
                        <span className="text-xs text-gray-600">
                          {review.adminReplyDate ? formatDate(review.adminReplyDate) : ''}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-800">{review.adminReply}</p>

                      {/* Edit Reply Button */}
                      <button
                        onClick={() => {
                          handleReplyChange(review._id, review.adminReply);
                          handleShowReplyForm(review._id);
                        }}
                        className="mt-2 text-xs bg-gray-100 text-gray-700 hover:text-black transition-colors underline"
                      >
                        Edit Reply
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <button
                        onClick={() => handleShowReplyForm(review._id)}
                        className="text-sm py-1.5 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Reply to this review
                      </button>
                    </div>
                  )}

                  {/* Reply Form */}
                  {showReplyForm[review._id] && (
                    <div className="mt-2">
                      <textarea
                        value={replyText[review._id] || ''}
                        onChange={(e) => handleReplyChange(review._id, e.target.value)}
                        placeholder="Write your reply here..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                        rows="3"
                      ></textarea>

                      <div className="mt-2 flex justify-end space-x-2">
                        <button
                          onClick={() => setShowReplyForm(prev => ({ ...prev, [review._id]: false }))}
                          className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSubmitReply(review._id)}
                          disabled={submittingReply[review._id]}
                          className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                        >
                          {submittingReply[review._id] ? 'Submitting...' : 'Submit Reply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewAdmin;