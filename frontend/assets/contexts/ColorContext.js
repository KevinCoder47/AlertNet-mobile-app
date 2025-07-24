import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native'; // Expo's built-in hook

export const themes = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    primary: '#212121',
    primaryTwo: "#FFFFFF",
    secondary: '#A1A1A1',
    border: '#2C2C2C',
    isDark: false,
    altText: "#FFFFFF",
    heplineBackground: ''
    
  },
  dark: {
    background: '#121212',
    text: '#FFFFFF',
    primary: '#FFFFFF',
    primaryTwo: "#212121",
    secondary: '#8D8D8D',
    border: '#E5E5E5',
    isDark: true,
    altText: "#000000",
    heplineBackground: ''
  },
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // Get system theme
  console.log(systemColorScheme);
  const [isLoaded, setIsLoaded] = useState(true); // Always loaded since we don't check storage

  const theme = {
    isDark: systemColorScheme === 'dark',
    isLoaded,
    colors: systemColorScheme === 'dark' ? themes.dark : themes.light,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};