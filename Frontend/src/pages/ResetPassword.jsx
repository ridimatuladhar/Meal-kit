import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/send-reset-otp', { email });
      if (response.data.success) {
        toast.success('OTP sent to your email.');
        setStep(2); // Move to the next step
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP.');
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      if (response.data.success) {
        toast.success('Password reset successfully.');
        navigate('/login'); // Redirect to login page
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>

        {step === 1 && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => navigate(-1)} // Go back to the previous page
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition"
              >
                Back
              </button>
              <button
                onClick={handleSendOtp}
                className="text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
              >
                Send OTP
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">OTP</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)} // Go back to Step 1
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition"
              >
                Back
              </button>
              <button
                onClick={handleResetPassword}
                className="text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
              >
                Reset Password
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;