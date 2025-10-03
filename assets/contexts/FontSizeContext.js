import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FontSizeContext = createContext();

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};

export const FontSizeProvider = ({ children }) => {
  const [fontSizeScale, setFontSizeScale] = useState(1); // Default scale
  const [isLoading, setIsLoading] = useState(true);

  // Font size options
  const fontSizeOptions = [
    { label: 'Small', scale: 0.85, key: 'small' },
    { label: 'Normal', scale: 1, key: 'normal' },
    { label: 'Large', scale: 1.2, key: 'large' },
    { label: 'Extra Large', scale: 1.4, key: 'extra_large' }
  ];

  // Load saved font size on app start
  useEffect(() => {
    loadFontSize();
  }, []);

  const loadFontSize = async () => {
    try {
      const savedScale = await AsyncStorage.getItem('fontSizeScale');
      if (savedScale !== null) {
        setFontSizeScale(parseFloat(savedScale));
      }
    } catch (error) {
      console.error('Error loading font size:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFontSize = async (scale) => {
    try {
      await AsyncStorage.setItem('fontSizeScale', scale.toString());
      setFontSizeScale(scale);
    } catch (error) {
      console.error('Error saving font size:', error);
    }
  };

  // Helper function to get scaled font size
  const getScaledFontSize = (baseFontSize) => {
    return baseFontSize * fontSizeScale;
  };

  // Get current font size option
  const getCurrentOption = () => {
    return fontSizeOptions.find(option => option.scale === fontSizeScale) || fontSizeOptions[1];
  };

  const value = {
    fontSizeScale,
    setFontSizeScale: saveFontSize,
    fontSizeOptions,
    getScaledFontSize,
    getCurrentOption,
    isLoading
  };

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
};