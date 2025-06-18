import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';

const Favourites = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [removingItems, setRemovingItems] = useState({});
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

    if (token) {
      fetchFavorites();
    } else {
      setIsLoading(false);
      navigate('/login', { state: { from: '/favourites', message: 'Please login to view your favorites' } });
    }
  }, [navigate]);

  // Fetch favorites from server
  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsLoading(false);
        navigate('/login', { state: { from: '/favourites', message: 'Please login to view your favorites' } });
        return;
      }

      const response = await fetch('http://localhost:3000/api/user/favourites', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFavorites(data.favorites);
        } else {
          toast.error(data.message || 'Failed to fetch favorites');
        }
      } else if (response.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login', { state: { from: '/favourites', message: 'Please login to view your favorites' } });
      } else {
        toast.error('Failed to fetch favorites');
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to fetch favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (mealKitId) => {
    setRemovingItems(prev => ({ ...prev, [mealKitId]: true }));
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3000/api/user/favourites/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ mealKitId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFavorites(prevFavorites => prevFavorites.filter(item => item._id !== mealKitId));
          toast.success('Removed from favorites');
        } else {
          toast.error(data.message || 'Failed to remove from favorites');
        }
      } else if (response.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Failed to remove from favorites');
    } finally {
      setRemovingItems(prev => ({ ...prev, [mealKitId]: false }));
    }
  };

  const handleMealKitClick = (mealKit) => {
    navigate('/detail', { state: { mealKit } });
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

  // Empty favorites state
  if (!favorites || favorites.length === 0) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="bg-gray-50 rounded-lg shadow-sm p-8 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Favorites List is Empty</h2>
            <p className="text-gray-600 mb-8">You haven't added any meal kits to your favorites yet.</p>
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl"> 
        <h1 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200"> 
          Your Favorites
        </h1>

        {favorites.length === 0 ? (
          <div className="text-center py-8"> {/* Reduced padding */}
            <p className="text-gray-600 text-sm">You haven't added any favorites yet.</p> 
          </div>
        ) : (
          <div className="space-y-3"> {/* Reduced gap between items */}
            {favorites.map((mealKit) => (
              <div
                key={mealKit._id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row" /* Smaller shadow */
              >
                {/* Compact Image */}
                <div 
                  className="cursor-pointer sm:w-1/4 h-28" /* Smaller image container */
                  onClick={() => handleMealKitClick(mealKit)}
                >
                  <img
                    src={getImageUrl(mealKit.image)}
                    alt={mealKit.title}
                    className="w-full h-full object-cover mt-2"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = assets.homePage;
                    }}
                  />
                </div>
                
                {/* Compact Details */}
                <div className="p-3 flex-1 flex flex-col"> {/* Reduced padding */}
                  <div 
                    className="cursor-pointer flex-1"
                    onClick={() => handleMealKitClick(mealKit)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-md font-semibold text-gray-800"> 
                          {mealKit.title || mealKit.name}
                        </h2>
                        <p className="text-gray-700 text-sm mt-1"> 
                          Rs. {mealKit.price}
                        </p>
                      </div>
                      <div
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          mealKit.availability === 'Available'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-700 text-white'
                        }`}
                      >
                        {mealKit.availability === 'Available' ? 'Available' : 'Out of stock'} {/* Shorter label */}
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-1 text-gray-600 text-sm"> {/* Smaller text */}
                      <span className="mr-1">Rating: {mealKit.rating || 0}</span>
                      <i className="fa-solid fa-star text-yellow-400"></i>
                    </div>
                  </div>
                  
                  <div className="flex justify-end"> {/* Reduced margin */}
                    <button
                      className="inline-flex items-center px-2 py-1 text-xs text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors" /* Smaller button */
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromFavorites(mealKit._id);
                      }}
                      disabled={removingItems[mealKit._id]}
                    >
                      {removingItems[mealKit._id] ? (
                        <span className="flex items-center">
                          Removing...
                        </span>
                      ) : (
                        <>
                          <i className="fa-solid fa-xmark text-xs px-1"></i>
                          Remove
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favourites;