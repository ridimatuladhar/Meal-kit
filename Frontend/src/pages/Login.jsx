import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Function to fetch user's cart after login
  const fetchCartAfterLogin = async () => {
    try {
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
          // Save the cart to localStorage
          localStorage.setItem('cart', JSON.stringify(data.cart));
          
          // Dispatch events to notify other components
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('cartUpdated'));
          
          // Custom event for token updates
          window.dispatchEvent(new CustomEvent('tokenUpdated'));
        }
      }
    } catch (error) {
      console.error('Error fetching cart after login:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!email || !password) {
      toast.error("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3000/api/auth/login',
        { email, password },
        { 
          withCredentials: true,
          validateStatus: function (status) {
            // Accept all status codes
            return true;
          }
        }
      );

      const data = response.data;

      if (data.success) {
        // Login successful
        localStorage.setItem('token', data.token);
        
        // Fetch cart immediately after login
        await fetchCartAfterLogin();
        
        toast.success("Login successful!");

        // Redirect based on role
        const redirectPath = data.role === "admin"
          ? "/admin/dashboard"
          : "/";
        navigate(redirectPath);
      } else {
        // Login failed - show the message from the server
        toast.error(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="flex w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
        <div
          className="w-1/2 hidden md:block bg-cover bg-center"
          style={{ backgroundImage: `url(${assets.loginImage})` }}
        ></div>

        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-sm relative">
            <Link to="/" className="absolute top-2 right-2 text-green-600 text-sm hover:underline">
              Back
            </Link>

            <h2 className="text-xl font-semibold text-gray-700 text-center">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">Sign in to your account</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block text-sm text-gray-600">Email Address</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 mt-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-600">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 mt-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="text-right mb-3">
                <Link to="/reset-password" className="text-green-600 text-xs hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full mt-24 text-white py-2 rounded-md text-sm hover:bg-green-700 transition"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : 'Login'}
              </button>
            </form>

            <p className="mt-3 text-xs text-center text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-green-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;