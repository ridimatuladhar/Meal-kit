import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { toast } from "react-toastify";
import Reviews from './Reviews';
import { assets } from '../assets/assets'; // Import assets for fallback image

const Detail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const mealKit = location.state?.mealKit;

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

  useEffect(() => {
    const token = localStorage.getItem('token'); 
    setIsLoggedIn(!!token);
    
    if (token && mealKit?._id) {
      checkFavoriteStatus();
    }
  }, [mealKit]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/user/favourites/check/${mealKit._id}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  
  if (!mealKit) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div className="bg-gray-50 rounded-lg shadow-sm p-8 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Meal Kit Not Found</h2>
            <p className="text-gray-600 mb-8">The meal kit you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate('/')} 
              className="inline-block px-6 py-3 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      toast.info('Please login to add items to cart');
      return;
    }
    
    if (mealKit.availability !== 'Available') {
      toast.error('Sorry, this item is currently out of stock');
      return;
    }
  
    // Check if item is already in cart
    let cart = [];
    const existingCart = localStorage.getItem('cart');
    if (existingCart) {
      cart = JSON.parse(existingCart);
    }
    
    const existingItemIndex = cart.findIndex(item => item.id === mealKit._id);
    
    if (existingItemIndex !== -1) {
      // Item already exists in cart, show toast message
      toast.info(`${mealKit.title} is already in your cart`);
      return;
    }
   
    setIsAddingToCart(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          mealKitId: mealKit._id,
          quantity
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to server cart');
      }
      
      // Add item to cart with proper image URL
      cart.push({
        id: mealKit._id,
        title: mealKit.title,
        price: parseFloat(mealKit.price),
        image: getImageUrl(mealKit.image), // Use our helper function
        quantity: quantity
      });
      
      localStorage.setItem('cart', JSON.stringify(cart));
      toast.success(`${mealKit.title} is added to cart!`);
      setQuantity(1);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      toast.info('Please login to manage favorites');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    setIsTogglingFavorite(true);
    
    try {
      const endpoint = isFavorite ? 'remove' : 'add';
      const response = await fetch(`http://localhost:3000/api/user/favourites/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ mealKitId: mealKit._id })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      setIsFavorite(!isFavorite);
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
      setIsTogglingFavorite(false);
    }
  };

  // Get the proper image URL for the meal kit
  const imageUrl = getImageUrl(mealKit.image);
  
  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{mealKit.title}</h1>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <div className="relative">
              <img
                src={imageUrl}
                alt={mealKit.title}
                className="w-full h-64 object-cover rounded-xl shadow-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = assets.homePage;
                }}
              />
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                mealKit.availability === 'Available'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-700 text-white'
              }`}>
                {mealKit.availability === 'Available' ? 'Available' : 'Out of Stock'}
              </div>
            </div>

            
            
            <div className="flex gap-4 mt-2">
              <button 
                className={`flex items-center justify-center gap-2 ${
                  isFavorite ? 'bg-red-700 hover:bg-red-600' : 'bg-gray-400 hover:bg-gray-500'
                } text-white py-2 px-3 text-sm rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed`}
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite || isAddingToCart}
              >
                {isTogglingFavorite ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <i className={`fa-heart ${isFavorite ? 'fa-solid' : 'fa-regular'}`}></i>
                )}
                {isFavorite ? 'Favorite' : 'Add to Favorites'}
              </button>
              
              <button 
                className={`flex-1 flex items-center justify-center gap-2 text-sm text-white py-2 px-4 rounded-lg transition ${
                  mealKit.availability === 'Available' 
                    ? 'hover:bg-green-700' 
                    : 'bg-gray-400'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
                onClick={handleAddToCart}
                disabled={isAddingToCart || mealKit.availability !== 'Available'}
              >
                {isAddingToCart ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : (
                  <>
                    <i className="fa-solid fa-cart-shopping"></i> Add to Cart
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <p className="text-gray-700 text-base mb-2">
                <span className="font-semibold">Price:</span> Rs. {mealKit.price}
              </p>
              <p className="text-gray-700 text-base mb-2">
                <span className="font-semibold">Rating:</span> {mealKit.rating || 0}{' '}
                <i className="fa-solid fa-star text-yellow-400"></i>
              </p>
              <p className="text-gray-700 text-base mb-2">
                <span className="font-semibold">Availability:</span>{' '}
                <span className={mealKit.availability === 'Available' ? 'text-green-600' : 'text-red-600'}>
                  {mealKit.availability}
                </span>
              </p>
              <p className="text-gray-700 text-base mb-2">
                <span className="font-semibold">Cooking Time:</span> {mealKit.ctime} mins
              </p>
              <p className="text-gray-700 text-base mb-2">
                <span className="font-semibold">Preparation Time:</span> {mealKit.ptime} mins
              </p>
              <p className="text-gray-700 text-base">
                <span className="font-semibold">Servings:</span> {mealKit.servings}
              </p>
              
              {mealKit.tags?.length > 0 && (
                <div className="mt-4">
                  <h2 className="text-base font-semibold mb-2">Tags:</h2>
                  <div className="flex flex-wrap gap-2">
                    {mealKit.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="text-gray-700 text-base">{mealKit.desc}</p>
        </div>

        {mealKit.ingredientsNotIncluded?.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Ingredients Not Included</h2>
            <ul className="list-disc list-inside text-gray-700 text-base">
              {mealKit.ingredientsNotIncluded.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
        )}

        {mealKit.ingredientsIncluded?.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Ingredients Included</h2>
            <ul className="list-disc list-inside text-gray-700 text-base">
              {mealKit.ingredientsIncluded.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
        )}

        {mealKit.steps?.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Cooking Steps</h2>
            <ol className="list-decimal list-inside text-gray-700 text-base">
              {mealKit.steps.map((step, index) => (
                <li key={index} className="mb-2">{step}</li>
              ))}
            </ol>
          </div>
        )}
      <div className="mt-6">
  <Reviews mealKitId={mealKit._id} />
</div>
        </div>
    </div>
  );
};

export default Detail;