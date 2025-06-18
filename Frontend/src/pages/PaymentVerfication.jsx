import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const PaymentVerification = () => {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Parse URL parameters
        const params = new URLSearchParams(location.search);
        const pidx = params.get('pidx');
        const status = params.get('status');
        const transactionId = localStorage.getItem('transactionId');
        
        
        if (!pidx || !transactionId) {
          toast.error('Missing payment information');
          navigate('/checkout');
          return;
        }
        
        if (status !== 'Completed') {
          toast.error('Payment was not completed');
          navigate('/checkout');
          return;
        }
        
        // Verify payment with backend
        const response = await fetch('http://localhost:3000/api/order/khalti/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          credentials: 'include',
          body: JSON.stringify({ pidx, transactionId })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Payment verification failed');
        }
        
        
        toast.success('Payment verified successfully!');
        navigate('/order-confirmation', { state: { orderNumber: data.order?.orderNumber } });
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error(error.message || 'Failed to verify payment');
        navigate('/checkout');
      } finally {
        setVerifying(false);
      }
    };
    
    verifyPayment();
  }, [navigate, location]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">
          {verifying ? 'Verifying Payment...' : verified ? 'Payment Successful!' : 'Payment Verification Failed'}
        </h1>
        
        {verifying ? (
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : verified ? (
          <div className="text-green-500 my-6">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p className="mt-4">Your order has been confirmed!</p>
          </div>
        ) : (
          <div className="text-red-500 my-6">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <p className="mt-4">There was a problem with your payment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentVerification;