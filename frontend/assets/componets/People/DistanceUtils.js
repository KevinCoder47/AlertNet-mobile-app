// DistanceUtils.js - Haversine formula for calculating distance between coordinates

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {string} - Formatted distance string (e.g., "2.5 km" or "500 m")
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Validate inputs
    if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
      return 'Unknown';
    }
  
    const R = 6371; // Earth's radius in kilometers
    
    // Convert degrees to radians
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    
    return formatDistance(distanceKm);
  };
  
  /**
   * Convert degrees to radians
   */
  const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
  };
  
  /**
   * Validate coordinate values
   */
  const isValidCoordinate = (lat, lon) => {
    return (
      lat != null && 
      lon != null && 
      !isNaN(lat) && 
      !isNaN(lon) &&
      lat >= -90 && 
      lat <= 90 && 
      lon >= -180 && 
      lon <= 180
    );
  };
  
  /**
   * Format distance with appropriate units
   */
  const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
      // Show in meters if less than 1 km
      const meters = Math.round(distanceKm * 1000);
      return `${meters} m`;
    } else if (distanceKm < 10) {
      // Show one decimal place if less than 10 km
      return `${distanceKm.toFixed(1)} km`;
    } else {
      // Show whole number for larger distances
      return `${Math.round(distanceKm)} km`;
    }
  };
  
  /**
   * Calculate distance between user and friend
   * @param {object} userLocation - { latitude, longitude }
   * @param {object} friendLocation - { latitude, longitude }
   * @returns {string} - Formatted distance
   */
  export const getDistanceBetween = (userLocation, friendLocation) => {
    if (!userLocation || !friendLocation) {
      return 'Unknown';
    }
  
    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      friendLocation.latitude,
      friendLocation.longitude
    );
  };
  
  /**
   * Extract location from various possible friend data structures
   */
  export const extractFriendLocation = (friend) => {
    // Try multiple possible location fields
    if (friend.currentLocation?.latitude != null && friend.currentLocation?.longitude != null) {
      return {
        latitude: Number(friend.currentLocation.latitude),
        longitude: Number(friend.currentLocation.longitude)
      };
    }
    
    if (friend.CurrentLocation?.latitude != null && friend.CurrentLocation?.longitude != null) {
      return {
        latitude: Number(friend.CurrentLocation.latitude),
        longitude: Number(friend.CurrentLocation.longitude)
      };
    }
  
    if (friend.location?.latitude != null && friend.location?.longitude != null) {
      return {
        latitude: Number(friend.location.latitude),
        longitude: Number(friend.location.longitude)
      };
    }
    
    if (friend.ResidenceAddress?.latitude != null && friend.ResidenceAddress?.longitude != null) {
      return {
        latitude: Number(friend.ResidenceAddress.latitude),
        longitude: Number(friend.ResidenceAddress.longitude)
      };
    }
  
    return null;
  };