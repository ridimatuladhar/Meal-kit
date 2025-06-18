import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';

const CheckOut = () => {
  const [state, setState] = useState({
    cartItems: [],
    cartTotal: 0,
    itemCount: 0,
    userData: {
      name: '',
      address: '',
      phoneNumber: ''
    },
    isLoading: true,
    paymentMethod: 'cod',
    processingOrder: false
  });
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

  const navigate = useNavigate();

  // Helper functions
  const calculateCartTotal = (items) => {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    return { total, count };
  };

  // Fetch data on component mount
  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // Check authentication
        if (!localStorage.getItem('token')) {
          toast.error('Please login to proceed with checkout');
          navigate('/login');
          return;
        }

        // Fetch data in parallel
        const [cartResponse, userResponse] = await Promise.allSettled([
          fetch('http://localhost:3000/api/cart', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          }),
          fetch('http://localhost:3000/api/user/data', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          })
        ]);

        // Handle cart data
        let cartItems = [];
        if (cartResponse.status === 'fulfilled' && cartResponse.value.ok) {
          const cartData = await cartResponse.value.json();
          cartItems = cartData.success ? cartData.cart : [];
        } else {
          // Fallback to localStorage
          cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        }

        // Check if cart is empty
        if (cartItems.length === 0) {
          toast.info('Your cart is empty. Please add items before checkout.');
          navigate('/');
          return;
        }

        // Handle user data
        let userData = { name: '', address: '', phoneNumber: '' };
        if (userResponse.status === 'fulfilled' && userResponse.value.ok) {
          const userDataResponse = await userResponse.value.json();
          if (userDataResponse.success && userDataResponse.userData?.user) {
            const user = userDataResponse.userData.user;
            userData = {
              name: user.name || user.firstName || '',
              address: user.address || '',
              phoneNumber: user.phone || user.phoneNumber || ''
            };
          }
        }

        const { total, count } = calculateCartTotal(cartItems);
        
        setState(prev => ({
          ...prev,
          cartItems,
          cartTotal: total,
          itemCount: count,
          userData,
          isLoading: false
        }));

      } catch (error) {
        console.error('Checkout initialization error:', error);
        toast.error('Error loading checkout data. Please try again.');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeCheckout();
  }, [navigate]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      userData: {
        ...prev.userData,
        [name]: value
      }
    }));
  };

  const handlePaymentChange = (e) => {
    setState(prev => ({ ...prev, paymentMethod: e.target.value }));
  };

  const clearCart = async () => {
    // Clear localStorage cart
    localStorage.setItem('cart', JSON.stringify([]));
    window.dispatchEvent(new Event('storage'));
    
    // Clear database cart (silently)
    try {
      await fetch('http://localhost:3000/api/cart/clear', {
        method: 'DELETE',
        credentials: 'include'    
      });
    } catch (error) {
      console.error('Error clearing cart from database:', error);
      // Don't show error to user as the order is already placed
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { cartItems, userData, paymentMethod, cartTotal } = state;
  
    // Validate cart
    if (!cartItems.length) {
      toast.error('Your cart is empty. Add items before checkout.');
      navigate('/');
      return;
    }
  
    // Validate form
    const requiredFields = ['name', 'address', 'phoneNumber'];
    const missingField = requiredFields.find(field => !userData[field]?.trim());
    if (missingField) {
      toast.error(`Please fill in your ${missingField.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      return;
    }
  
    // Set loading state
    setState(prev => ({ ...prev, processingOrder: true }));
  
    try {
      const orderData = {
        paymentMethod,
        shippingDetails: { ...userData },
        items: cartItems.map(item => {
          const mealKitData = item.mealKit || item;
          const mealKitId = mealKitData._id || mealKitData.id;
          
          if (!mealKitId) {
            throw new Error('Invalid meal kit data: Missing id');
          }
          
          return {
            mealKit: mealKitId,
            quantity: item.quantity,
            price: mealKitData.price,
            title: mealKitData.title,
            image: mealKitData.image
          };
        }),
        totalAmount: cartTotal
      };
  
      if (paymentMethod === 'khalti') {
        toast.info('Redirecting to Khalti payment gateway...');
        try {
          const response = await fetch('http://localhost:3000/api/order/khalti/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              amount: Math.round(cartTotal * 100), // Convert to paisa
              return_url: `${window.location.origin}/payment/verify`,
              website_url: window.location.origin,
              shippingDetails: userData
            })
          });
      
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || 'Failed to initiate Khalti payment');
          }
      
          // Clear cart as we're redirecting to Khalti
          
          // Redirect to Khalti payment page
          localStorage.setItem('transactionId', data.transactionId);
          window.location.href = data.data.payment_url;
        } catch (error) {
          console.error('Khalti payment error:', error);
          toast.error('Failed to initiate online payment. Please try again or use Cash on Delivery.');
        }
      } else {
        // Handle COD payment
        toast.info('Processing your order...');
        const response = await fetch('http://localhost:3000/api/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', 
          body: JSON.stringify(orderData)
        });
  
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to create order');
        }
  
        
        toast.success('Order placed successfully! You\'ll pay when your order is delivered.');
        navigate('/order-confirmation', { 
          state: { orderNumber: data.order?.orderNumber } 
        });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to place order. Please try again or use another payment method.');
    } finally {
      setState(prev => ({ ...prev, processingOrder: false }));
    }
  };

  // Render loading state
  if (state.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
      </div>
    );
  }

  const { cartItems, cartTotal, itemCount, userData, paymentMethod, processingOrder } = state;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="mr-8 flex items-center bg-gray-50 text-gray-600 hover:text-green-600 transition-colors"
          >
            Back to Cart
          </button>
          <h1 className="text-2xl font-bold text-gray-800 text-green-800">Checkout</h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Shipping/Payment Info */}
          <div className="md:w-2/3 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Shipping Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    name="address"
                    value={userData.address}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter your complete address"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={userData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                
              
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payment Method
              </h2>
              <div className="space-y-4">
                <div className={`border rounded-md p-4 ${paymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={handlePaymentChange}
                      className="h-5 w-5 text-green-600 focus:ring-green-500"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-700">Cash on Delivery</span>
                      <span className="block text-xs text-gray-500 mt-1">Pay when your order is delivered</span>
                    </div>
                  </label>
                </div>
                
                <div className={`border rounded-md p-4 ${paymentMethod === 'khalti' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="khalti"
                      checked={paymentMethod === 'khalti'}
                      onChange={handlePaymentChange}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3 flex items-center">
                      <span className="block text-sm font-medium text-gray-700 mr-2">Khalti</span>
                      <span className="text-xs py-1 px-2 bg-purple-100 text-purple-700 rounded">Online Payment</span>
                      
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Order Items - Mobile Version */}
            {/* <div className="bg-white rounded-lg shadow-md p-6 md:hidden">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Order Items ({itemCount})
              </h2>
              
              <div className="divide-y divide-gray-200">
                {cartItems.map((item, index) => {
                  const mealKitData = item.mealKit || item;
                  return (
                    <div key={index} className="py-3 flex">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={mealKitData.image}
                          alt={mealKitData.title}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>{mealKitData.title}</h3>
                            <p className="ml-4">Rs. {(mealKitData.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <p className="text-gray-500">Qty {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Subtotal</p>
                  <p>Rs. {cartTotal.toFixed(2)}</p>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">Shipping calculated at checkout.</p>
              </div>
            </div> */}
          </div>
          
          {/* Right Column - Order Summary */}
          <div className="md:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Order Summary
              </h2>
              
              {/* Order Items - Desktop Version */}
              <div className="hidden md:block mb-6">
                <div className="max-h-64 overflow-y-auto pr-2">
                  {cartItems.map((item, index) => {
                    const mealKitData = item.mealKit || item;
                    return (
                      <div key={index} className="flex items-center mb-3 pb-3 border-b">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                          <img
                            src={getImageUrl(mealKitData.image)}
                            alt={mealKitData.title}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{mealKitData.title}</h3>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">Rs. {(mealKitData.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                  <span className="font-medium">Rs. {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>Rs. {cartTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <button
                className="w-full py-3 px-4 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-70 flex justify-center items-center"
                onClick={handleSubmit}
                disabled={processingOrder}
              >
                {processingOrder ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : paymentMethod === 'cod' ? 'Place Order (Cash on Delivery)' : 'Pay with Khalti'}
              </button>
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                By placing your order, you agree to our{' '}
                <Link to="/terms" className="text-green-600 hover:underline">Terms of Service</Link> and{' '}
                <Link to="/terms" className="text-green-600 hover:underline">Privacy Policy</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckOut;