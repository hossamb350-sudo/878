/**
 * Design Tokens for Taiz Media Platform
 * Centralized source of truth for colors, typography, spacing, and shadows.
 */

export const DESIGN_TOKENS = {
  colors: {
    brand: {
      navy: '#032F69',
      royal: '#055198',
      sky: '#049EDF',
      cyan: '#00E5FF',
      soft: '#90BAD6',
    },
    surface: {
      main: '#eef1f5', // Platform background matching splash/logo background
      card: '#ffffff',
      hover: '#f1f5f9',
    },
    border: {
      light: 'rgba(241, 245, 249, 0.6)',
      subtle: 'rgba(226, 232, 240, 0.8)',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  typography: {
    fontFamily: {
      sans: '"Cairo", ui-sans-serif, system-ui, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '2.5rem',
    full: '9999px',
  },
  shadows: {
    soft: '0 5px 15px -5px rgba(3, 47, 105, 0.05)',
    medium: '0 10px 30px -10px rgba(3, 47, 105, 0.1)',
    strong: '0 15px 40px -10px rgba(3, 47, 105, 0.15)',
    glow: '0 0 20px rgba(4, 158, 223, 0.2)',
  },
};
