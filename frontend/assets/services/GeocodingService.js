// GeocodingService.js - FIXED FOR REACT NATIVE
const geocodeCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * React Native compatible reverse geocoding
 * Falls back gracefully if geocoding fails
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

  // Check cache
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = geocodeCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
    return cached.data;
  }

  // Try geocoding with proper error handling
  try {
    const result = await reverseGeocodeNominatim(latitude, longitude);
    
    geocodeCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.warn('Geocoding failed, using coordinates:', error.message);
    
    // Return fallback with coordinates
    const fallback = {
      street: '',
      city: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      province: '',
      country: '',
      formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    };
    
    geocodeCache.set(cacheKey, {
      data: fallback,
      timestamp: Date.now()
    });
    
    return fallback;
  }
};

/**
 * Nominatim with better error handling
 */
const reverseGeocodeNominatim = async (lat, lon) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  
  try {
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'AlertNetApp/1.0',
        'Accept': 'application/json',
        'Accept-Language': 'en'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.address) {
      throw new Error('No address data');
    }

    return parseNominatimResponse(data);
  } catch (error) {
    // Don't log every error, just throw
    throw new Error('Nominatim unavailable');
  }
};

/**
 * Parse Nominatim response
 */
const parseNominatimResponse = (data) => {
  const address = data.address || {};
  
  const houseNumber = address.house_number || '';
  const road = address.road || address.street || '';
  const street = houseNumber && road ? `${houseNumber} ${road}` : road;
  
  const city = address.city || 
               address.town || 
               address.village || 
               address.suburb ||
               'Unknown';
  
  const province = address.state || address.province || '';
  const country = address.country || '';
  
  let formattedAddress = street;
  if (city && city !== street) {
    formattedAddress = formattedAddress ? `${formattedAddress}, ${city}` : city;
  }
  
  return {
    street,
    city,
    province,
    country,
    formattedAddress: formattedAddress || city || 'Unknown location'
  };
};

/**
 * Calculate distance (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return 'Unknown distance';
  }

  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanceKm = R * c;

  if (distanceKm < 0.01) return 'Same location';
  if (distanceKm < 0.1) return 'Nearby';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m away`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)}km away`;
  return `${Math.round(distanceKm)}km away`;
};

/**
 * Format location for display
 */
export const formatLocationForDisplay = (location) => {
  if (!location) return 'Unknown location';
  
  if (location.street && location.city) {
    return `${location.street}, ${location.city}`;
  }
  
  if (location.street) return location.street;
  if (location.city) return location.city;
  
  return location.formattedAddress || 'Unknown location';
};

/**
 * Clear cache
 */
export const clearGeocodeCache = () => {
  geocodeCache.clear();
};

/**
 * Batch geocode with error tolerance
 */
export const batchGeocode = async (locations) => {
  const results = new Map();
  
  for (const loc of locations) {
    if (!loc.latitude || !loc.longitude) continue;
    
    const key = `${loc.latitude},${loc.longitude}`;
    try {
      const result = await reverseGeocode(loc.latitude, loc.longitude);
      results.set(key, result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn(`Skipped ${key}:`, error.message);
      results.set(key, {
        street: '',
        city: 'Unknown',
        province: '',
        country: '',
        formattedAddress: key
      });
    }
  }
  
  return results;
};

// Export all functions
export default {
  reverseGeocode,
  calculateDistance,
  formatLocationForDisplay,
  clearGeocodeCache,
  batchGeocode
};