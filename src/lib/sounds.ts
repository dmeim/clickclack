export type SoundManifest = {
  [category: string]: {
    [pack: string]: string[];
  };
};

// Cache for loaded manifest
let cachedManifest: SoundManifest | null = null;

// Fetch sound manifest from /public/sounds/manifest.json
export async function fetchSoundManifest(): Promise<SoundManifest> {
  if (cachedManifest) {
    return cachedManifest;
  }

  try {
    const res = await fetch("/sounds/manifest.json");
    if (!res.ok) {
      console.error("Failed to load sound manifest");
      return { typing: {}, warning: {}, error: {} };
    }
    cachedManifest = await res.json();
    return cachedManifest!;
  } catch (e) {
    console.error("Failed to load sound manifest:", e);
    return { typing: {}, warning: {}, error: {} };
  }
}

// Get manifest from cache (returns empty if not loaded yet)
export function getSoundManifestFromCache(): SoundManifest | null {
  return cachedManifest;
}

export const getRandomSoundUrl = (
  manifest: SoundManifest | null,
  category: string,
  pack: string
): string | null => {
  if (!manifest) return null;

  const categoryData = manifest[category];
  if (!categoryData) return null;

  const files = categoryData[pack];
  if (!files || !Array.isArray(files) || files.length === 0) {
    return null;
  }

  const randomFile = files[Math.floor(Math.random() * files.length)];
  return `/sounds/${category}/${pack}/${randomFile}`;
};

// Get list of available sound packs for a category
export function getSoundPacks(manifest: SoundManifest | null, category: string): string[] {
  if (!manifest || !manifest[category]) return [];
  return Object.keys(manifest[category]);
}
