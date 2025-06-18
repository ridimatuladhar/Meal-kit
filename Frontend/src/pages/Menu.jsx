import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Search from '../components/Search';
import Card from '../components/Card';
import Footer from '../components/Footer';

const Menu = () => {
  const [mealKits, setMealKits] = useState([]);
  const [filteredMealKits, setFilteredMealKits] = useState([]);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [searchField, setSearchField] = useState('all');
  const [availableTags, setAvailableTags] = useState([]);

  // Fetch meal-kits data from the API
  useEffect(() => {
    const fetchMealKits = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:3000/api/user/meal-kits');
        const data = await response.json();
        setMealKits(data);
        setFilteredMealKits(data);
        
        // Extract unique tags from all meal kits
        const tagsSet = new Set();
        data.forEach(mealKit => {
          if (mealKit.tags && Array.isArray(mealKit.tags)) {
            mealKit.tags.forEach(tag => tagsSet.add(tag.toLowerCase()));
          }
        });
        setAvailableTags(Array.from(tagsSet).slice(0, 5)); // Limit to 5 popular tags
        
      } catch (error) {
        console.error('Error fetching meal kits:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMealKits();
  }, []);

  // Get sort indicator (arrow up/down)
  const getSortIndicator = (field) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Reset sort to default
  const resetSort = () => {
    setSortField('');
    setSortDirection('asc');
    setFilteredMealKits([...mealKits]);
  };

  // Handle sort button click
  const sortMealKits = (field) => {
    // If clicking the same field, toggle direction
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    
    // Update state
    setSortField(field);
    setSortDirection(newDirection);
    
    // Apply sort
    const sortedMealKits = [...filteredMealKits];
    
    switch(field) {
      case 'price':
        sortedMealKits.sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return newDirection === 'asc' ? priceA - priceB : priceB - priceA;
        });
        break;
        
      case 'rating':
        sortedMealKits.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          
          // First compare by rating
          const ratingDiff = newDirection === 'asc' ? ratingA - ratingB : ratingB - ratingA;
          
          // If ratings are equal, sort by rating count
          if (ratingDiff === 0) {
            const countA = a.ratingCount || 0;
            const countB = b.ratingCount || 0;
            return newDirection === 'asc' ? countA - countB : countB - countA;
          }
          
          return ratingDiff;
        });
        break;
        
      case 'title':
        sortedMealKits.sort((a, b) => {
          const titleA = (a.title || '').toLowerCase();
          const titleB = (b.title || '').toLowerCase();
          return newDirection === 'asc' 
            ? titleA.localeCompare(titleB) 
            : titleB.localeCompare(titleA);
        });
        break;
        
      case 'availability':
        sortedMealKits.sort((a, b) => {
          // Sort available items first
          const availA = a.availability === 'Available' ? 1 : 0;
          const availB = b.availability === 'Available' ? 1 : 0;
          
          return newDirection === 'asc' 
            ? availB - availA  // Available first for asc
            : availA - availB; // Unavailable first for desc
        });
        break;
        
      case 'cookTime':
        sortedMealKits.sort((a, b) => {
          const timeA = a.ctime || 0;
          const timeB = b.ctime || 0;
          return newDirection === 'asc' ? timeA - timeB : timeB - timeA;
        });
        break;
        
      case 'popularity':
        sortedMealKits.sort((a, b) => {
          const countA = a.ratingCount || 0;
          const countB = b.ratingCount || 0;
          return newDirection === 'asc' ? countA - countB : countB - countA;
        });
        break;
        
      default:
        break;
    }
    
    setFilteredMealKits(sortedMealKits);
  };

  // Handle search field change
  const handleSearchFieldChange = (e) => {
    setSearchField(e.target.value);
  };

  // Advanced search function that can search across multiple fields
  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredMealKits(mealKits);
      return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    const filtered = mealKits.filter(mealKit => {
      // If search field is set to "all", search across all fields
      if (searchField === 'all') {
        // Check title/name
        const titleMatch = (mealKit.title?.toLowerCase() || mealKit.name?.toLowerCase() || '').includes(term);
        
        // Check description
        const descMatch = (mealKit.desc?.toLowerCase() || '').includes(term);
        
        // Check tags
        const tagMatch = mealKit.tags && Array.isArray(mealKit.tags) && 
          mealKit.tags.some(tag => tag.toLowerCase().includes(term));
        
        // Check ingredients included
        const ingredientsIncludedMatch = mealKit.ingredientsIncluded && 
          Array.isArray(mealKit.ingredientsIncluded) &&
          mealKit.ingredientsIncluded.some(ing => ing.toLowerCase().includes(term));
        
        // Check ingredients not included
        const ingredientsNotIncludedMatch = mealKit.ingredientsNotIncluded && 
          Array.isArray(mealKit.ingredientsNotIncluded) &&
          mealKit.ingredientsNotIncluded.some(ing => ing.toLowerCase().includes(term));
        
        return titleMatch || descMatch || tagMatch || ingredientsIncludedMatch || ingredientsNotIncludedMatch;
      }
      
      // Otherwise, search in the specific field
      switch(searchField) {
        case 'title':
          return (mealKit.title?.toLowerCase() || mealKit.name?.toLowerCase() || '').includes(term);
        
        case 'ingredients':
          // Check both included and not included ingredients
          const ingredientsIncludedMatch = mealKit.ingredientsIncluded && 
            Array.isArray(mealKit.ingredientsIncluded) &&
            mealKit.ingredientsIncluded.some(ing => ing.toLowerCase().includes(term));
          
          const ingredientsNotIncludedMatch = mealKit.ingredientsNotIncluded && 
            Array.isArray(mealKit.ingredientsNotIncluded) &&
            mealKit.ingredientsNotIncluded.some(ing => ing.toLowerCase().includes(term));
          
          return ingredientsIncludedMatch || ingredientsNotIncludedMatch;
          
        case 'tags':
          return mealKit.tags && 
            Array.isArray(mealKit.tags) && 
            mealKit.tags.some(tag => tag.toLowerCase().includes(term));
          
        default:
          return false;
      }
    });
    
    setFilteredMealKits(filtered);
    
    // Apply current sort if one is active
    if (sortField) {
      sortMealKits(sortField);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="w-[90%] mx-auto mt-1">        
        <div className="bg-gray-50 px-4 py-3 rounded-lg mb-2">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            {/* Search Component */}
            <div className="w-full md:w-2/3 text-sm">
              <Search 
                onSearch={handleSearch} 
                availableTags={availableTags}
              />
            </div>
            
            {/* Search Filters */}
            <div className="w-full md:w-1/3">
              <div>
                <label htmlFor="searchField" className="block text-sm font-medium text-gray-700 mb-1">
                  Search in:
                </label>
                <select 
                  id="searchField" 
                  value={searchField} 
                  onChange={handleSearchFieldChange}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Fields</option>
                  <option value="title">Title</option>
                  <option value="ingredients">Ingredients</option>
                  <option value="tags">Tags</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sort Buttons */}
        <div className="mb-2 bg-gray-50 p-2 rounded-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium px-3">Sort by:</span>
            
            <button 
              onClick={() => sortMealKits('price')}
              className={`px-3 py-1 text-sm rounded ${sortField === 'price' ? 'bg-green-200' : 'bg-white'} border hover:bg-green-100`}
            >
              Price {getSortIndicator('price')}
            </button>
            
            <button 
              onClick={() => sortMealKits('rating')}
              className={`px-3 py-1 text-sm rounded ${sortField === 'rating' ? 'bg-green-200' : 'bg-white'} border hover:bg-green-100`}
            >
              Rating {getSortIndicator('rating')}
            </button>
            
            <button 
              onClick={() => sortMealKits('availability')}
              className={`px-3 py-1 text-sm rounded ${sortField === 'availability' ? 'bg-green-200' : 'bg-white'} border hover:bg-green-100`}
            >
              Availability {getSortIndicator('availability')}
            </button>
            
            <button 
              onClick={() => sortMealKits('title')}
              className={`px-3 py-1 text-sm rounded ${sortField === 'title' ? 'bg-green-200' : 'bg-white'} border hover:bg-green-100`}
            >
              Name {getSortIndicator('title')}
            </button>
            
            <button 
              onClick={() => sortMealKits('cookTime')}
              className={`px-3 py-1 text-sm rounded ${sortField === 'cookTime' ? 'bg-green-200' : 'bg-white'} border hover:bg-green-100`}
            >
              Cooking Time {getSortIndicator('cookTime')}
            </button>
                      
            {sortField && (
              <button 
                onClick={resetSort}
                className="px-3 py-1 text-sm rounded bg-white border hover:bg-gray-100 ml-auto"
              >
                Reset Sort
              </button>
            )}
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          Showing {filteredMealKits.length} of {mealKits.length} meal kits
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : filteredMealKits.length > 0 ? (
          <Card mealKits={filteredMealKits} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-700">No meal kits found</h2>
            <p className="text-gray-600 mt-2">Try changing your search or filter criteria</p>
            <button
              onClick={() => {
                resetSort();
                setSearchField('all');
                setFilteredMealKits([...mealKits]);
              }}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Menu;