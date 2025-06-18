import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { toast } from 'react-toastify';

const Settings = () => {
  // Create refs for input fields to maintain focus
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const addressInputRef = useRef(null);

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
  });

  const [originalData, setOriginalData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
  });
  
  const [loading, setLoading] = useState({
    name: false,
    email: false,
    phoneNumber: false,
    address: false
  });
  
  const [success, setSuccess] = useState({
    name: false,
    email: false,
    phoneNumber: false,
    address: false
  });

  const [errors, setErrors] = useState({
    phoneNumber: ""
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/user/data', {
          withCredentials: true
        });
        
        if (response.data.success) {
          const { user } = response.data.userData;
          const initialData = {
            name: user.name || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            address: user.address || "",
          };
          setUserData(initialData);
          setOriginalData(initialData);
        } else {
          toast.error(response.data.message || "Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error(error.response?.data?.message || "Network error. Please try again later.");
      }
    };
    
    fetchUserData();
  }, []);

  const handlePhoneChange = (e) => {
    const newValue = e.target.value;
    setUserData(prev => ({...prev, phoneNumber: newValue}));
    if (success.phoneNumber) {
      setSuccess(prev => ({...prev, phoneNumber: false}));
    }
    // Clear error when user starts typing
    if (errors.phoneNumber) {
      setErrors(prev => ({...prev, phoneNumber: ""}));
    }
  };

  const handleUpdateField = async (fieldName) => {
    // Don't update if value hasn't changed
    if (userData[fieldName] === originalData[fieldName]) return;

    // For phone number, validate format first
    if (fieldName === 'phoneNumber') {
  const phoneRegex = /^\d{10}$/; // Exactly 10 digits
  if (!phoneRegex.test(userData.phoneNumber)) {
    setErrors(prev => ({...prev, phoneNumber: "Phone number must be exactly 10 digits."}));
    return;
  }
}


    setLoading(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      const response = await axios.patch('http://localhost:3000/api/user/update', { 
        [fieldName]: userData[fieldName] 
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setSuccess(prev => ({ ...prev, [fieldName]: true }));
        // Update original data to reflect the new saved state
        setOriginalData(prev => ({ ...prev, [fieldName]: userData[fieldName] }));
        
        toast.success(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} updated successfully!`);
        
        setTimeout(() => {
          setSuccess(prev => ({ ...prev, [fieldName]: false }));
        }, 2000);
      } else {
        throw new Error(response.data.message || `Failed to update ${fieldName}`);
      }
    } catch (error) {      
      // Handle duplicate phone number error specifically
      if (fieldName === 'phoneNumber' && 
          error.response?.data?.message?.includes('duplicate') || 
          error.response?.data?.message?.includes('already exists')) {
        setErrors(prev => ({
          ...prev,
          phoneNumber: "This phone number is already in use. Please use a different one."
        }));
        // Revert to original phone number
        setUserData(prev => ({...prev, phoneNumber: originalData.phoneNumber}));
      } else {
        toast.error(error.response?.data?.message || "This phone number is already in use. Please use a different one.");
      }
    } finally {
      setLoading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  // Other handlers remain the same
  const handleNameChange = (e) => {
    const newValue = e.target.value;
    setUserData(prev => ({...prev, name: newValue}));
    if (success.name) {
      setSuccess(prev => ({...prev, name: false}));
    }
  };

  const handleEmailChange = (e) => {
    const newValue = e.target.value;
    setUserData(prev => ({...prev, email: newValue}));
    if (success.email) {
      setSuccess(prev => ({...prev, email: false}));
    }
  };

  const handleAddressChange = (e) => {
    const newValue = e.target.value;
    setUserData(prev => ({...prev, address: newValue}));
    if (success.address) {
      setSuccess(prev => ({...prev, address: false}));
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-green-800 p-6">
            <h1 className="text-xl font-bold text-white">Profile Settings</h1>
          </div>

          <div className="divide-y">
            {/* Email Field */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b">
              <label htmlFor="email" className="w-full md:w-1/4 text-sm font-medium">Email</label>
              <div className="w-full md:w-3/4 flex items-center gap-2">
                <input
                  id="email"
                  type="email"
                  ref={emailInputRef}
                  value={userData.email}
                  onChange={handleEmailChange}
                  className="flex-grow p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Name Field */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b">
              <label htmlFor="name" className="w-full md:w-1/4 text-sm font-medium">Name</label>
              <div className="w-full md:w-3/4 flex items-center gap-2">
                <input
                  id="name"
                  type="text"
                  ref={nameInputRef}
                  value={userData.name}
                  onChange={handleNameChange}
                  className="flex-grow p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleUpdateField("name")}
                  disabled={loading.name || userData.name === originalData.name}
                  className={`px-4 py-2 rounded text-white min-w-20 ${
                    loading.name 
                      ? 'bg-gray-400' 
                      : success.name && userData.name === originalData.name
                        ? 'bg-green-600' 
                        : userData.name !== originalData.name
                          ? 'hover:bg-green-700' 
                          : 'bg-gray-300'
                  } transition-colors`}
                >
                  {loading.name 
                    ? 'Saving...' 
                    : success.name && userData.name === originalData.name
                      ? 'Saved!' 
                      : 'Update'}
                </button>
              </div>
            </div>

            {/* Phone Number Field with error handling */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b">
              <label htmlFor="phoneNumber" className="w-full md:w-1/4 text-sm font-medium">Phone Number</label>
              <div className="w-full md:w-3/4">
                <div className="flex items-center gap-2">
                  <input
                    id="phoneNumber"
                    type="tel"
                    ref={phoneInputRef}
                    value={userData.phoneNumber}
                    onChange={handlePhoneChange}
                    className={`flex-grow p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.phoneNumber ? 'border-red-500' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateField("phoneNumber")}
                    disabled={loading.phoneNumber || userData.phoneNumber === originalData.phoneNumber || errors.phoneNumber}
                    className={`px-4 py-2 rounded text-white min-w-20 ${
                      loading.phoneNumber 
                        ? 'bg-gray-400' 
                        : success.phoneNumber && userData.phoneNumber === originalData.phoneNumber
                          ? 'bg-green-600' 
                          : userData.phoneNumber !== originalData.phoneNumber
                            ? 'hover:bg-green-700' 
                            : 'bg-gray-300'
                    } transition-colors`}
                  >
                    {loading.phoneNumber 
                      ? 'Saving...' 
                      : success.phoneNumber && userData.phoneNumber === originalData.phoneNumber
                        ? 'Saved!' 
                        : 'Update'}
                  </button>
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            {/* Address Field */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b">
              <label htmlFor="address" className="w-full md:w-1/4 text-sm font-medium">Address</label>
              <div className="w-full md:w-3/4 flex items-center gap-2">
                <input
                  id="address"
                  type="text"
                  ref={addressInputRef}
                  value={userData.address}
                  onChange={handleAddressChange}
                  className="flex-grow p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateField("address")}
                  disabled={loading.address || userData.address === originalData.address}
                  className={`px-4 py-2 rounded text-white min-w-20 ${
                    loading.address 
                      ? 'bg-gray-400' 
                      : success.address && userData.address === originalData.address
                        ? 'bg-green-600' 
                        : userData.address !== originalData.address
                          ? 'hover:bg-green-700' 
                          : 'bg-gray-300'
                  } transition-colors`}
                >
                  {loading.address 
                    ? 'Saving...' 
                    : success.address && userData.address === originalData.address
                      ? 'Saved!' 
                      : 'Update'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-500">
              Your information is securely stored and will never be shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;