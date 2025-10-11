/**
 * Geocoding Service
 * Converts coordinates to human-readable location names with street-level detail
 * Includes distance calculation functionality
 */

// Cache for storing geocoded locations to minimize API calls
const geocodeCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Reverse geocode coordinates to get location name with street
 * Uses multiple providers for reliability
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} - { street, city, province, country, formattedAddress }
 */
export const reverseGeocode = async (latitude, longitude) => {
  // Input validation
  if (!latitude || !longitude || 
      isNaN(latitude) || isNaN(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180) {
    console.warn('Invalid coordinates:', { latitude, longitude });
    return {
      street: '',
      city: 'Unknown',
      province: '',
      country: '',
      formattedAddress: 'Unknown location'
    };
  }

  // Check cache first
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = geocodeCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
    // console.log($&);
    return cached.data;
  }

  try {
    // Try primary provider: OpenStreetMap Nominatim (free, no API key needed)
    const result = await reverseGeocodeNominatim(latitude, longitude);
    
    // Cache the result
    geocodeCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error('Geocoding failed:', error);
    
    // Fallback to approximate location
    return {
      street: '',
      city: 'Near coordinates',
      province: '',
      country: '',
      formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    };
  }
};

/**
 * OpenStreetMap Nominatim reverse geocoding with street-level detail
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Location data with street information
 */
const reverseGeocodeNominatim = async (lat, lon) => {
  // Use zoom=18 for street-level detail (higher zoom = more detail)
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AlertNetApp/1.0' // Nominatim requires a User-Agent
    }
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.address) {
    throw new Error('No address data returned');
  }

  // Extract relevant location components with priority for street-level info
  const address = data.address;
  
  // Build street address (combining house number and road)
  const houseNumber = address.house_number || '';
  const road = address.road || 
               address.street || 
               address.pedestrian || 
               address.footway || 
               '';
  
  const street = houseNumber && road 
    ? `${houseNumber} ${road}` 
    : road || '';
  
  // Get city/town with multiple fallbacks
  const city = address.city || 
               address.town || 
               address.village || 
               address.suburb || 
               address.neighbourhood ||
               address.municipality ||
               'Unknown';
  
  // Get province/state
  const province = address.state || 
                   address.province || 
                   address.region || 
                   '';
  
  const country = address.country || '';
  
  // Build formatted address with street priority
  let formattedAddress = '';
  
  if (street) {
    formattedAddress = street;
    if (city && city !== street) {
      formattedAddress += `, ${city}`;
    }
  } else if (city) {
    formattedAddress = city;
  }
  
  // Don't add province if it's the same as city (common in some regions)
  if (province && province !== city && formattedAddress) {
    formattedAddress += `, ${province}`;
  }
  
  return {
    street,
    city,
    province,
    country,
    formattedAddress: formattedAddress || 'Unknown location',
    fullAddress: data.display_name
  };
};

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} - Distance in meters
 */
