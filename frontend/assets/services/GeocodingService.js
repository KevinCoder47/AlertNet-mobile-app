// GeocodingService.js - FIXED FOR REACT NATIVE
const geocodeCache = new Map();
import * as Location from 'expo-location';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;
const CACHE_KEY_PRECISION = 6;

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

  // Check cache with higher precision
  const cacheKey = `${latitude.toFixed(CACHE_KEY_PRECISION)},${longitude.toFixed(CACHE_KEY_PRECISION)}`;
  const cached = geocodeCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
    return cached.data;
  }

  try {
    // --- PRIMARY METHOD: Use expo-location for native geocoding ---
    const geocodedAddresses = await Location.reverseGeocodeAsync({ latitude, longitude });

    if (geocodedAddresses && geocodedAddresses.length > 0) {
      const result = parseExpoLocationResponse(geocodedAddresses[0]);
      
      // Manage cache size
      if (geocodeCache.size >= MAX_CACHE_SIZE) {
        const firstKey = geocodeCache.keys().next().value;
        geocodeCache.delete(firstKey);
      }
      
      geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
    // If expo-location returns no results, fall through to Nominatim
    throw new Error('expo-location returned no results');

  } catch (expoError) {
    console.warn(`expo-location geocoding failed: ${expoError.message}. Falling back to Nominatim.`);
    // --- FALLBACK METHOD: Use Nominatim ---
    const result = await reverseGeocodeNominatim(latitude, longitude);
    
    // Manage cache size
    if (geocodeCache.size >= MAX_CACHE_SIZE) {
      const firstKey = geocodeCache.keys().next().value;
      geocodeCache.delete(firstKey);
    }
    
    geocodeCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
    
    // Return fallback with coordinates
    const fallback = {
      street: '',
      city: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      province: '',
      country: '',
      formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    };
    
    // Manage cache size before adding fallback
    if (geocodeCache.size >= MAX_CACHE_SIZE) {
      const firstKey = geocodeCache.keys().next().value;
      geocodeCache.delete(firstKey);
    }
    
    geocodeCache.set(cacheKey, {
      data: fallback,
      timestamp: Date.now()
    });
    
    return fallback;
  }
};

/**
 * Helper to parse the response from expo-location into our standard format.
 */
const parseExpoLocationResponse = (address) => {
  const { streetNumber, street, city, subregion, region, country, name } = address;
  
  const streetName = streetNumber && street ? `${streetNumber} ${street}` : street || name || '';
  const cityName = city || subregion || 'Unknown';
  
  let formattedAddress = streetName;
  if (cityName && cityName !== streetName) {
    formattedAddress = formattedAddress ? `${formattedAddress}, ${cityName}` : cityName;
  }

  return {
    street: streetName,
    city: cityName,
    province: region || '',
    country: country || '',
    formattedAddress: formattedAddress || cityName || 'Unknown location'
  };
};
/**
 * Nominatim with better error handling and retry logic
 */
const reverseGeocodeNominatim = async (lat, lon, retries = 3) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`Nominatim attempt ${attempt + 1}/${retries} for ${lat}, ${lon}`);
      // Use AbortController for timeout with fallback
      let signal = null;
      let timeoutId = null;
      
      if (typeof AbortController !== 'undefined') {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 8000);
        signal = controller.signal;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'AlertNetApp/1.0',
          'Accept': 'application/json',
          'Accept-Language': 'en'
        },
        ...(signal && { signal })
      });

      if (timeoutId) clearTimeout(timeoutId);

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Rate limited, waiting ${waitTime}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.address) {
        throw new Error('No address data');
      }

      return parseNominatimResponse(data);
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;
      if (isLastAttempt) {
        throw new Error('Nominatim unavailable');
      }
      
      const waitTime = Math.pow(2, attempt) * 500;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Nominatim unavailable after retries');
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
    street: typeof street === 'string' ? street : '',
    city: typeof city === 'string' ? city : 'Unknown',
    province: typeof province === 'string' ? province : '',
    country: typeof country === 'string' ? country : '',
    formattedAddress: formattedAddress || city || 'Unknown location'
  };
};

/**
 * Calculate distance (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Input validation
  if (!lat1 || !lon1 || !lat2 || !lon2 ||
      isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2) ||
      lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
      lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
    return 'Unknown distance';
  }

  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  // Clamp 'a' to [0, 1] to handle floating point errors
  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  const distanceKm = R * c;

  // Validate result
  if (!isFinite(distanceKm) || distanceKm < 0) {
    return 'Unknown distance';
  }

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
  if (!location || typeof location !== 'object') {
    return 'Unknown location';
  }
  
  const street = typeof location.street === 'string' ? location.street : '';
  const city = typeof location.city === 'string' ? location.city : '';
  const formattedAddress = typeof location.formattedAddress === 'string' ? location.formattedAddress : '';
  
  if (street && city) {
    return `${street}, ${city}`;
  }
  
  if (street) return street;
  if (city) return city;
  
  return formattedAddress || 'Unknown location';
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
  if (!Array.isArray(locations)) {
    console.warn('Batch geocode received non-array input');
    return new Map();
  }

  const results = new Map();
  
  for (const loc of locations) {
    if (!loc || typeof loc !== 'object' || !loc.latitude || !loc.longitude) {
      continue;
    }
    
    const key = `${loc.latitude},${loc.longitude}`;
    try {
      const result = await reverseGeocode(loc.latitude, loc.longitude);
      results.set(key, result);
      
      // Small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn(`Skipped ${key}:`, error?.message || 'Unknown error');
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