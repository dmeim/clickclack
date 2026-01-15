import type { Theme } from "@/lib/typing-constants";

export type ThemeDefinition = Theme & {
  name: string;
};

export type ThemeManifest = {
  themes: string[];
  default: string;
};

// Cache for loaded data
let cachedManifest: ThemeManifest | null = null;
const themeCache: Record<string, ThemeDefinition> = {};

// Format theme name for display (capitalize first letter of each word)
const formatThemeName = (name: string): string => {
  return name
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Fetch theme manifest from /public/themes/manifest.json
export async function fetchThemeManifest(): Promise<ThemeManifest> {
  if (cachedManifest) {
    return cachedManifest;
  }

  try {
    const res = await fetch("/themes/manifest.json");
    if (!res.ok) {
      console.error("Failed to load theme manifest");
      return { themes: [], default: "typesetgo" };
    }
    cachedManifest = await res.json();
    return cachedManifest!;
  } catch (e) {
    console.error("Failed to load theme manifest:", e);
    return { themes: [], default: "typesetgo" };
  }
}

// Get manifest from cache
export function getThemeManifestFromCache(): ThemeManifest | null {
  return cachedManifest;
}

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
  const manifest = await fetchThemeManifest();
  
  const themes = await Promise.all(
    manifest.themes.map((name) => fetchTheme(name))
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
