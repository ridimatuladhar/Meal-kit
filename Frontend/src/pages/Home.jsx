import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Card from '../components/Card';
import { Link } from "react-router-dom";
import { assets } from '../assets/assets';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div>
      <Navbar />
      
      <div className="relative w-[90%] mx-auto"> 
        
        <img 
          src={assets.homeTop}
          alt="Descriptive Alt Text" 
          className="w-full h-[400px] object-cover rounded-xl" 
        />
       
        
        {/* Center the quote and button in the middle of the image */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Fresh ingredients, easy recipes, and delicious meals—delivered to your door!</h2>
          
          {isLoggedIn ? (
            <button 
              className="text-white py-2 px-4 rounded-md font-semibold text-lg hover:bg-green-700 transition"
            >
              Welcome Back
            </button>
          ) : (
            <Link to='/register'>
              <button 
                className="text-white py-2 px-4 rounded-md font-semibold hover:bg-green-700 transition"
              >
                Getting Started
              </button>
            </Link>
          )}
        </div>
      </div>
     
      <div className="py-4">
        <Card />
      </div>
      
      <Footer />
    </div>
  );
}

export default Home;