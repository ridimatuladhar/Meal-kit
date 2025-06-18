import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { toast } from "react-toastify";

const Card = ({ mealKits: propMealKits }) => {
  const [isAddingToCart, setIsAddingToCart] = useState({});
  const [isTogglingFavorite, setIsTogglingFavorite] = useState({});
  const [mealKits, setMealKits] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  // Helper function to get proper image URL
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

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    // If logged in, fetch user's favorites
    if (token) {
      fetchFavorites();
    }
  }, []);

  // Fetch favorites from server
  const fetchFavorites = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/user/favourites', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Extract favorite IDs for easier comparison
          const favoriteIds = data.favorites.map(favorite => favorite._id);
          setFavorites(favoriteIds);
        }
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  // Use props if available, otherwise fetch from API
  useEffect(() => {
    if (propMealKits && Array.isArray(propMealKits)) {
      // Important: Update mealKits when propMealKits changes
      setMealKits(propMealKits);
    } else {
      const fetchMealKits = async () => {
        try {
          const response = await fetch('http://localhost:3000/api/user/meal-kits');
          const data = await response.json();
          setMealKits(data);
        } catch (error) {
          console.error('Error fetching meal kits:', error);
          toast.error('Failed to load meal kits');
        }
      };

      fetchMealKits();
    }
  }, [propMealKits]); // Add propMealKits as a dependency

  const handleCardClick = (mealKit) => {
    navigate('/detail', { state: { mealKit } });
  };

  const handleAddToCart = async (e, mealKit) => {
    e.stopPropagation(); // Prevent card click
    
    if (!isLoggedIn) {
      toast.info('Please login to add items to cart');
      return;
    }
    
    if (mealKit.availability !== 'Available') {
      toast.error('Sorry, this item is currently out of stock');
      return;
    }
  
    // Make sure price is a number
    const price = parseFloat(mealKit.price);
    if (isNaN(price)) {
      toast.error('Invalid price for this item');
      return;
    }
  
    // Get item ID
    const itemId = mealKit._id || mealKit.id;
    
    // Set loading state for this specific button
    setIsAddingToCart(prev => ({ ...prev, [itemId]: true }));
  
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Add to server if logged in
      const response = await fetch('http://localhost:3000/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add authorization header
        },
        credentials: 'include',
        body: JSON.stringify({
          mealKitId: itemId,
          quantity: 1 // Explicitly add quantity
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add to server cart');
      }
      
      // Check if item is already in localStorage cart
      let cart = [];
      const existingCart = localStorage.getItem('cart');
      if (existingCart) {
        cart = JSON.parse(existingCart);
      }
      
      // Check if item already in cart
      const existingItemIndex = cart.findIndex(item => item.id === itemId);
      
      if (existingItemIndex !== -1) {
        // Item already exists in cart, show toast message
        toast.info(`${mealKit.title || mealKit.name} is already in your cart`);
        return;
      }
      
      // Add new item to cart
      cart.push({
        id: itemId,
        title: mealKit.title || mealKit.name,
        price: price,
        image: getImageUrl(mealKit.image),
        quantity: 1
      });
      
      // Save back to localStorage
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Dispatch events to update cart count in navbar
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      // Show success message
      toast.success(`${mealKit.title || mealKit.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // More specific error messages
      if (error.message.includes('401')) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/login');
      } else {
        toast.error(error.message || 'Failed to add item to cart');
      }
    } finally {
      // Reset loading state regardless of success/failure
      setIsAddingToCart(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Update the handleToggleFavorite function to be more robust
  const handleToggleFavorite = async (e, mealKit) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      toast.info('Please login to manage favorites');
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    
    const mealKitId = mealKit._id || mealKit.id;
    const isFavorite = favorites.includes(mealKitId);
    setIsTogglingFavorite(prev => ({ ...prev, [mealKitId]: true }));

    try {
      const endpoint = isFavorite ? 'remove' : 'add';
      const response = await fetch(`http://localhost:3000/api/user/favourites/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ mealKitId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      setFavorites(prev => 
        isFavorite 
          ? prev.filter(id => id !== mealKitId) 
          : [...prev, mealKitId]
      );
      
      toast.success(
        isFavorite 
          ? 'Removed from favorites' 
          : 'Added to favorites'
      );
    } catch (error) {
      console.error('Favorite error:', error);
      toast.error(error.message || 'Failed to update favorites');
      
      if (error.message.includes('authorized') || error.message.includes('expired')) {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        navigate('/login');
      }
    } finally {
      setIsTogglingFavorite(prev => ({ ...prev, [mealKitId]: false }));
    }
  };

  if (!mealKits || mealKits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No meal kits available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 mx-20">
      {mealKits.map((mealKit) => {
        const mealKitId = mealKit._id || mealKit.id;
        const isFavorite = favorites.includes(mealKitId);
        
        return (
          <div
            key={mealKitId}
            className="bg-white rounded-2xl shadow-lg p-6 w-full relative hover:shadow-xl transition-shadow duration-300"
          >
            <div 
              className="meal-kit cursor-pointer" 
              onClick={() => handleCardClick(mealKit)}
            >
              {/* Image Container with updated image handling */}
              <div className="relative">
                <img
                  src={getImageUrl(mealKit.image)}
                  alt={mealKit.title}
                  className="w-full h-44 object-cover rounded-xl"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = assets.homePage;
                  }}
                />
                {/* Availability Badge */}
                <div
                  className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                    mealKit.availability === 'Available'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-700 text-white'
                  }`}
                >
                  {mealKit.availability === 'Available' ? 'Available' : 'Out of Stock'}
                </div>
              </div>

              {/* Meal Kit Details */}
              <h2 className="text-lg font-semibold mt-3 text-gray-800">
                {mealKit.title || mealKit.name}
              </h2>
              <p className="text-gray-700 mt-2 text-sm">
                Rs. {mealKit.price}
              </p>
              <div className="flex items-center mt-1 text-gray-600">
                <span className="mr-1 text-sm">Rating: {mealKit.rating || 0}</span>
                <i className="fa-solid fa-star text-yellow-400"></i>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-between mt-4">
              <button
                className={`${
                  mealKit.availability === 'Available'
                    ? 'hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                } text-white py-2 px-3 text-sm rounded-lg transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 ${
                  isAddingToCart[mealKitId] ? 'opacity-75' : ''
                }`}
                onClick={(e) => handleAddToCart(e, mealKit)}
                disabled={isAddingToCart[mealKitId] || mealKit.availability !== 'Available'}
              >
                {isAddingToCart[mealKitId] ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : (
                  <i className="fa-solid fa-cart-shopping"></i>
                )}
              </button>
              <button
                className={`bg-white ${
                  isFavorite ? 'text-red-600' : 'text-gray-400'
                } hover:text-red-700 py-2 px-3 text-xl rounded-lg transition focus:outline-none ${
                  isTogglingFavorite[mealKitId] ? 'opacity-50' : ''
                }`}
                onClick={(e) => handleToggleFavorite(e, mealKit)}
                disabled={isTogglingFavorite[mealKitId]}
              >
                {isTogglingFavorite[mealKitId] ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Card;