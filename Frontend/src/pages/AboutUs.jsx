import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-green-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">About Easy-Khana</h1>
          <p className="text-lg max-w-2xl mx-auto">
            Your hassle-free solution for delicious home-cooked meals
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">How Easy Khana Works</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-cart-shopping"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">1. Select Your Meals</h3>
              <p className="text-gray-600 text-sm">
                Choose from our weekly rotating menu of chef-designed recipes
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-clock"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">2. Choose Delivery</h3>
              <p className="text-gray-600 text-sm">
                Pick your preferred delivery date and time slot
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-truck"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">3. We Deliver</h3>
              <p className="text-gray-600 text-sm">
                Receive fresh, pre-portioned ingredients at your doorstep
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-utensils"></i>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">4. Cook & Enjoy</h3>
              <p className="text-gray-600 text-sm">
                Follow our easy step-by-step recipes in under 30 minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Promise Section */}
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Our Quality Promise</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">Fresh Ingredients</h3>
              <p className="text-gray-600">
                We source seasonal produce daily and deliver it at peak freshness. All ingredients are carefully portioned and packed to maintain quality.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">Easy Cooking</h3>
              <p className="text-gray-600">
                Our recipes come with clear, step-by-step instructions designed for all skill levels. Most meals can be prepared in 30 minutes or less.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">Flexible Plans</h3>
              <p className="text-gray-600">
                Order what you want, when you want. No subscriptions required. Skip or cancel before the package is out for delivery.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">Reliable Delivery</h3>
              <p className="text-gray-600">
                We offer convenient delivery and temperature-controlled packaging to ensure your ingredients arrive in perfect condition.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;