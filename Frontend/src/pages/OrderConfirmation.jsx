import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderNumber = location.state?.orderNumber;

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Order Confirmed!</h1>
        
        {orderNumber && (
          <p className="text-gray-600 mb-3">
            Your order number is: <span className="font-semibold">{orderNumber}</span>
          </p>
        )}
        
        <p className="text-gray-600 mb-6">
          Thank you for your order. You can check your order status anytime in the "My Orders" section of your profile.
        </p>
        
        <button
          onClick={handleGoHome}
          className="w-full py-3 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;