/**
 * CWG design tokens — deep green / graphite professional SaaS.
 * No recreational cannabis aesthetics.
 */
export const colors = {
  brand: {
    greenDeep: "#0F3D2E",
    green: "#1B5E45",
    greenMuted: "#2A7A5C",
    accent: "#3D9B74",
  },
  graphite: {
    950: "#0B0D10",
    900: "#14181F",
    800: "#1E2430",
    700: "#2A3344",
    600: "#3A4558",
    500: "#5A6578",
    400: "#8A93A3",
    300: "#B0B7C3",
    200: "#D4D8E0",
    100: "#E8EBF0",
    50: "#F4F6F8",
  },
  surface: {
    page: "#F4F6F8",
    card: "#FFFFFF",
    inverse: "#14181F",
  },
  semantic: {
    success: "#1B5E45",
    warning: "#B45309",
    danger: "#B91C1C",
    info: "#1D4ED8",
  },
  text: {
    primary: "#14181F",
    secondary: "#5A6578",
    inverse: "#F4F6F8",
    muted: "#8A93A3",
  },
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

export const typography = {
  fontFamily: {
    sans: '"DM Sans", "Segoe UI", sans-serif',
    display: '"Fraunces", Georgia, serif',
  },
} as const;
