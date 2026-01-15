import type { Quote } from "@/lib/typing-constants";

export type QuotesManifest = {
  lengths: string[];
  default: string;
};

// Cache for loaded data
let cachedManifest: QuotesManifest | null = null;
const quotesCache: Record<string, Quote[]> = {};

// Fetch quotes manifest from /public/quotes/manifest.json
export async function fetchQuotesManifest(): Promise<QuotesManifest> {
  if (cachedManifest) {
    return cachedManifest;
  }

  try {
    const res = await fetch("/quotes/manifest.json");
    if (!res.ok) {
      console.error("Failed to load quotes manifest");
      return { lengths: [], default: "medium" };
    }
    cachedManifest = await res.json();
    return cachedManifest!;
  } catch (e) {
    console.error("Failed to load quotes manifest:", e);
    return { lengths: [], default: "medium" };
  }
}

// Get manifest from cache
export function getQuotesManifestFromCache(): QuotesManifest | null {
  return cachedManifest;
}

// Fetch quotes for a specific length
export async function fetchQuotes(length: string): Promise<Quote[]> {
  const key = length.toLowerCase();
  
  // Return from cache if available
  if (quotesCache[key]) {
    return quotesCache[key];
  }

  try {
    const res = await fetch(`/quotes/${key}.json`);
    if (!res.ok) return [];
    
    const quotes = await res.json();
    quotesCache[key] = quotes;
    return quotes;
  } catch (e) {
    console.error(`Failed to load quotes: ${length}`, e);
    return [];
  }
}

// Get quotes synchronously from cache
export function getQuotesFromCache(length: string): Quote[] | null {
  return quotesCache[length.toLowerCase()] || null;
}
