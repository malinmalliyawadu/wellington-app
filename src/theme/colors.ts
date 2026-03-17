// Wellington color theme

export const lightColors = {
  // Brand
  primary: "#F5A623",
  primaryDark: "#D4930D",

  // Background
  background: "#FFFFFF",
  backgroundSecondary: "#F5F5F5",

  // Text
  text: "#1A1A1A",
  textSecondary: "#666666",
  textMuted: "#999999",

  // Grays
  gray100: "#F7F7F7",
  gray200: "#E5E5E5",
  gray300: "#D4D4D4",
  gray400: "#A3A3A3",
  gray500: "#737373",
  gray600: "#525252",

  // Category colors
  category: {
    cafe: "#8B4513",
    restaurant: "#E85D04",
    bar: "#7209B7",
    attraction: "#0077B6",
    park: "#2D6A4F",
    venue: "#D62828",
    trail: "#0F766E",
    shop: "#D946EF",
  },

  // Interactive
  liked: "#E0245E",
  saved: "#E8962E",
  explored: "#16A34A",

  // Semantic
  error: "#DC2626",
  success: "#16A34A",
  warning: "#F59E0B",

  // UI
  border: "#E5E5E5",
  cardBackground: "#FFFFFF",
  translucentCardBackground: "rgba(255, 255, 255, 0.6)",
  overlay: "rgba(0, 0, 0, 0.5)",

  // Glass / translucent UI
  glass: "rgba(255, 255, 255, 0.15)",
  glassBorder: "rgba(255, 255, 255, 0.4)",
  dividerLight: "rgba(0, 0, 0, 0.08)",
};

export const darkColors: Colors = {
  // Brand
  primary: "#F5A623",
  primaryDark: "#D4930D",

  // Background
  background: "#000000",
  backgroundSecondary: "#1C1C1E",

  // Text
  text: "#F5F5F5",
  textSecondary: "#A1A1A6",
  textMuted: "#6C6C70",

  // Grays (inverted)
  gray100: "#1C1C1E",
  gray200: "#2C2C2E",
  gray300: "#3A3A3C",
  gray400: "#636366",
  gray500: "#8E8E93",
  gray600: "#AEAEB2",

  // Category colors (same or slightly adjusted for dark)
  category: {
    cafe: "#A0522D",
    restaurant: "#FF6F20",
    bar: "#8B2FC9",
    attraction: "#0096E0",
    park: "#3A8B6A",
    venue: "#E84040",
    trail: "#14B8A6",
    shop: "#E879F9",
  },

  // Interactive
  liked: "#E0245E",
  saved: "#E8962E",
  explored: "#22C55E",

  // Semantic
  error: "#EF4444",
  success: "#22C55E",
  warning: "#FBBF24",

  // UI
  border: "#3A3A3C",
  cardBackground: "#1C1C1E",
  translucentCardBackground: "rgba(30, 30, 30, 0.6)",
  overlay: "rgba(0, 0, 0, 0.7)",

  // Glass / translucent UI
  glass: "rgba(60, 60, 60, 0.3)",
  glassBorder: "rgba(255, 255, 255, 0.15)",
  dividerLight: "rgba(255, 255, 255, 0.1)",
};

export type Colors = typeof lightColors;

