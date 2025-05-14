import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

//light and dark themes
const themes = {
  light: {
    background: '',
    text: '',
    primary: '',
    primaryTwo: '',
    secondary: '',
    border: '',
    altText: '',
    isDark: false,
  },
  dark: {
    background: '',
    text: '',
    primary: '',
    primaryTwo: '',
    secondary: '',
    border: '',
    altText: '',
    isDark: true,
  },
};


const ThemeContext = createContext();


export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });

    return () => subscription.remove();
  }, []);

  const theme = {
    isDark,
    colors: isDark ? themes.dark : themes.light,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);