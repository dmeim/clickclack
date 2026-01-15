/**
 * Global Color Palette
 *
 * This file serves as the single source of truth for color values across the application.
 * Update values here to propagate changes to both CSS variables (via layout.tsx) and JS components.
 */
export const GLOBAL_COLORS = {
  background: "#323437", // Deep Charcoal - Main application background
  surface: "#2c2e31", // Darker Charcoal - Cards, Modals, Toolbars

  text: {
    primary: "#d1d5db", // Light Gray - Used for correct text and primary content
    secondary: "#4b5563", // Muted Gray - Used for upcoming text and less prominent elements
    error: "#ef4444", // Vibrant Red - Used for incorrect characters and error states
    success: "#22c55e", // Green - Used for completion states
    body: "#d1d0c5", // Bone White - Default body text color (from globals.css)
  },

  brand: {
    primary: "#3cb5ee", // Sky Blue - Primary brand color (Cursor, Unselected Buttons)
    secondary: "#0097b2", // Teal - Secondary brand color (Selected Buttons)
    accent: "#a855f7", // Purple - Accent color (Ghost Cursor)
  },
} as const;
