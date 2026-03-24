import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS } from './theme';

type ThemeColors = Record<string, string>;

type ThemeContextType = {
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: DARK_COLORS,
  isDark: true,
});

/** Uygulamanın kök bileşenini sar */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Her bileşende tema renklerini al */
export function useTheme() {
  return useContext(ThemeContext);
}
