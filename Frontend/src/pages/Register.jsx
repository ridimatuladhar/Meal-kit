import React, { useState } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phoneNumber: "",
        address: "",
    });

    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Frontend validation
        if (!formData.name || !formData.email || !formData.password || !formData.phoneNumber || !formData.address) {
            setError("All fields are required");
            toast.error("All fields are required");
            return;
        }

        // Email validation
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            setError("Invalid email format");
            toast.error("Invalid email format");
            return;
        }

        // Password validation
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            toast.error("Password must be at least 8 characters long");
            return;
        }

        // Phone number validation
        if (!/^\d{10}$/.test(formData.phoneNumber)) {
            setError("Phone number must be exactly 10 digits");
            toast.error("Phone number must be exactly 10 digits");
            return;
        }

        try {
            const response = await axios.post(
                "http://localhost:3000/api/auth/register",
                formData,
                { withCredentials: true } // This is important for cookie-based auth
            );

            if (response.data.success) {
                // Store token in localStorage for frontend auth state
                localStorage.setItem('token', response.data.token);

                toast.success("Registration successful! Please verify your email.");

                // Send OTP verification request
                const otpResponse = await axios.post(
                    "http://localhost:3000/api/auth/send-verify-otp",
                    { userId: response.data.userId },
                    { withCredentials: true }
                );

                if (otpResponse.data.success) {
                    navigate("/email-verify", { state: { userId: response.data.userId } });
                } else {
                    setError(otpResponse.data.message || "Failed to send OTP.");
                }
            } else {
                setError(response.data.message || "Registration failed.");
                toast.error(response.data.message || "Registration failed.");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An error occurred during registration.";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="flex w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Left Side - Registration Form */}
                <div className="w-full md:w-1/2 flex items-center justify-center p-6">
                    <div className="w-full max-w-sm relative">
                        <Link to="/" className="absolute top-2 left-2 text-green-600 text-sm hover:underline">
                            Back
                        </Link>

                        <h2 className="text-xl font-semibold text-gray-700 text-center">Create an Account</h2>
                        <p className="text-sm text-gray-500 text-center mb-4">Sign up to get started</p>

                        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="block text-sm text-gray-600">User Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 mt-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm text-gray-600">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 mt-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your email"
                                    required
                                />
                                {formData.email && !/^\S+@\S+\.\S+$/.test(formData.email) && (
                                    <p className="text-red-500 text-xs mt-1">Invalid email format</p>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm text-gray-600">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 mt-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your password"
                                    required
                                />
                                {formData.password && formData.password.length < 8 && (
                                    <p className="text-red-500 text-xs mt-1">Password must be at least 8 characters</p>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm text-gray-600">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 mt-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your phone number"
                                    required
                                />
                                {formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber) && (
                                    <p className="text-red-500 text-xs mt-1">Phone number must be 10 digits</p>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm text-gray-600">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 mt-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your address"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 text-white py-2 rounded-md text-sm hover:bg-green-700 transition"
                            >
                                Register
                            </button>
                        </form>

                        <p className="mt-3 text-xs text-center text-gray-600">
                            Already have an account?{" "}
                            <Link to="/login" className="text-green-600 hover:underline">
                                Login
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Right Side - Image */}
                <div
                    className="w-1/2 hidden md:block bg-cover bg-center"
                    style={{ backgroundImage: `url(${assets.registerImage})` }}
                ></div>
            </div>
        </div>
    );
};

export default Register;