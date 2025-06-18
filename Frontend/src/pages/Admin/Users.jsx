import React, { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import axios from 'axios';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3000/api/admin/users', {
          withCredentials: true
        });

        if (response.data.success && response.data.users) {
          const customerUsers = response.data.users.filter(
            (user) => user.role === 'customer'
          );
          setUsers(customerUsers);
        } else {
          setError('Invalid response format.');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Show delete confirmation modal
  const confirmDelete = (userId) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirmed = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await axios.delete(
        `http://localhost:3000/api/admin/delete-user`,
        { 
          data: { userId: userToDelete },
          withCredentials: true
        }
      );

      if (response.data.success) {
        setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userToDelete));
        alert('User deleted successfully!');
      } else {
        alert('Failed to delete user.');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user.');
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Sorting function
  const sortUsers = (field) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    const sortedUsers = [...users].sort((a, b) => {
      // Special case for verification status
      if (field === 'isAccountVerified') {
        const aValue = a[field] ? 1 : 0;
        const bValue = b[field] ? 1 : 0;
        return newDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // For string fields
      const aValue = a[field] ? String(a[field]).toLowerCase() : '';
      const bValue = b[field] ? String(b[field]).toLowerCase() : '';
      
      if (newDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
    
    setUsers(sortedUsers);
  };

  // Get sort indicator
  const getSortIndicator = (field) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div>
        <AdminNav />
        <div className="flex-1 ml-40 p-6 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <AdminNav />
        <div className="flex-1 ml-40 p-6">
          <div className="bg-gray-100 border border-gray-400 text-gray-700 px-6 py-4 rounded-lg shadow-md" role="alert">
            <h3 className="font-bold text-lg mb-2">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="flex-1 ml-40 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600 border-b border-gray-200 pb-3">Manage customer accounts and information</p>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-700">
            Total Customers: <span className="font-semibold">{users.length}</span>
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Confirm Deletion</h3>
              <p className="text-gray-700 mb-6">Are you sure you want to delete this user? This action cannot be undone and will remove all associated data.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-5 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirmed}
                  className="px-5 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => sortUsers('name')}
                  >
                    Name {getSortIndicator('name')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => sortUsers('email')}
                  >
                    Email {getSortIndicator('email')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    Phone Number
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    Address
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    Profile
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => sortUsers('isAccountVerified')}
                  >
                    Verified {getSortIndicator('isAccountVerified')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 px-6 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm text-gray-500 mt-1">There are currently no customers registered</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{user.phoneNumber || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 truncate max-w-xs">{user.address || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 text-sm font-medium">
                              {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.isAccountVerified 
                            ? 'bg-gray-200 text-gray-800' 
                            : 'bg-gray-700 text-white'
                        }`}>
                          {user.isAccountVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => confirmDelete(user._id)}
                          className="text-gray-800 text-sm py-1.5 px-4 rounded-md bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;