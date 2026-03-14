const CACHE_PREFIX = 'autoinsight_og_image_';
const memoryCache = new Map<string, string | null>();
const inflightRequests = new Map<string, Promise<string | null>>();
const OG_API_BASE_URL = (import.meta.env.VITE_OG_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function ogApiUrl(path: string): string {
  if (!OG_API_BASE_URL) {
    return path;
  }
  return `${OG_API_BASE_URL}${path}`;
}

function getStorageKey(listingUrl: string): string {
  return `${CACHE_PREFIX}${listingUrl}`;
}

export function getCachedOgImage(listingUrl?: string): string | null {
  if (!listingUrl) return null;

  if (memoryCache.has(listingUrl)) {
    return memoryCache.get(listingUrl) ?? null;
  }

  try {
    const stored = localStorage.getItem(getStorageKey(listingUrl));
    if (stored) {
      memoryCache.set(listingUrl, stored);
      return stored;
    }
  } catch {
    // Ignore localStorage failures and continue with network fetch.
  }

  return null;
}

function persistOgImage(listingUrl: string, imageUrl: string | null): void {
  memoryCache.set(listingUrl, imageUrl);

  if (!imageUrl) return;

  try {
    localStorage.setItem(getStorageKey(listingUrl), imageUrl);
  } catch {
    // Ignore storage quota failures; in-memory cache is enough for current session.
  }
}

export async function fetchOgImage(listingUrl?: string): Promise<string | null> {
  if (!listingUrl) return null;

  const cached = getCachedOgImage(listingUrl);
  if (cached) return cached;

  const existingRequest = inflightRequests.get(listingUrl);
  if (existingRequest) {
    return existingRequest;
  }

  const request = fetch(`${ogApiUrl('/api/og-image')}?url=${encodeURIComponent(listingUrl)}`)
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as { image?: string | null };
      const image = data?.image?.trim() || null;
      if (image) {
        persistOgImage(listingUrl, image);
      }
      return image;
    })
    .catch(() => null)
    .finally(() => {
      inflightRequests.delete(listingUrl);
    });

  inflightRequests.set(listingUrl, request);
  return request;
}