const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calculate distance between two coordinates and return formatted string
 * (Matches OLD GeocodingService API)
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {string} - Formatted distance string (e.g., "5.2km away", "120m away")
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Validation
  if (!lat1 && lat1 !== 0) return 'Unknown distance';
  if (!lon1 && lon1 !== 0) return 'Unknown distance';
  if (!lat2 && lat2 !== 0) return 'Unknown distance';
  if (!lon2 && lon2 !== 0) return 'Unknown distance';

  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);

  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) {
    return 'Invalid coordinates';
  }

  if (Math.abs(numLat1) > 90 || Math.abs(numLat2) > 90) return 'Invalid coordinates';
  if (Math.abs(numLon1) > 180 || Math.abs(numLon2) > 180) return 'Invalid coordinates';
  
  const distanceKm = calculateDistanceInMeters(numLat1, numLon1, numLat2, numLon2) / 1000;

  if (distanceKm < 0.01) {
    return 'Same location';
  } else if (distanceKm < 0.1) {
    return 'Nearby';
  } else if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km away`;
  } else {
    return `${Math.round(distanceKm)}km away`;
  }
};

/**
 * Calculate distance and return detailed object
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {Object} - { meters: number, kilometers: number, formatted: string }
 */
export const calculateDistanceDetailed = (lat1, lon1, lat2, lon2) => {
  // Validate inputs
  if (!lat1 || !lon1 || !lat2 || !lon2 ||
      isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return {
      meters: null,
      kilometers: null,
      formatted: 'Unknown distance'
    };
  }
  
  const distanceM = calculateDistanceInMeters(lat1, lon1, lat2, lon2);
  const distanceKm = distanceM / 1000;
  
  // Use the same formatting as calculateDistance
  const formatted = calculateDistance(lat1, lon1, lat2, lon2);
  
  return {
    meters: distanceM,
    kilometers: distanceKm,
    formatted: formatted
  };
};

/**
 * Calculate distance and geocode location in one call
 * @param {Object} fromLocation - Starting location { latitude, longitude }
 * @param {Object} toLocation - Destination location { latitude, longitude }
 * @returns {Promise<Object>} - { location: Object, distance: string }
 */
export const geocodeWithDistance = async (fromLocation, toLocation) => {
  try {
    // Geocode the destination
    const locationData = await reverseGeocode(
      toLocation.latitude,
      toLocation.longitude
    );
    
    // Calculate distance if we have both locations (returns formatted string)
    let distance = 'Unknown distance';
    
    if (fromLocation?.latitude && fromLocation?.longitude) {
      distance = calculateDistance(
        fromLocation.latitude,
        fromLocation.longitude,
        toLocation.latitude,
        toLocation.longitude
      );
    }
    
    return {
      location: locationData,
      distance: distance
    };
  } catch (error) {
    console.error('Error in geocodeWithDistance:', error);
    return {
      location: {
        street: '',
        city: 'Unknown',
        province: '',
        country: '',
        formattedAddress: 'Unknown location'
      },
      distance: 'Unknown distance'
    };
  }
};

/**
 * Batch geocode multiple locations with distance calculations
 * @param {Object} fromLocation - Starting location { latitude, longitude }
 * @param {Array<Object>} locations - Array of { latitude, longitude }
 * @returns {Promise<Map>} - Map of coordinates to location and distance data
 */
export const batchGeocodeWithDistance = async (fromLocation, locations) => {
  const results = new Map();
  
  // Process in batches to avoid rate limiting
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 1000; // 1 second
  
  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = locations.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (loc) => {
      if (!loc.latitude || !loc.longitude) return null;
      
      const key = `${loc.latitude},${loc.longitude}`;
      const result = await geocodeWithDistance(fromLocation, loc);
      return { key, result };
    });
    
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(item => {
      if (item) {
        results.set(item.key, item.result);
      }
    });
    
    // Delay between batches to respect rate limits
    if (i + BATCH_SIZE < locations.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  return results;
};

/**
 * Batch geocode multiple locations (without distance)
 * @param {Array<Object>} locations - Array of { latitude, longitude }
 * @returns {Promise<Map>} - Map of coordinates to location data
 */
export const batchGeocode = async (locations) => {
  const results = new Map();
  
  // Process in batches to avoid rate limiting
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 1000; // 1 second
  
  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = locations.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (loc) => {
      if (!loc.latitude || !loc.longitude) return null;
      
      const key = `${loc.latitude},${loc.longitude}`;
      const result = await reverseGeocode(loc.latitude, loc.longitude);
      return { key, result };
    });
    
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(item => {
      if (item) {
        results.set(item.key, item.result);
      }
    });
    
    // Delay between batches to respect rate limits
    if (i + BATCH_SIZE < locations.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  return results;
};

/**
 * Format location for display with street name priority
 * @param {Object} location - Location object from reverseGeocode
 * @returns {string} - Formatted location string
 */
export const formatLocationForDisplay = (location) => {
  if (!location) return 'Unknown location';
  
  // Priority 1: Street and city (most detailed)
  if (location.street && location.city) {
    return `${location.street}, ${location.city}`;
  }
  
  // Priority 2: Just street (if no city)
  if (location.street) {
    return location.street;
  }
  
  // Priority 3: City and province
  if (location.city && location.province) {
    return `${location.city}, ${location.province}`;
  }
  
  // Priority 4: Just city
  if (location.city) {
    return location.city;
  }
  
  // Fallback to formatted address
  return location.formattedAddress || 'Unknown location';
};

/**
 * Clear geocode cache
 */
export const clearGeocodeCache = () => {
  geocodeCache.clear();
  // console.log($&);
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: geocodeCache.size,
    entries: Array.from(geocodeCache.keys())
  };
};