import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS } from './theme';

type ThemeColors = Record<string, string>;

type ThemeContextType = {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
};

const THEME_KEY = '@soprano_theme';

const ThemeContext = createContext<ThemeContextType>({
  colors: DARK_COLORS,
  isDark: true,
  toggleTheme: () => {},
});

/** Uygulamanın kök bileşenini sar */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(true);

  // Önceki tercihi yükle
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'light') setIsDark(false);
      else if (val === 'dark') setIsDark(true);
      // null ise sistem temasını kullan
      else setIsDark(systemScheme !== 'light');
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newVal = !prev;
      AsyncStorage.setItem(THEME_KEY, newVal ? 'dark' : 'light');
      return newVal;
    });
  };

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Her bileşende tema renklerini al */
export function useTheme() {
  return useContext(ThemeContext);
}
