import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { useSettingsStore } from '../stores/useSettingsStore';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  isDark: boolean;
  // Core Backgrounds & Surfaces
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceElevated: string;
  // Borders
  border: string;
  borderSubtle: string;
  borderStrong: string;
  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Brand / Primary (Indigo)
  primary: string;
  primaryBg: string;
  primaryBorder: string;
  primaryText: string;
  // Semantic Accents
  success: string;
  successBg: string;
  successBorder: string;
  successText: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  dangerText: string;
  warning: string;
  warningBg: string;
  warningBorder: string;
  warningText: string;
  // Shadows & Overlays
  shadowColor: string;
  shadowOpacity: number;
  backdrop: string;
  // iOS Glass tokens
  glassSurface: string;
  glassBorder: string;
  glassShadow: string;
}

export const LIGHT_THEME: ThemeColors = {
  isDark: false,
  background: '#F2F2F7', // Apple iOS System Grouped Background
  surface: 'rgba(255, 255, 255, 0.85)', // Frosted Glass surface
  surfaceSubtle: 'rgba(0, 0, 0, 0.038)',
  surfaceElevated: 'rgba(255, 255, 255, 0.96)',
  border: 'rgba(0, 0, 0, 0.06)',
  borderSubtle: 'rgba(0, 0, 0, 0.035)',
  borderStrong: 'rgba(0, 0, 0, 0.12)',
  textPrimary: '#000000', // Apple primary text
  textSecondary: '#3C3C43', // Apple secondary label
  textMuted: '#8E8E93', // Apple tertiary label
  primary: '#4F46E5', // Indigo accent
  primaryBg: 'rgba(79, 70, 229, 0.08)',
  primaryBorder: 'rgba(79, 70, 229, 0.20)',
  primaryText: '#4338CA',
  success: '#10B981',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  successText: '#047857',
  danger: '#F43F5E',
  dangerBg: '#FFF1F2',
  dangerBorder: '#FECDD3',
  dangerText: '#BE123C',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#B45309',
  shadowColor: '#000000',
  shadowOpacity: 0.04,
  backdrop: 'rgba(0, 0, 0, 0.35)',
  glassSurface: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.85)',
  glassShadow: 'rgba(0, 0, 0, 0.04)',
};

export const DARK_THEME: ThemeColors = {
  isDark: true,
  background: '#09090B', // Deep Obsidian System Grouped Background
  surface: 'rgba(24, 24, 28, 0.78)', // Frosted Dark Glass surface
  surfaceSubtle: 'rgba(255, 255, 255, 0.05)',
  surfaceElevated: 'rgba(34, 34, 40, 0.88)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  textPrimary: '#FFFFFF', // Apple primary dark text
  textSecondary: '#EBEBF5', // Apple secondary dark text
  textMuted: '#8E8E93', // Apple tertiary dark text
  primary: '#6366F1', // Indigo glow
  primaryBg: 'rgba(99, 102, 241, 0.16)',
  primaryBorder: 'rgba(99, 102, 241, 0.32)',
  primaryText: '#A5B4FC',
  success: '#34D399',
  successBg: 'rgba(16, 185, 129, 0.15)',
  successBorder: 'rgba(16, 185, 129, 0.3)',
  successText: '#6EE7B7',
  danger: '#FB7185',
  dangerBg: 'rgba(244, 63, 94, 0.15)',
  dangerBorder: 'rgba(244, 63, 94, 0.3)',
  dangerText: '#FDA4AF',
  warning: '#FBBF24',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  warningBorder: 'rgba(245, 158, 11, 0.3)',
  warningText: '#FCD34D',
  shadowColor: '#000000',
  shadowOpacity: 0.28,
  backdrop: 'rgba(0, 0, 0, 0.65)',
  glassSurface: 'rgba(24, 24, 28, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassShadow: 'rgba(0, 0, 0, 0.25)',
};

export interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: LIGHT_THEME,
  isDark: false,
  mode: 'light',
  themeMode: 'light',
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { settings, updateSettings } = useSettingsStore();

  const mode = (settings.theme as ThemeMode) || 'system';

  const isDark = useMemo(() => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return systemColorScheme === 'dark';
  }, [mode, systemColorScheme]);

  const theme = useMemo(() => {
    return isDark ? DARK_THEME : LIGHT_THEME;
  }, [isDark]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.classList.remove('light-theme', 'dark-theme');
      document.body.classList.add(isDark ? 'dark-theme' : 'light-theme');
    }
  }, [isDark]);

  const setThemeMode = (newMode: ThemeMode) => {
    updateSettings({ theme: newMode });
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        mode,
        themeMode: mode,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
