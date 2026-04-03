import { useColorScheme } from 'react-native';

export const Colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    accent: '#4F7BF7',
    destructive: '#E53E3E',
    textPrimary: '#0F0F0F',
    textSecondary: '#6B6B6B',
    border: '#E5E5E5',
  },
  dark: {
    background: '#0F0F0F',
    surface: '#1C1C1E',
    accent: '#5E8CF8',
    destructive: '#FC8181',
    textPrimary: '#F5F5F5',
    textSecondary: '#8E8E93',
    border: '#2C2C2E',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const Typography = {
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  heading: { fontSize: 20, fontWeight: '600' as const, lineHeight: 24 },
  display: { fontSize: 28, fontWeight: '600' as const, lineHeight: 34 },
};

export function useThemeColors() {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
