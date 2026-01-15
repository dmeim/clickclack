import type { Theme } from "@/lib/typing-constants";

export type ThemeDefinition = Theme & {
  name: string;
};

// List of available themes - matches JSON files in /public/themes/
// To add a new theme, just add the JSON file and add the name here
export const THEME_LIST = [
  "typesetgo",
  "christmas",
  "easter",
  "ocean",
  "sunset",
  "thanksgiving",
];

// Cache for loaded themes
const themeCache: Record<string, ThemeDefinition> = {};

// Format theme name for display (capitalize first letter of each word)
const formatThemeName = (name: string): string => {
  return name
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Fetch a single theme by name from /public/themes/
export async function fetchTheme(themeName: string): Promise<ThemeDefinition | null> {
  const key = themeName.toLowerCase();
  
  // Return from cache if available
  if (themeCache[key]) {
    return themeCache[key];
  }

  try {
    const res = await fetch(`/themes/${key}.json`);
    if (!res.ok) return null;
    
    const colors = await res.json();
    const theme: ThemeDefinition = {
      name: formatThemeName(key),
      ...colors,
    };
    
    // Cache the loaded theme
    themeCache[key] = theme;
    return theme;
  } catch (e) {
    console.error(`Failed to load theme: ${themeName}`, e);
    return null;
  }
}

// Fetch all available themes from /public/themes/
export async function fetchAllThemes(): Promise<ThemeDefinition[]> {
  const themes = await Promise.all(
    THEME_LIST.map((name) => fetchTheme(name))
  );
  
  // Filter out any failed loads and sort (TypeSetGo first, then alphabetically)
  return themes
    .filter((t): t is ThemeDefinition => t !== null)
    .sort((a, b) => {
      if (a.name.toLowerCase() === "typesetgo") return -1;
      if (b.name.toLowerCase() === "typesetgo") return 1;
      return a.name.localeCompare(b.name);
    });
}

// Get a theme synchronously from cache (returns null if not loaded yet)
export function getThemeFromCache(themeName: string): ThemeDefinition | null {
  return themeCache[themeName.toLowerCase()] || null;
}
