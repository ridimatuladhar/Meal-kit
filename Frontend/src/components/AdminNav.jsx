import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminNav = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) {
      localStorage.removeItem('token'); 
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white w-auto fixed left-0 top-0">
      {/* Logo or Brand Name */}
      <div className="p-6 text-xl font-bold border-b border-gray-700">
        Admin
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              to="/admin/dashboard"
              className="flex items-center p-2 hover:bg-gray-800 rounded transition duration-200"
            >
              <span className="ml-2"><i className="fa-solid fa-chart-simple px-1"></i> Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/users"
              className="flex items-center p-2 hover:bg-gray-800 rounded transition duration-200"
            >
              <span className="ml-2"><i className="fa-solid fa-users px-1"></i> Users</span>
            </Link>
          </li>
              
          <li>
            <Link
              to="/admin/mealkits"
              className="flex items-center p-2 hover:bg-gray-800 rounded transition duration-200"
            >
              <span className="ml-2"> <i className="fa-solid fa-boxes-stacked px-1"></i>Meal-kits</span>
            </Link>
          </li>
                    <li>
            <Link
              to="/admin/reviews"
              className="flex items-center p-2 hover:bg-gray-800 rounded transition duration-200"
            >
              <span className="ml-2"><i className="fa-solid fa-star px-1"></i>Reviews</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/orders"
              className="flex items-center p-2 hover:bg-gray-800 rounded transition duration-200"
            >
              <span className="ml-2"><i className="fa-solid fa-list-ul px-1"></i>Orders</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/payments"
              className="flex items-center p-2 hover:bg-gray-800 rounded transition duration-200"
            >
              <span className="ml-2"><i className="fa-solid fa-money-bill px-1"></i>Payments</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          className="w-full flex bg-gray-900 items-center p-2 hover:bg-gray-800 rounded transition duration-200"
          onClick={handleLogout}
        >
          <span className="ml-2 text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminNav;