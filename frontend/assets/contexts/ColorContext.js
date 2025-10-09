import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    heplineBackground: '',
    // Additional colors for better theming support
    surface: '#f9f9f9',
    card: '#ffffff',
    textSecondary: '#666666',
    textTertiary: '#999999',
    separator: '#f0f0f0',
    inputBackground: '#f8f8f8',
    inputBorder: '#e0e0e0',
    placeholder: '#999999',
    iconPrimary: '#000000',
    iconSecondary: '#666666',
    iconBackground: '#f5f5f5',
    overlay: 'rgba(0, 0, 0, 0.5)',
    modalBackground: 'rgba(0, 0, 0, 0.1)',
    // Keep your existing colors
    danger: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
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
    heplineBackground: '',
    // Additional colors for dark mode
    surface: '#1e1e1e',
    card: '#2a2a2a',
    textSecondary: '#cccccc',
    textTertiary: '#999999',
    separator: '#404040',
    inputBackground: '#2a2a2a',
    inputBorder: '#404040',
    placeholder: '#666666',
    iconPrimary: '#ffffff',
    iconSecondary: '#cccccc',
    iconBackground: '#404040',
    overlay: 'rgba(0, 0, 0, 0.5)',
    modalBackground: 'rgba(255, 255, 255, 0.1)',
    // Keep your existing colors
    danger: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
  },
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('auto'); // 'light', 'dark', 'auto'
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemeFromStorage();
  }, []);

  // Update status bar when theme changes
  useEffect(() => {
    const isDark = getIsDarkMode();
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
  }, [themeMode, systemColorScheme]);

  const loadThemeFromStorage = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading theme from storage:', error);
      setIsLoaded(true);
    }
  };

  const setTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
      setThemeMode(newTheme);
    } catch (error) {
      console.error('Error saving theme to storage:', error);
    }
  };

  const getIsDarkMode = () => {
    if (themeMode === 'light') return false;
    if (themeMode === 'dark') return true;
    return systemColorScheme === 'dark'; // auto mode
  };

  const isDarkMode = getIsDarkMode();
  const currentTheme = isDarkMode ? themes.dark : themes.light;

  const theme = {
    isDark: isDarkMode,
    isLoaded,
    colors: currentTheme,
    // New properties for theme switching
    theme: themeMode,
    setTheme,
    isDarkMode, // alias for backward compatibility
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