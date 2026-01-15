export type WordsManifest = {
  difficulties: string[];
  default: string;
};

// Cache for loaded data
let cachedManifest: WordsManifest | null = null;
const wordsCache: Record<string, string[]> = {};

// Fetch words manifest from /public/words/manifest.json
export async function fetchWordsManifest(): Promise<WordsManifest> {
  if (cachedManifest) {
    return cachedManifest;
  }

  try {
    const res = await fetch("/words/manifest.json");
    if (!res.ok) {
      console.error("Failed to load words manifest");
      return { difficulties: [], default: "medium" };
    }
    cachedManifest = await res.json();
    return cachedManifest!;
  } catch (e) {
    console.error("Failed to load words manifest:", e);
    return { difficulties: [], default: "medium" };
  }
}

// Get manifest from cache
export function getWordsManifestFromCache(): WordsManifest | null {
  return cachedManifest;
}

// Fetch words for a specific difficulty
export async function fetchWords(difficulty: string): Promise<string[]> {
  const key = difficulty.toLowerCase();
  
  // Return from cache if available
  if (wordsCache[key]) {
    return wordsCache[key];
  }

  try {
    const res = await fetch(`/words/${key}.json`);
    if (!res.ok) return [];
    
    const words = await res.json();
    wordsCache[key] = words;
    return words;
  } catch (e) {
    console.error(`Failed to load words: ${difficulty}`, e);
    return [];
  }
}

// Get words synchronously from cache
export function getWordsFromCache(difficulty: string): string[] | null {
  return wordsCache[difficulty.toLowerCase()] || null;
}
