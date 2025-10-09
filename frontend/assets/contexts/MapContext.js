import React, { createContext, useContext, useRef, useState } from 'react';
const MapContext = createContext(null);

//provider component
export const MapProvider = ({ children }) => {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);

  // Function to recenter map to user location
  const recenterToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 800);
    }
  };

  // Value to be provided to consuming components
  const value = {
    mapRef,
    userLocation,
    setUserLocation,
    recenterToUserLocation
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

// Custom hook to use the map context
export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};