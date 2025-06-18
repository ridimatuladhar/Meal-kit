import React, { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets'; // Import assets for fallback image

const Mealkits = () => {
  const [mealKits, setMealKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mealKitToDelete, setMealKitToDelete] = useState(null);
  const navigate = useNavigate();
  
  // Sorting states
  const [sortField, setSortField] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [originalMealKits, setOriginalMealKits] = useState([]);

  // Helper function to get proper image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return assets.homePage;
    
    // If it's already a full URL (starts with http or https), use it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a path from our uploads directory, prefix with server URL
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:3000${imagePath}`;
    }
    
    // Default fallback image
    return assets.homePage;
  };

  useEffect(() => {
    const fetchMealKits = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/user/meal-kits', {
          withCredentials: true
        });
        
        // Store original data
        setOriginalMealKits(response.data);
        setMealKits(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMealKits();
  }, []);

  // Sort meal kits
  const sortMealKits = (field) => {
    // If clicking the same field, toggle direction
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    
    setSortField(field);
    setSortDirection(newDirection);
    
    const sortedMealKits = [...mealKits].sort((a, b) => {
      // Handle numeric fields
      if (field === 'price' || field === 'rating') {
        const aValue = parseFloat(a[field]) || 0;
        const bValue = parseFloat(b[field]) || 0;
        
        return newDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle availability field specially
      if (field === 'availability') {
        // Sort "Available" first in ascending order
        if (newDirection === 'asc') {
          return a[field] === 'Available' ? -1 : 1;
        } else {
          return a[field] === 'Available' ? 1 : -1;
        }
      }
      
      // Handle string fields
      const aValue = a[field] ? a[field].toString().toLowerCase() : '';
      const bValue = b[field] ? b[field].toString().toLowerCase() : '';
      
      if (newDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
    
    setMealKits(sortedMealKits);
  };

  // Reset sorting
  const resetSort = () => {
    setSortField('title');
    setSortDirection('asc');
    setMealKits([...originalMealKits]);
  };

  // Get sort indicator (arrow up/down)
  const getSortIndicator = (field) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleEdit = (id) => {
    // Find the meal kit to edit
    const mealKitToEdit = mealKits.find(kit => kit._id === id);
    if (mealKitToEdit) {
      navigate(`/admin/mealkits/edit/${id}`, { state: { mealKit: mealKitToEdit } });
    } else {
      alert('Meal kit not found');
    }
  };

  const confirmDelete = (id) => {
    setMealKitToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!mealKitToDelete) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/admin/meal-kits/${mealKitToDelete}`, {
        withCredentials: true
      });
      
      const updatedMealKits = mealKits.filter(kit => kit._id !== mealKitToDelete);
      setMealKits(updatedMealKits);
      setOriginalMealKits(originalMealKits.filter(kit => kit._id !== mealKitToDelete));
      
      setShowDeleteModal(false);
      alert('Meal kit deleted successfully!');
    } catch (err) {
      console.error('Error deleting meal kit:', err);
      alert('Failed to delete meal kit');
    } finally {
      setMealKitToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setMealKitToDelete(null);
  };

  const handleCreateMealKit = () => {
    navigate('/admin/mealkits/add');
  };

  if (loading) return (
    <div>
      <AdminNav />
      <div className="flex-1 ml-40 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading meal kits...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div>
      <AdminNav />
      <div className="flex-1 ml-40 p-6">
        <div className="bg-gray-100 border border-gray-400 text-gray-700 px-6 py-4 rounded-lg shadow-md" role="alert">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p className="text-sm"> {error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="flex-1 ml-40 p-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meal-Kits Management</h1>
          <p className="text-gray-600 border-b border-gray-200 pb-3">Manage and update meal kit information</p>
        </div>

        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-700">
            Total Meal Kits: <span className="font-semibold">{mealKits.length}</span>
          </div>
          <button
            onClick={handleCreateMealKit}
            className="bg-black hover:bg-gray-800 text-white py-2 px-6 rounded-md transition-colors text-sm font-medium"
          >
            Create Meal-Kit
          </button>
        </div>

        {/* Sorting Controls */}
        <div className="mb-4 bg-white p-2 px-4 rounded-lg shadow-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Sort by:</span>
            
            <button 
              onClick={() => sortMealKits('price')}
              className={`px-3 py-1.5 text-sm rounded ${sortField === 'price' ? 'bg-black text-white' : 'bg-white text-gray-800'} border border-gray-300 hover:bg-gray-100 transition-colors`}
            >
              Price {getSortIndicator('price')}
            </button>
            
            <button 
              onClick={() => sortMealKits('rating')}
              className={`px-3 py-1.5 text-sm rounded ${sortField === 'rating' ? 'bg-black text-white' : 'bg-white text-gray-800'} border border-gray-300 hover:bg-gray-100 transition-colors`}
            >
              Rating {getSortIndicator('rating')}
            </button>
            
            <button 
              onClick={() => sortMealKits('availability')}
              className={`px-3 py-1.5 text-sm rounded ${sortField === 'availability' ? 'bg-black text-white' : 'bg-white text-gray-800'} border border-gray-300 hover:bg-gray-100 transition-colors`}
            >
              Availability {getSortIndicator('availability')}
            </button>
            
            <button 
              onClick={() => sortMealKits('title')}
              className={`px-3 py-1.5 text-sm rounded ${sortField === 'title' ? 'bg-black text-white' : 'bg-white text-gray-800'} border border-gray-300 hover:bg-gray-100 transition-colors`}
            >
              Name {getSortIndicator('title')}
            </button>
            
            {(sortField !== 'title' || sortDirection !== 'asc') && (
              <button 
                onClick={resetSort}
                className="px-3 py-1.5 text-sm rounded bg-gray-200 hover:bg-gray-300 text-gray-800 ml-auto transition-colors"
              >
                Reset Sort
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Confirm Deletion</h3>
              <p className="text-gray-700 mb-6">Are you sure you want to delete this meal kit? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-5 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
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
                    className="py-2 px-6 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => sortMealKits('title')}
                  >
                    Name {getSortIndicator('title')}
                  </th>
                  <th className="py-2 px-6 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th 
                    className="py-2 px-6 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => sortMealKits('rating')}
                  >
                    Rating {getSortIndicator('rating')} 
                  </th>
                  <th className="py-2 px-6 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Image
                  </th>
                  <th 
                    className="py-2 px-6 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => sortMealKits('price')}
                  >
                    Price {getSortIndicator('price')}
                  </th>
                  <th 
                    className="py-2 px-6 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => sortMealKits('availability')}
                  >
                    Status {getSortIndicator('availability')}
                  </th>
                  <th className="py-2 px-6 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mealKits.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 px-6 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <p className="text-lg font-medium">No meal kits found</p>
                        <p className="text-sm text-gray-500 mt-1">Start by adding your first meal kit</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  mealKits.map((mealKit) => (
                    <tr key={mealKit._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{mealKit.title}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-700">
                          {mealKit.desc.length > 50 
                            ? `${mealKit.desc.substring(0, 50)}...` 
                            : mealKit.desc}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <span className="font-medium text-sm text-gray-900">{mealKit.rating || 0}</span>
      
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <img
                          src={getImageUrl(mealKit.image)}
                          alt={mealKit.title}
                          className="w-16 h-16 object-cover rounded-md shadow-sm"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = assets.homePage;
                          }}
                        />
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="text-gray-900 text-sm">Rs. {mealKit.price}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          mealKit.availability === 'Available' 
                            ? 'bg-gray-200 text-gray-800 text-xs' 
                            : 'bg-gray-700 text-white text-xs'
                        }`}>
                          {mealKit.availability}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button
                            className="text-white text-sm py-1.5 px-4 rounded-md bg-black hover:bg-gray-800 transition-colors"
                            onClick={() => handleEdit(mealKit._id)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-gray-800 text-sm py-1.5 px-4 rounded-md bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                            onClick={() => confirmDelete(mealKit._id)}
                          >
                            Delete
                          </button>
                        </div>
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

export default Mealkits;