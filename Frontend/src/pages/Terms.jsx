import React from 'react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)} // Goes back to previous page
          className="inline-flex items-center bg-white text-green-600 hover:text-green-800 transition-colors"
        >

          Back
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
        <p className="mb-6">
          By using our service, you agree to these terms. If you don't agree, please don't use our service.
        </p>

        <h2 className="text-xl font-semib  old  mb-4">2. Service Description</h2>
        <p className="mb-6">
          We provide meal kit delivery services. We may change or stop the service at any time.
        </p>

        <h2 className="text-xl font-semib  old  mb-4">3. User Responsibilities</h2>
        <p className="mb-6">
          Keep your account information accurate and secure. You're responsible for all activity under your account.
        </p>

        <h2 className="text-xl font-semib  old  mb-4">4. Payment and Billing</h2>
        <p className="mb-6">
          Payments are processed securely. You agree to pay all charges, including taxes.
        </p>

        <h2 className="text-xl font-semib  old  mb-4">5. Cancellation Policy</h2>
        <p className="mb-6">
          Cancel anytime. Cancel at least 24 hours before delivery to avoid charges.
        </p>

        <h2 className="text-xl font-semib  old  mb-4">6. Changes to Terms</h2>
        <p className="mb-6">
          We may update these terms. Continued use means you accept the changes.
        </p>

        <p className="text-sm text-gray-500 mt-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default Terms;