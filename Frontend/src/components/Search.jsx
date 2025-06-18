import React, { useState, useEffect } from 'react';

const Search = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches).slice(0, 3)); // Show max 3 recent searches
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save a search term to recent searches
  const saveToRecentSearches = (term) => {
    if (!term.trim()) return;

    const newRecentSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveToRecentSearches(searchTerm);
      if (onSearch) {
        onSearch(searchTerm);
      }
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Search as-you-type
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (term) => {
    setSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
  };

  // Clear the search
  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="w-full">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="flex items-center w-full mb-2">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Search by title, ingredients, or tags..."
            className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 bg-white text-gray-400 hover:text-gray-600"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-white rounded-r-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 hover:bg-green-700 transition-colors"
        >
          <i className="fa-solid fa-search"></i>
        </button>
      </form>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-1">Recent:</span>
          <div className="flex flex-wrap gap-1">
            {recentSearches.map((term, index) => (
              <span
                key={`recent-${index}`}
                className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs cursor-pointer hover:bg-gray-200 transition-colors flex items-center"
                onClick={() => handleRecentSearchClick(term)}
              >
                <i className="fa-solid fa-clock-rotate-left mr-1"></i> {term}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;