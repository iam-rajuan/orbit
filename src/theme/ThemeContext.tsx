import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
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
}

export const LIGHT_THEME: ThemeColors = {
  isDark: false,
  background: '#FAFAF9', // warm stone-50
  surface: '#FFFFFF',
  surfaceSubtle: '#F4F4F5', // zinc-100
  surfaceElevated: '#FFFFFF',
  border: '#F4F4F5',
  borderSubtle: '#E4E4E7', // zinc-200
  borderStrong: '#D4D4D8',
  textPrimary: '#18181B', // zinc-900
  textSecondary: '#52525B', // zinc-600
  textMuted: '#71717A', // zinc-500
  primary: '#4F46E5', // indigo-600
  primaryBg: '#EEF2FF',
  primaryBorder: '#C7D2FE',
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
  shadowColor: '#18181B',
  shadowOpacity: 0.03,
  backdrop: 'rgba(9, 9, 11, 0.45)',
};

export const DARK_THEME: ThemeColors = {
  isDark: true,
  background: '#09090B', // zinc-950 obsidian
  surface: '#121215', // premium deep surface
  surfaceSubtle: '#18181B', // zinc-900
  surfaceElevated: '#1F1F23', // zinc-850
  border: '#27272A', // zinc-800
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderStrong: '#3F3F46', // zinc-700
  textPrimary: '#FAFAFA', // zinc-50
  textSecondary: '#A1A1AA', // zinc-400
  textMuted: '#71717A', // zinc-500
  primary: '#6366F1', // indigo-500 glow
  primaryBg: 'rgba(99, 102, 241, 0.15)',
  primaryBorder: 'rgba(99, 102, 241, 0.3)',
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
  shadowOpacity: 0.35,
  backdrop: 'rgba(0, 0, 0, 0.75)',
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
