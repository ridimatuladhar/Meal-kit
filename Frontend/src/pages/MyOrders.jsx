import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import LeaveReview from './LeaveReview.jsx';
import { assets } from '../assets/assets';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [userReviews, setUserReviews] = useState({});
  const [reviewPopup, setReviewPopup] = useState({
    open: false,
    mealKitId: null,
    currentReview: null,
    itemTitle: '',
    orderId: null // Added order ID for reference
  });
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchUserReviews();
  }, []);

  // Image URL handler
  const getImageUrl = (imagePath) => {
    if (!imagePath) return assets.homePage;

    // If it's already a full URL (starts with http or https), use it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // If it's a path from our uploads directory, prefix with server URL
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:3000${imagePath}`;
    }

    // Default fallback image
    return assets.homePage;
  };

  // Hide thank you message after 3 seconds
  useEffect(() => {
    if (showThankYouMessage) {
      const timer = setTimeout(() => {
        setShowThankYouMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showThankYouMessage]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/order/my-orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      // Sort orders: ongoing first, then delivered/cancelled
      const sortedOrders = [...data.orders].sort((a, b) => {
        const aIsOngoing = !['delivered', 'cancelled'].includes(a.status);
        const bIsOngoing = !['delivered', 'cancelled'].includes(b.status);

        if (aIsOngoing && !bIsOngoing) return -1;
        if (!aIsOngoing && bIsOngoing) return 1;

        // If both are in the same category, sort by date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setOrders(sortedOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load your orders. Please try again.');
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/review/user-reviews', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        const reviewsMap = {};
        data.reviews.forEach(review => {
          reviewsMap[review.mealkit._id] = review;
        });
        setUserReviews(reviewsMap);
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/order/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Customer cancelled' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel order');
      }

      toast.success('Order cancelled successfully');
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.message || 'Failed to cancel order');
      setLoading(false);
    }
  };

  const handleReviewSubmit = () => {
    // Close the popup
    setReviewPopup({
      open: false,
      mealKitId: null,
      currentReview: null,
      itemTitle: '',
      orderId: null
    });

    // Show thank you message
    setShowThankYouMessage(true);

    // Refresh reviews after submission
    fetchUserReviews();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-indigo-100 text-indigo-800',
      'out_for_delivery': 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const statusLabels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      'out_for_delivery': 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredOrders =
    activeTab === 'all' ? orders :
      activeTab === 'ongoing' ? orders.filter(order => !['delivered', 'cancelled'].includes(order.status)) :
        activeTab === 'completed' ? orders.filter(order => order.status === 'delivered') :
          activeTab === 'cancelled' ? orders.filter(order => order.status === 'cancelled') :
            orders;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pt-20 px-4">
        <Navbar />
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 px-4">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-xl font-bold text-green-800 mb-6">My Orders</h1>

        {/* Thank you message toast notification */}
        {showThankYouMessage && (
          <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out">
            Thank you for your review!
          </div>
        )}

        <div className="bg-white shadow rounded-lg mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              className={`px-4 py-2 whitespace-nowrap ${activeTab === 'all' ? 'text-green-700 border-b-2 bg-white border-green-600' : 'bg-white text-gray-500 hover:text-green-600'}`}
              onClick={() => setActiveTab('all')}
            >
              All Orders
            </button>
            <button
              className={`px-4 py-2 whitespace-nowrap ${activeTab === 'ongoing' ? 'text-green-700 border-b-2 bg-white border-green-600' : 'text-gray-500 bg-white hover:text-green-600'}`}
              onClick={() => setActiveTab('ongoing')}
            >
              Ongoing
            </button>
            <button
              className={`px-4 py-2 whitespace-nowrap ${activeTab === 'completed' ? 'text-green-700 bg-white border-b-2 border-green-600' : 'text-gray-500 bg-white hover:text-green-600'}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
            <button
              className={`px-4 py-2 whitespace-nowrap ${activeTab === 'cancelled' ? 'text-green-700 bg-white border-b-2 border-green-600' : 'text-gray-500 bg-white hover:text-green-600'}`}
              onClick={() => setActiveTab('cancelled')}
            >
              Cancelled
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-gray-500">
              {activeTab === 'all'
                ? "You haven't placed any orders yet."
                : activeTab === 'ongoing'
                  ? "You don't have any ongoing orders."
                  : activeTab === 'completed'
                    ? "You don't have any completed orders."
                    : "You don't have any cancelled orders."}
            </p>
            <div className="mt-6">
              <Link to="/" className="inline-flex items-center px-4 py-2 text-white rounded-md hover:bg-green-700">
                Browse Meal Kits
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-3 border-b sm:flex sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-md text-gray-900">
                      Order #{order.orderNumber}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center">
                    <div className="mr-4">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 sm:px-6">
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {order.items.map((item, index) => (
                        <li key={`${order._id}-item-${index}`} className="py-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
                              <img
                                src={getImageUrl(item.image)}  
                                alt={item.title}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = assets.homePage; 
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                Qty: {item.quantity} × Rs. {item.price}
                              </p>
                              {/* Show review status if already reviewed */}
                              {order.status === 'delivered' && userReviews[item.mealKit] && (
                                <p className="text-xs text-green-600 mt-1">
                                  ★ You rated this {userReviews[item.mealKit].rating}/5
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col text-right text-sm text-gray-900">
                              <span>Rs. {item.quantity * item.price}</span>
                              {/* Enhanced review button with conditional styling */}
                              {order.status === 'delivered' && (
                                <button
                                  className={`mt-2 px-3 py-1 ${userReviews[item.mealKit]
                                      ? 'bg-yellow-500 hover:bg-yellow-600'
                                      : ' hover:bg-green-700'
                                    } text-white rounded text-xs`}
                                  onClick={() => setReviewPopup({
                                    open: true,
                                    mealKitId: item.mealKit,
                                    currentReview: userReviews[item.mealKit] || null,
                                    itemTitle: item.title,
                                    orderId: order._id // Pass order ID for reference
                                  })}
                                >
                                  {userReviews[item.mealKit] ? 'Edit Review' : 'Leave a Review'}
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="px-4 py-2 sm:px-6 bg-gray-50 flex flex-wrap items-center justify-between space-y-2 sm:space-y-0">
                  <div>
                    <div className="flex items-center">
                      <p className="text-sm text-gray-500">Payment: </p>
                      <p className="ml-1 text-sm font-medium text-gray-900">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Khalti'}
                      </p>
                      <span className="mx-2">•</span>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                    <div className="mt-1 flex items-center">
                      <p className="text-sm text-gray-500">Total: </p>
                      <p className="ml-1 text-sm font-medium text-gray-900">
                        Rs. {order.totalAmount}
                      </p>
                    </div>
                  </div>

                  {['pending', 'confirmed'].includes(order.status) && (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Review Modal */}
      {reviewPopup.open && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {reviewPopup.currentReview ? 'Edit Your Review' : 'Leave a Review'}
              </h3>
              <button
                onClick={() => setReviewPopup({
                  open: false,
                  mealKitId: null,
                  currentReview: null,
                  itemTitle: '',
                  orderId: null
                })}
                className="text-gray-400 hover:text-gray-500 bg-white"
              >
                <i className="fa-solid fa-xmark "></i>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600">For: <span className="font-medium">{reviewPopup.itemTitle}</span></p>
              {reviewPopup.currentReview && (
                <p className="text-sm text-gray-500 mt-1">
                  You previously rated this {reviewPopup.currentReview.rating}/5
                </p>
              )}
            </div>

            <LeaveReview
              mealKitId={reviewPopup.mealKitId}
              currentReview={reviewPopup.currentReview}
              onReviewSubmit={handleReviewSubmit}
              isModal={true}
              isEditMode={!!reviewPopup.currentReview}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;