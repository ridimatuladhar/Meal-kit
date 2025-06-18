import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminNav from '../../components/AdminNav';
import { assets } from '../../assets/assets';

const EditMealkit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initial form state
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    image: null, // This will hold the file object if a new image is selected
    ingredientsIncluded: [''],
    ingredientsNotIncluded: [''],
    steps: [''],
    tags: [''],
    ctime: '',
    ptime: '',
    servings: '',
    availability: 'Available',
    price: ''
  });
  
  // State for current image
  const [currentImage, setCurrentImage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  
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
  
  // Fetch meal kit data if not available in location state
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if we have data in location state
        if (location.state?.mealKit) {
          initializeFormData(location.state.mealKit);
          setIsLoading(false);
        } else if (id) {
          // Fetch data from API if not available in state
          const response = await axios.get(`http://localhost:3000/api/user/meal-kits/${id}`, {
            withCredentials: true
          });
          
          if (response.data) {
            initializeFormData(response.data);
          }
        } else {
          toast.error('Meal kit ID not found');
          navigate('/admin/mealkits');
        }
      } catch (error) {
        console.error('Error fetching meal kit:', error);
        toast.error('Failed to load meal kit data');
        navigate('/admin/mealkits');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, location.state]);
  
  // Initialize form data from meal kit object
  const initializeFormData = (mealKit) => {
    setFormData({
      title: mealKit.title || '',
      desc: mealKit.desc || '',
      // Don't set image file here, just keep track of the current image URL
      ingredientsIncluded: mealKit.ingredientsIncluded?.length ? mealKit.ingredientsIncluded : [''],
      ingredientsNotIncluded: mealKit.ingredientsNotIncluded?.length ? mealKit.ingredientsNotIncluded : [''],
      steps: mealKit.steps?.length ? mealKit.steps : [''],
      tags: mealKit.tags?.length ? mealKit.tags : [''],
      ctime: mealKit.ctime || '',
      ptime: mealKit.ptime || '',
      servings: mealKit.servings || '',
      availability: mealKit.availability || 'Available',
      price: mealKit.price || ''
    });
    
    // Set current image URL
    const imageUrl = getImageUrl(mealKit.image);
    setCurrentImage(imageUrl);
    setPreviewImage(imageUrl);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleArrayChange = (name, index, value) => {
    const newArray = [...formData[name]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [name]: newArray
    });
  };

  const addArrayItem = (name) => {
    setFormData({
      ...formData,
      [name]: [...formData[name], '']
    });
  };

  const removeArrayItem = (name, index) => {
    if (formData[name].length <= 1) return; // Prevent removing the last item
    
    const newArray = formData[name].filter((_, i) => i !== index);
    setFormData({
      ...formData,
      [name]: newArray
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };
  
  const clearImage = () => {
    setPreviewImage(null);
    setFormData({ ...formData, image: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create a new FormData instance
      const formDataToSend = new FormData();
      
      // Add simple fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('desc', formData.desc);
      formDataToSend.append('ctime', formData.ctime);
      formDataToSend.append('ptime', formData.ptime);
      formDataToSend.append('servings', formData.servings);
      formDataToSend.append('availability', formData.availability);
      formDataToSend.append('price', formData.price);
      
      // Add image if a new one was selected
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      } else if (currentImage) {
        // If using existing image, pass the current image path
        formDataToSend.append('image', currentImage);
      }
      
      // Add arrays as JSON strings
      formDataToSend.append('ingredientsIncluded', JSON.stringify(formData.ingredientsIncluded.filter(item => item.trim())));
      formDataToSend.append('ingredientsNotIncluded', JSON.stringify(formData.ingredientsNotIncluded.filter(item => item.trim())));
      formDataToSend.append('steps', JSON.stringify(formData.steps.filter(item => item.trim())));
      formDataToSend.append('tags', JSON.stringify(formData.tags.filter(item => item.trim())));

      const response = await axios.put(`http://localhost:3000/api/admin/meal-kits/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      
      if (response.data && (response.status === 200 || response.status === 201)) {
        toast.success('Meal kit updated successfully!');
        navigate('/admin/mealkits');
      } else {
        toast.error(response.data.message || 'Failed to update meal kit');
      }
    } catch (error) {
      console.error('Error updating meal kit:', error);
      toast.error(error.response?.data?.message || 'Failed to update meal kit');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
      <AdminNav />
      <div className="flex-1 ml-40 p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading meal kit data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminNav />
      <div className="flex-1 ml-40 p-6">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/admin/mealkits')}
              className="flex items-center text-black hover:text-gray-700 bg-white border border-black rounded px-4 py-2"
            >
              Back
            </button>
            <h1 className="text-3xl font-bold text-black">Edit Meal-Kit</h1>
            <div className="w-8"></div> {/* Spacer for alignment */}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-black font-medium mb-2">Title*</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-black font-medium mb-2">Description*</label>
              <textarea
                name="desc"
                value={formData.desc}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-black font-medium mb-2">Image</label>
              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Current Image Preview */}
                {previewImage && (
                  <div className="relative">
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="h-40 object-cover border border-black rounded" 
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full transform translate-x-1/2 -translate-y-1/2"
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {/* Image Upload Input */}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {!previewImage ? "Upload a new image" : "Current image will be used if no new image is selected"}
                  </p>
                </div>
              </div>
            </div>

            {/* Ingredients Included */}
            <div>
              <label className="block text-black font-medium mb-2">Ingredients Included*</label>
              {formData.ingredientsIncluded.map((item, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('ingredientsIncluded', index, e.target.value)}
                    required
                    className="flex-1 px-4 py-2 border border-black rounded-l focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('ingredientsIncluded', index)}
                    disabled={formData.ingredientsIncluded.length <= 1}
                    className="px-4 py-2 bg-black text-white rounded-r hover:bg-gray-800 disabled:opacity-50 disabled:bg-gray-500"
                  >
                   <i className="fa-solid fa-minus"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('ingredientsIncluded')}
                className="mt-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              >
                Add Ingredient
              </button>
            </div>

            {/* Ingredients Not Included */}
            <div>
              <label className="block text-black font-medium mb-2">Ingredients Not Included</label>
              {formData.ingredientsNotIncluded.map((item, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('ingredientsNotIncluded', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-black rounded-l focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('ingredientsNotIncluded', index)}
                    disabled={formData.ingredientsNotIncluded.length <= 1}
                    className="px-4 py-2 bg-black text-white rounded-r hover:bg-gray-800 disabled:opacity-50 disabled:bg-gray-500"
                  >
                    <i className="fa-solid fa-minus"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('ingredientsNotIncluded')}
                className="mt-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              >
                Add Ingredient
              </button>
            </div>

            {/* Steps */}
            <div>
              <label className="block text-black font-medium mb-2">Steps*</label>
              {formData.steps.map((item, index) => (
                <div key={index} className="flex mb-2">
                  <textarea
                    value={item}
                    onChange={(e) => handleArrayChange('steps', index, e.target.value)}
                    required
                    rows={2}
                    className="flex-1 px-4 py-2 border border-black rounded-l focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('steps', index)}
                    disabled={formData.steps.length <= 1}
                    className="px-4 py-2 bg-black text-white rounded-r hover:bg-gray-800 disabled:opacity-50 disabled:bg-gray-500"
                  >
                   <i className="fa-solid fa-minus"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('steps')}
                className="mt-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              >
                Add Step
              </button>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-black font-medium mb-2">Tags*</label>
              {formData.tags.map((item, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                    required
                    className="flex-1 px-4 py-2 border border-black rounded-l focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('tags', index)}
                    disabled={formData.tags.length <= 1}
                    className="px-4 py-2 bg-black text-white rounded-r hover:bg-gray-800 disabled:opacity-50 disabled:bg-gray-500"
                  >
                   <i className="fa-solid fa-minus"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('tags')}
                className="mt-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              >
                Add Tag
              </button>
            </div>

            {/* Cooking Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-black font-medium mb-2">Cooking Time (minutes)*</label>
                <input
                  type="number"
                  name="ctime"
                  value={formData.ctime}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Preparation Time */}
              <div>
                <label className="block text-black font-medium mb-2">Preparation Time (minutes)*</label>
                <input
                  type="number"
                  name="ptime"
                  value={formData.ptime}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            {/* Servings and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-black font-medium mb-2">Servings*</label>
                <input
                  type="number"
                  name="servings"
                  value={formData.servings}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-black font-medium mb-2">Price (Rs.)*</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-black font-medium mb-2">Availability*</label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-black text-white font-medium rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Meal-Kit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditMealkit;