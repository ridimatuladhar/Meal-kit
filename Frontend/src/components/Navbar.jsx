import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import Cookies from 'js-cookie';
import './Components.css';

const Navbar = () => {
  const [menu, setMenu] = useState('Browse');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Function to update cart count from localStorage
  const updateCartCount = () => {
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        const cart = JSON.parse(storedCart);
        const itemCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        setCartItemCount(itemCount);
      } else {
        setCartItemCount(0);
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
      setCartItemCount(0);
    }
  };

  // Check login status and update menu based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/menu') {
      setMenu('Menu');
    } else if (path === '/about-us') {
      setMenu('About-us');
    } else if (path.startsWith('/profile')) {
      setMenu('Profile');
    } else {
      setMenu('Browse');
    }

    // Check if the user is logged in
    const token = localStorage.getItem('token');
    const wasLoggedIn = isLoggedIn;
    const isNowLoggedIn = !!token;
    
    setIsLoggedIn(isNowLoggedIn);
    
    // If login status changed, update cart count immediately
    if (!wasLoggedIn && isNowLoggedIn) {
      updateCartCount();
      // Fetch cart from server after login
      fetchServerCart();
    }
  }, [location.pathname, isLoggedIn]);
  
  // Fetch cart from server after login
  const fetchServerCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:3000/api/cart', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.cart) {
          // Update localStorage with server cart
          localStorage.setItem('cart', JSON.stringify(data.cart));
          // Update cart count
          updateCartCount();
        }
      }
    } catch (error) {
      console.error('Error fetching cart from server:', error);
    }
  };
  
  // Update cart count when component mounts and when localStorage changes
  useEffect(() => {
    // Initial count
    updateCartCount();
    
    // Setup listener for storage changes
    window.addEventListener('storage', updateCartCount);
    
    // Listen for custom events for cart updates
    window.addEventListener('cartUpdated', updateCartCount);
    
    // Check token changes
    const handleTokenChange = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      
      // If logged in, update cart count
      if (token) {
        updateCartCount();
        fetchServerCart();
      }
    };
    
    window.addEventListener('tokenUpdated', handleTokenChange);
    
    // Poll for changes (reduced interval for better responsiveness)
    const interval = setInterval(updateCartCount, 500);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('tokenUpdated', handleTokenChange);
      clearInterval(interval);
    };
  }, []);

  const handleProfileDropdownToggle = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        localStorage.removeItem('token'); 
        localStorage.removeItem('cart'); 
        Cookies.remove('token');
        setIsLoggedIn(false);
        setCartItemCount(0); // Reset cart count on logout
        setIsLogoutModalOpen(false);
        navigate('/');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleLogoutCancel = () => {
    setIsLogoutModalOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
        <Link to='/'>
        <button>
          <img src={assets.logo} alt="Easy Khana logo" className="logo bg-white" />
          </button>
        </Link>

          <div className="hamburger" onClick={toggleMenu}>
            <i className="fa-solid fa-bars"></i>
          </div>

          <ul className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/">
              <li className={menu === 'Browse' ? 'active' : ''}>
                <i className="fa-solid fa-house"></i>Browse
              </li>
            </Link>
            <Link to="/menu">
              <li className={menu === 'Menu' ? 'active' : ''}>
                <i className="fa-solid fa-utensils"></i>Menu
              </li>
            </Link>
            <Link to="/about-us">
              <li className={menu === 'About-us' ? 'active' : ''}>
                <i className="fa-solid fa-comment-dots"></i>About Us
              </li>
            </Link>
            {isLoggedIn && (
              <li onClick={handleProfileDropdownToggle} className={menu === 'Profile' ? 'active' : ''}>
                <i className="fa-solid fa-user"></i>Profile
                {isProfileDropdownOpen && (
                  <ul className="profile-dropdown">
                    <Link to="/profile/settings">
                      <li><i className="fa-solid fa-gear"></i>Settings</li>
                    </Link>
                    <Link to="/profile/favourite">
                      <li><i className="fa-solid fa-heart"></i>Favourites</li>
                    </Link>
                    <Link to="/profile/orders">
                      <li><i className="fa-solid fa-list-ul"></i>My Orders</li>
                    </Link>
                    <li onClick={handleLogoutClick}>
                      <i className="fa-solid fa-right-to-bracket"></i>Logout
                    </li>
                  </ul>
                )}
              </li>
            )}
          </ul>

          <div className="navbar-right">
          {isLoggedIn && (
            <Link to="/cart">
              <li className="btn mx-2 relative">
                <i className="fa-solid fa-cart-shopping"></i>
                {cartItemCount > 0 && (
                  <div className="dot flex items-center justify-center">
                    <span className="cart-count">{cartItemCount}</span>
                  </div>
                )}
              </li>
            </Link>
          )}
            
            <div className="dot"></div>
            {!isLoggedIn && (
              <Link to="/login">
                <button className="login">
                  <i className="fa-solid fa-right-to-bracket"></i>Login
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Are you sure you want to log out?</h2>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleLogoutCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;