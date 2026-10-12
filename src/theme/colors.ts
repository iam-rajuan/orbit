/**
 * Design tokens for Daily View V4
 * Minimal, warm, premium palette inspired by Things 3, Linear, Todoist
 */

export const PALETTE = {
  // Brand / Primary — Deep Indigo
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  // Success — Emerald
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  // Warning — Amber
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  // Danger — Rose
  danger: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
  },
  // Neutral — Zinc (warmer than Slate)
  zinc: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },
  // Surface — Stone (warm backgrounds)
  stone: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
  },
};

export const PRIORITY_COLORS = {
  High: {
    bg: '#FFF1F2',
    text: '#BE123C',
    border: '#FECDD3',
    darkBg: '#450a0a',
    darkText: '#FCA5A5',
    darkBorder: '#7F1D1D',
    dot: '#F43F5E',
  },
  Medium: {
    bg: '#FFFBEB',
    text: '#B45309',
    border: '#FDE68A',
    darkBg: '#451A03',
    darkText: '#FCD34D',
    darkBorder: '#78350F',
    dot: '#F59E0B',
  },
  Low: {
    bg: '#F4F4F5',
    text: '#52525B',
    border: '#E4E4E7',
    darkBg: '#27272A',
    darkText: '#A1A1AA',
    darkBorder: '#3F3F46',
    dot: '#71717A',
  },
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Office: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  Study: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  Personal: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  Finance: { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' },
  Health: { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' },
  // Expense categories
  Groceries: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  'Snacks & Tea': { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  Commute: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
  'Food & Dining': { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  Utilities: { bg: '#F4F4F5', text: '#3F3F46', border: '#E4E4E7' },
};

export const EXPENSE_TYPE_COLORS = {
  Need: {
    bg: '#ECFDF5',
    text: '#047857',
    border: '#A7F3D0',
  },
  Want: {
    bg: '#F5F3FF',
    text: '#7C3AED',
    border: '#DDD6FE',
  },
};
