/**
 * Geocoding Service - React Native Compatible Version
 * Converts coordinates to human-readable location names with street-level detail
 * Includes distance calculation functionality
 */

// Cache for storing geocoded locations to minimize API calls
const geocodeCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * React Native compatible fetch with timeout
 */
const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

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
    // Try primary provider: OpenStreetMap Nominatim
    const result = await reverseGeocodeNominatim(latitude, longitude);
    
    // Cache the result
    geocodeCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    // console.error('Geocoding failed:', error);
    
    // Try fallback provider
    try {
      const fallbackResult = await reverseGeocodePhoton(latitude, longitude);
      
      geocodeCache.set(cacheKey, {
        data: fallbackResult,
        timestamp: Date.now()
      });
      
      return fallbackResult;
    } catch (fallbackError) {
      // console.error('Fallback geocoding also failed:', fallbackError);
      
      // Return approximate location
      return {
        street: '',
        city: 'Near coordinates',
        province: '',
        country: '',
        formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      };
    }
  }
};

/**
 * OpenStreetMap Nominatim reverse geocoding with street-level detail
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Location data with street information
 */
const reverseGeocodeNominatim = async (lat, lon) => {
  // Use zoom=18 for street-level detail
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  
  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'AlertNetApp/1.0',
        'Accept': 'application/json'
      }
    }, 10000);

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.address) {
      throw new Error('No address data returned');
    }

    return parseNominatimResponse(data);
  } catch (error) {
    // console.error('Nominatim request failed:', error.message);
    throw error;
  }
};

/**
 * Photon geocoding API (alternative, often more reliable in React Native)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Location data
 */
const reverseGeocodePhoton = async (lat, lon) => {
  const url = `https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`;
  
  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }, 10000);

    if (!response.ok) {
      throw new Error(`Photon API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      throw new Error('No results from Photon');
    }

    const props = data.features[0].properties;
    
    return {
      street: props.street || props.name || '',
      city: props.city || props.locality || props.county || 'Unknown',
      province: props.state || props.region || '',
      country: props.country || '',
      formattedAddress: props.name || `${props.city || 'Unknown location'}`
    };
  } catch (error) {
    // console.error('Photon request failed:', error.message);
    throw error;
  }
};

/**
 * Parse Nominatim API response
 */
const parseNominatimResponse = (data) => {
  const address = data.address;
  
  // Build street address
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
  
  // Build formatted address
  let formattedAddress = '';
  
  if (street) {
    formattedAddress = street;
    if (city && city !== street) {
      formattedAddress += `, ${city}`;
    }
  } else if (city) {
    formattedAddress = city;
  }
  
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
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
 */
export const calculateDistanceDetailed = (lat1, lon1, lat2, lon2) => {
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
  const formatted = calculateDistance(lat1, lon1, lat2, lon2);
  
  return {
    meters: distanceM,
    kilometers: distanceKm,
    formatted: formatted
  };
};

/**
 * Calculate distance and geocode location in one call
 */
export const geocodeWithDistance = async (fromLocation, toLocation) => {
  try {
    const locationData = await reverseGeocode(
      toLocation.latitude,
      toLocation.longitude
    );
    
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
 */
export const batchGeocodeWithDistance = async (fromLocation, locations) => {
  const results = new Map();
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 1500; // Increased to 1.5 seconds for rate limiting
  
  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = locations.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (loc) => {
      if (!loc.latitude || !loc.longitude) return null;
      
      const key = `${loc.latitude},${loc.longitude}`;
      try {
        const result = await geocodeWithDistance(fromLocation, loc);
        return { key, result };
      } catch (error) {
        console.error(`Failed to geocode ${key}:`, error);
        return null;
      }
    });
    
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(item => {
      if (item) {
        results.set(item.key, item.result);
      }
    });
    
    if (i + BATCH_SIZE < locations.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  return results;
};

/**
 * Batch geocode multiple locations (without distance)
 */
export const batchGeocode = async (locations) => {
  const results = new Map();
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 1500;
  
  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = locations.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (loc) => {
      if (!loc.latitude || !loc.longitude) return null;
      
      const key = `${loc.latitude},${loc.longitude}`;
      try {
        const result = await reverseGeocode(loc.latitude, loc.longitude);
        return { key, result };
      } catch (error) {
        console.error(`Failed to geocode ${key}:`, error);
        return null;
      }
    });
    
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(item => {
      if (item) {
        results.set(item.key, item.result);
      }
    });
    
    if (i + BATCH_SIZE < locations.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  return results;
};

/**
 * Format location for display with street name priority
 */
export const formatLocationForDisplay = (location) => {
  if (!location) return 'Unknown location';
  
  if (location.street && location.city) {
    return `${location.street}, ${location.city}`;
  }
  
  if (location.street) {
    return location.street;
  }
  
  if (location.city && location.province) {
    return `${location.city}, ${location.province}`;
  }
  
  if (location.city) {
    return location.city;
  }
  
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