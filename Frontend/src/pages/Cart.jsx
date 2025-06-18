import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets } from '../assets/assets';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingQuantity, setUpdatingQuantity] = useState({});
  const navigate = useNavigate();

  // Helper function to get proper image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/300?text=Meal+Kit';

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:3000${imagePath}`;
    }

    return 'https://via.placeholder.com/300?text=Meal+Kit';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Load cart data
    if (token) {
      // If logged in, fetch from server
      fetchServerCart();
    } else {
      // Otherwise use localStorage
      loadLocalCart();
      setIsLoading(false);
    }
  }, []);

  // Fetch cart from server
  const fetchServerCart = async () => {
    setIsLoading(true);
    try {
      // Get local cart to send to server for potential merging
      const localCartItems = JSON.parse(localStorage.getItem('cart') || '[]');

      const response = await fetch('http://localhost:3000/api/cart', {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCartItems(data.cart);

          // Save to localStorage as backup
          localStorage.setItem('cart', JSON.stringify(data.cart));

          // If we have local items that might need merging, call merge endpoint
          if (localCartItems.length > 0) {
            mergeLocalCart(localCartItems);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch cart');
        }
      } else {
        // Handle specific status codes
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          toast.error('Session expired. Please login again.');
          loadLocalCart(); // Fall back to local cart
        } else {
          // Other API errors
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error fetching cart from server:', error);
      toast.error('Could not load your cart from server. Using local cart instead.');
      // Fallback to localStorage
      loadLocalCart();
    } finally {
      setIsLoading(false);
    }
  };

  const mergeLocalCart = async (localItems) => {
    try {
      const response = await fetch('http://localhost:3000/api/cart/merge', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: localItems })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update cart with merged data
          setCartItems(data.cart);
          localStorage.setItem('cart', JSON.stringify(data.cart));
        }
      }
    } catch (error) {
      console.error('Error merging carts:', error);
    }
  };

  // Load cart from localStorage
  const loadLocalCart = () => {
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        let parsedCart = JSON.parse(storedCart);

        // Validate cart items format
        parsedCart = parsedCart.filter(item =>
          item &&
          item.id &&
          typeof item.id === 'string' &&
          typeof item.price === 'number' &&
          item.price > 0 &&
          typeof item.quantity === 'number' &&
          item.quantity > 0
        );

        setCartItems(parsedCart);

        // Update localStorage with validated cart
        localStorage.setItem('cart', JSON.stringify(parsedCart));
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      // Reset cart if corrupted
      localStorage.setItem('cart', JSON.stringify([]));
      setCartItems([]);
    }
  };

  // Update total whenever cart changes
  useEffect(() => {
    // Calculate total
    const total = cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    setCartTotal(total);
  }, [cartItems]);

  // Update quantity in cart
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1 || newQuantity > 7) {
      toast.error('Quantity must be between 1 and 7');
      return;
    }

    setUpdatingQuantity(prev => ({ ...prev, [itemId]: true }));

    try {
      // Optimistic UI update
      setCartItems(prevItems => {
        const updatedItems = prevItems.map(item =>
          item.id === itemId
            ? { ...item, quantity: newQuantity }
            : item
        );
        localStorage.setItem('cart', JSON.stringify(updatedItems));
        return updatedItems;
      });

      if (isLoggedIn) {
        const response = await axios.put(
          'http://localhost:3000/api/cart/update',
          {
            mealKitId: itemId,
            quantity: newQuantity
          },
          {
            withCredentials: true, // This sends cookies
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.message || 'Update failed');
        }

        // Convert backend cart items to frontend format
        const formattedItems = response.data.cart.items.map(item => ({
          id: item.mealKit._id ? item.mealKit._id : item.mealKit,
          title: item.mealKit.title || 'Loading...',
          price: item.mealKit.price || 0,
          image: item.mealKit.image || '',
          quantity: item.quantity
        }));

        setCartItems(formattedItems);
        localStorage.setItem('cart', JSON.stringify(formattedItems));
      }

      toast.success('Quantity updated successfully');
    } catch (error) {
      console.error('Update error:', error);

      // Revert optimistic update
      setCartItems(prevItems => {
        const originalItems = prevItems.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity }
            : item
        );
        localStorage.setItem('cart', JSON.stringify(originalItems));
        return originalItems;
      });

      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          navigate('/login');
        } else {
          toast.error(error.response.data?.message || 'Failed to update quantity');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
    } finally {
      setUpdatingQuantity(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveFromCart = async (itemId) => {
    // Start with optimistic UI update
    const previousCartItems = [...cartItems];

    try {
      // Update local state immediately for better UX
      setCartItems(prevItems => {
        const newItems = prevItems.filter(item => item.id !== itemId);
        // Update localStorage
        localStorage.setItem('cart', JSON.stringify(newItems));
        return newItems;
      });

      // Show success notification
      toast.success('Item removed from cart');

      // Update navbar cart count
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      // If logged in, sync with server
      if (isLoggedIn) {
        const response = await fetch('http://localhost:3000/api/cart/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            mealKitId: itemId
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to remove from server cart');
        }
      }
    } catch (error) {
      console.error('Error removing from cart:', error);

      // Revert the optimistic update if server operation failed
      setCartItems(previousCartItems);
      localStorage.setItem('cart', JSON.stringify(previousCartItems));

      // Show error to user
      toast.error('Failed to remove item. Please try again.');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) {
      return;
    }

    if (isLoggedIn) {
      try {
        // Clear server cart
        const response = await fetch('http://localhost:3000/api/cart/clear', {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          console.error('Failed to clear server cart');
        }
      } catch (error) {
        console.error('Error clearing server cart:', error);
      }
    }

    // Clear local state and localStorage
    setCartItems([]);
    localStorage.setItem('cart', JSON.stringify([]));
    toast.success('Cart cleared successfully');

    // Update navbar cart count
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (!cartItems || cartItems.length === 0) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="bg-gray-50 rounded-lg shadow-sm p-8 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any meal kits to your cart yet.</p>
            <Link to="/">
              <button className="inline-block px-6 py-3 text-white font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
                Browse Meal Kits
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800 mb-2 pb-4 border-b border-gray-200">Your Cart</h1>

        <div className="lg:flex lg:gap-8 ">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="space-y-6 ">
              {cartItems.map((item) => (
                <div key={item.id} className="flex flex-col md:flex-row bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="md:w-1/4 h-48 md:h-auto">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300?text=Meal+Kit';
                      }}
                    />
                  </div>

                  <div className="p-4 md:p-6 flex-1">
                    <h3 className="text-lg text-gray-800 mb-2">{item.title}</h3>

                    <div className="flex flex-wrap gap-4 items-center mt-4">
                      <div className="text-gray-700">
                        <span className="font-medium">Rs. {item.price}</span> per kit
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center">
                        <span className="text-gray-700 mr-2">Qty:</span>
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-l focus:outline-none disabled:opacity-50"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updatingQuantity[item.id]}
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-medium">
                            {updatingQuantity[item.id] ? (
                              <div className="w-4 h-4 inline-block border-t-2 border-b-2 border-green-500 rounded-full animate-spin"></div>
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <button
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-r focus:outline-none disabled:opacity-50"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingQuantity[item.id]}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-gray-700">
                        Subtotal: <span className="font-medium">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      className="mt-4 inline-flex items-center px-2 py-1.5 text-sm text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                      onClick={() => handleRemoveFromCart(item.id)}
                    >
                      <i className="fa-solid fa-trash px-2"></i>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3 mt-8 lg:mt-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-green-800 mb-6 pb-4 border-b border-gray-200">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({cartItems.reduce((acc, item) => acc + item.quantity, 0)}):</span>
                  <span>Rs. {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping:</span>
                  <span className="text-green-700 font-medium">FREE</span>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="flex justify-between font-semibold text-lg text-gray-800">
                    <span>Total:</span>
                    <span>Rs. {cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link to="/checkout">
                  <button
                    className={`block w-full py-2 px-4 ${!isLoggedIn ? 'bg-gray-400' : 'hover:bg-green-700'} text-white font-medium rounded text-center transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50`}
                    onClick={(e) => {
                      if (!isLoggedIn) {
                        e.preventDefault();
                        toast.info('Please login to checkout');
                        navigate('/login');
                      }
                    }}
                  >
                    {isLoggedIn ? 'Proceed to Checkout' : 'Login to Checkout'}
                  </button>
                </Link>

                <button
                  className="w-full py-2 px-4 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                  onClick={handleClearCart}
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;