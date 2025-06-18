import React from 'react';

const Footer = () => {
  return (
    <div className='mt-4'>
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto px-4">
        {/* Follow Us Section */}
        <div className="text-center mb-6">
          <h3 className="mb-2 text-gray-400 ">Follow Us</h3>
          <div className="flex justify-center space-x-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition"
            >
              <i className="fab fa-facebook text-2xl"></i>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition"
            >
              <i className="fab fa-twitter text-2xl"></i>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition"
            >
              <i className="fab fa-instagram text-2xl"></i>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition"
            >
              <i className="fab fa-linkedin text-2xl"></i>
            </a>
          </div>
        </div>

        {/* Credit Line */}
        <div className="border-t border-gray-700 pt-2 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Easy-Khana. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
    </div>
  );
};

export default Footer;