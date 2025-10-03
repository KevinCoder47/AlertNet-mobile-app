// utilities/helpers.js

/**
 * Generate a unique ID
 * @returns {string} A unique identifier
 */
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };
  
  /**
   * Format timestamp to relative time (e.g., "2 hours ago")
   * @param {Date|string} timestamp 
   * @returns {string} Formatted relative time
   */
  export const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
  
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }
  
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
  
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
  
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
  
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    }
  
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - First latitude
   * @param {number} lon1 - First longitude  
   * @param {number} lat2 - Second latitude
   * @param {number} lon2 - Second longitude
   * @returns {number} Distance in kilometers
   */
  export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  /**
   * Convert degrees to radians
   * @param {number} degrees 
   * @returns {number} Radians
   */
  const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
  };
  
  /**
   * Format distance for display
   * @param {number} distance - Distance in kilometers
   * @returns {string} Formatted distance string
   */
  export const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  /**
   * Format likes count for display (e.g., "1.2K", "5M")
   * @param {number} likes - Number of likes
   * @returns {string} Formatted likes string
   */
  export const formatLikes = (likes) => {
    if (likes < 1000) {
      return likes.toString();
    }
    
    if (likes < 1000000) {
      return (likes / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    
    return (likes / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  };
  
  /**
   * Validate email format
   * @param {string} email 
   * @returns {boolean} Whether email is valid
   */
  export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Truncate text to specified length
   * @param {string} text 
   * @param {number} maxLength 
   * @returns {string} Truncated text
   */
  export const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  /**
   * Debounce function to limit function calls
   * @param {Function} func 
   * @param {number} wait 
   * @returns {Function} Debounced function
   */
  export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  /**
   * Get alert type color
   * @param {string} alertType 
   * @returns {string} Color hex code
   */
  export const getAlertTypeColor = (alertType) => {
    const colors = {
      'Fire Alert': '#FF6B6B',
      'Safety & Crime': '#4ECDC4',
      'Utility Issue': '#45B7D1',
      'Traffic': '#96CEB4',
      'Weather': '#FFEAA7',
      'Emergency': '#D63031',
      'General': '#74B9FF',
    };
    return colors[alertType] || '#74B9FF';
  };
  
  /**
   * Get alert type icon name (for Ionicons)
   * @param {string} alertType 
   * @returns {string} Icon name
   */
  export const getAlertTypeIcon = (alertType) => {
    const icons = {
      'Fire Alert': 'flame',
      'Safety & Crime': 'shield-checkmark',
      'Utility Issue': 'construct',
      'Traffic': 'car',
      'Weather': 'partly-sunny',
      'Emergency': 'alert-circle',
      'General': 'information-circle',
    };
    return icons[alertType] || 'information-circle';
  };

  /**
   * Sanitize text input by trimming and removing potentially harmful content
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  export const sanitizeText = (text) => {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    // Trim whitespace and normalize line breaks
    return text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  };

  /**
   * Validate post data before submission
   * @param {Object} postData - Post data to validate
   * @param {string} postData.selectedCategory - Selected category ID
   * @param {string} postData.description - Post description
   * @param {Object} postData.coordinates - Location coordinates
   * @returns {Object} Validation result with isValid boolean and error message
   */
  export const validatePostData = (postData) => {
    const { selectedCategory, description, coordinates } = postData;
    
    // Check if category is selected
    if (!selectedCategory) {
      return {
        isValid: false,
        error: 'Please select a category for your alert.'
      };
    }
    
    // Check if description is provided and not empty
    if (!description || description.trim().length === 0) {
      return {
        isValid: false,
        error: 'Please provide a description for your alert.'
      };
    }
    
    // Check description length
    if (description.trim().length < 10) {
      return {
        isValid: false,
        error: 'Description must be at least 10 characters long.'
      };
    }
    
    if (description.trim().length > 500) {
      return {
        isValid: false,
        error: 'Description must be less than 500 characters.'
      };
    }
    
    // Check if location coordinates are provided
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      return {
        isValid: false,
        error: 'Please set a location for your alert.'
      };
    }
    
    return {
      isValid: true,
      error: null
    };
  };