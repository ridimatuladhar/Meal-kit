import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminNav from '../../components/AdminNav';

const AddMealkits = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    image: null,
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
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      // Add image if present
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      // Add arrays as JSON strings
      // This is the key change - sending arrays as JSON strings instead of separate fields
      formDataToSend.append('ingredientsIncluded', JSON.stringify(formData.ingredientsIncluded.filter(item => item.trim())));
      formDataToSend.append('ingredientsNotIncluded', JSON.stringify(formData.ingredientsNotIncluded.filter(item => item.trim())));
      formDataToSend.append('steps', JSON.stringify(formData.steps.filter(item => item.trim())));
      formDataToSend.append('tags', JSON.stringify(formData.tags.filter(item => item.trim())));

      const response = await axios.post('http://localhost:3000/api/admin/meal-kits', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true 
      });
      
      if (response.data && (response.status === 201 || response.status === 200)) {
        toast.success('Meal kit created successfully!');
        navigate('/admin/mealkits');
      } else {
        toast.error(response.data.message || 'Failed to create meal kit');
      }
    } catch (error) {
      console.error('Error creating meal kit:', error);
      toast.error(error.response?.data?.message || 'Failed to create meal kit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <AdminNav />
      <div className="flex-1 ml-40 p-6">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)} // Go back to previous page
            className="flex items-center text-black hover:text-gray-700 bg-white border border-black rounded px-4 py-2"
          >
            Back
          </button>
          <h1 className="text-3xl font-bold text-black">Create New Meal-Kit</h1>
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
            <label className="block text-black font-medium mb-2">Image*</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
              className="w-full px-4 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
            {previewImage && (
              <div className="mt-4">
                <img src={previewImage} alt="Preview" className="h-40 object-cover border border-black" />
              </div>
            )}
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
              {isSubmitting ? 'Creating...' : 'Create Meal-Kit'}
            </button>
          </div>
        </form>
      </div>
    </div>

    </div>
  );
};

export default AddMealkits;