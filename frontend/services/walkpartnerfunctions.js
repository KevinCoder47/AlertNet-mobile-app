import axios from 'axios';

const GOOGLE_MAPS_APIKEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Enhanced walking route function with comprehensive error handling
 * @param {object} origin - { latitude: number, longitude: number }
 * @param {object} destination - { latitude: number, longitude: number }
 * @returns {Promise} Resolves with route data or throws detailed error
 */
export const getWalkingRoute = async (origin, destination, maxRetries = 2) => {
  // Validate coordinates with detailed logs
  if (!isValidCoordinate(origin)) {
    console.error('Invalid origin coordinate:', origin);
    throw new Error(`Invalid origin coordinate provided: ${JSON.stringify(origin)}. Please check the location and try again.`);
  }
  if (!isValidCoordinate(destination)) {
    console.error('Invalid destination coordinate:', destination);
    throw new Error(`Invalid destination coordinate provided: ${JSON.stringify(destination)}. Please check the location and try again.`);
  }

  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      attempt++;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=walking&key=${GOOGLE_MAPS_APIKEY}&alternatives=true`;
      
      // console.log($&);
      
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;

      // console.log($&);
      
      if (data.status === 'OK') {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Decode polyline points
        const coordinates = decodePolyline(route.overview_polyline.points);
        
        return {
          coordinates,
          distance: leg.distance.text,
          duration: leg.duration.text,
          bounds: route.bounds,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.text,
            duration: step.duration.text
          })),
          status: 'OK'
        };
      } else if (data.status === 'ZERO_RESULTS') {
        // Try with driving mode as fallback for walking
        // console.log($&);
        const drivingUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_MAPS_APIKEY}`;
        
        const drivingResponse = await axios.get(drivingUrl, { timeout: 10000 });
        const drivingData = drivingResponse.data;
        
        if (drivingData.status === 'OK') {
          const route = drivingData.routes[0];
          const leg = route.legs[0];
          const coordinates = decodePolyline(route.overview_polyline.points);
          
          return {
            coordinates,
            distance: leg.distance.text,
            duration: leg.duration.text,
            bounds: route.bounds,
            steps: leg.steps.map(step => ({
              instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
              distance: step.distance.text,
              duration: step.duration.text
            })),
            status: 'DRIVING_FALLBACK',
            message: 'No walking route available. Showing driving route instead.'
          };
        }
        
        throw new Error(`No route found between these locations. Please check if both locations are accessible by road. [Status: ${drivingData.status}]`);
      } else {
        // Handle other API errors
        let errorMessage = `Directions API error: ${data.status}`;
        if (data.error_message) {
          errorMessage += ` - ${data.error_message}`;
        }
        
        if (data.status === 'NOT_FOUND') {
          errorMessage = 'One or both locations could not be found. Please check the addresses and try again.';
        } else if (data.status === 'OVER_QUERY_LIMIT') {
          errorMessage = 'Route service is temporarily unavailable. Please try again in a few moments.';
        } else if (data.status === 'REQUEST_DENIED') {
          errorMessage = 'Route service is not available. Please check your API configuration.';
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error(`Route fetching attempt ${attempt} failed:`, error);
      
      if (attempt > maxRetries) {
        if (error.response?.data?.error_message) {
          throw new Error(error.response.data.error_message);
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Route request timed out. Please check your internet connection and try again.');
        } else if (error.message.includes('Network Error')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        
        throw new Error(error.message || 'Failed to calculate route. Please try again.');
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

/**
 * Validate coordinates with detailed console logs for invalid cases
 */
const isValidCoordinate = (coord) => {
  if (!coord) {
    console.error('Coordinate is undefined or null:', coord);
    return false;
  }
  if (typeof coord.latitude !== 'number') {
    console.error('Latitude is not a number:', coord.latitude);
    return false;
  }
  if (typeof coord.longitude !== 'number') {
    console.error('Longitude is not a number:', coord.longitude);
    return false;
  }
  if (coord.latitude < -90 || coord.latitude > 90) {
    console.error('Latitude out of range (-90 to 90):', coord.latitude);
    return false;
  }
  if (coord.longitude < -180 || coord.longitude > 180) {
    console.error('Longitude out of range (-180 to 180):', coord.longitude);
    return false;
  }
  return true;
};

/**
 * Decodes a Google Polyline string into coordinates
 */
const decodePolyline = (polyline) => {
  let index = 0;
  let points = [];
  let lat = 0, lng = 0;

  while (index < polyline.length) {
    let b, shift = 0, result = 0;
    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};

/**
 * Fallback function to create a straight line route when API fails
 */
export const getStraightLineRoute = (origin, destination) => {
  const coordinates = [origin, destination];
  const distance = calculateHaversineDistance(origin, destination);
  
  return {
    coordinates,
    distance: `${(distance / 1000).toFixed(1)} km`,
    duration: `${Math.round((distance / 1000) * 15)} min`, // Estimate 15 min/km walking
    bounds: {
      northeast: {
        latitude: Math.max(origin.latitude, destination.latitude),
        longitude: Math.max(origin.longitude, destination.longitude)
      },
      southwest: {
        latitude: Math.min(origin.latitude, destination.latitude),
        longitude: Math.min(origin.longitude, destination.longitude)
      }
    },
    status: 'STRAIGHT_LINE_FALLBACK',
    message: 'Using straight line approximation. Route details may be inaccurate.'
  };
};

/**
 * Calculate distance between two points using Haversine formula
 */
const calculateHaversineDistance = (coord1, coord2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Test function to verify API connection
 */
export const testDirectionsAPI = async () => {
  // Test with known coordinates in Johannesburg
  const testOrigin = { latitude: -26.2041, longitude: 28.0473 }; // Johannesburg center
  const testDestination = { latitude: -26.1885, longitude: 28.0025 }; // Nearby point
  
  try {
    const route = await getWalkingRoute(testOrigin, testDestination);
    // console.log($&);
    return { success: true, data: route };
  } catch (error) {
    console.error('API test failed:', error);
    return { success: false, error: error.message };
  }
};