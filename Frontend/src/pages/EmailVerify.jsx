import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from "react-toastify";

const EmailVerify = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6 || isNaN(otp)) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'http://localhost:3000/api/auth/verify-account',
        { userId, otp },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Email verified successfully!');
        navigate('/');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md border border-green-200">
        <h2 className="text-2xl font-bold text-green-700 text-center mb-3">
          Email Verification
        </h2>
        <p className="text-sm text-green-600 text-center mb-5">
          Enter the 6-digit OTP sent to your email
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-green-700">
              OTP Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              className="w-full px-4 py-2 mt-1 border border-green-300 rounded-lg text-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              maxLength={6}
              placeholder="123456"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

      
       
      </div>
    </div>
  );
};

export default EmailVerify;
