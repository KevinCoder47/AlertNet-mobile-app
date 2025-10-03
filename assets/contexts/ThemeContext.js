import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('light'); // 'light', 'dark', or 'auto'
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from storage
  useEffect(() => {
    loadThemeFromStorage();
  }, []);

  // Listen to system theme changes when theme is set to 'auto'
  useEffect(() => {
    if (theme === 'auto') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setIsDarkMode(colorScheme === 'dark');
        updateStatusBar(colorScheme === 'dark');
      });
      
      // Set initial system theme
      const systemColorScheme = Appearance.getColorScheme();
      setIsDarkMode(systemColorScheme === 'dark');
      updateStatusBar(systemColorScheme === 'dark');
      
      return () => subscription?.remove();
    }
  }, [theme]);

  // Update dark mode when theme changes
  useEffect(() => {
    if (theme === 'light') {
      setIsDarkMode(false);
      updateStatusBar(false);
    } else if (theme === 'dark') {
      setIsDarkMode(true);
      updateStatusBar(true);
    }
    // 'auto' is handled in the previous useEffect
  }, [theme]);

  const loadThemeFromStorage = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme) {
        setThemeState(savedTheme);
      } else {
        // Default to system theme if no saved preference
        const systemColorScheme = Appearance.getColorScheme();
        setThemeState('auto');
        setIsDarkMode(systemColorScheme === 'dark');
        updateStatusBar(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme from storage:', error);
    }
  };

  const setTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme to storage:', error);
    }
  };

  const updateStatusBar = (isDark) => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
  };

  // Theme colors object
  const colors = {
    // Background colors
    background: isDarkMode ? '#121212' : '#ffffff',
    surface: isDarkMode ? '#1e1e1e' : '#f9f9f9',
    card: isDarkMode ? '#2a2a2a' : '#ffffff',
    
    // Text colors
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#cccccc' : '#666666',
    textTertiary: isDarkMode ? '#999999' : '#999999',
    
    // Border colors
    border: isDarkMode ? '#404040' : '#e0e0e0',
    separator: isDarkMode ? '#404040' : '#f0f0f0',
    
    // Interactive colors
    primary: '#007AFF',
    danger: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    modalBackground: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    
    // Input colors
    inputBackground: isDarkMode ? '#2a2a2a' : '#f8f8f8',
    inputBorder: isDarkMode ? '#404040' : '#e0e0e0',
    placeholder: isDarkMode ? '#666666' : '#999999',
    
    // Icon colors
    iconPrimary: isDarkMode ? '#ffffff' : '#000000',
    iconSecondary: isDarkMode ? '#cccccc' : '#666666',
    iconBackground: isDarkMode ? '#404040' : '#f5f5f5',
  };

  const value = {
    theme,
    setTheme,
    isDarkMode,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};