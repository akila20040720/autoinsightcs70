// Image Service - Fetches Open Graph images from vehicle URLs
const IMAGE_CACHE_KEY = 'autoinsight_image_cache';
const CACHE_EXPIRY_DAYS = 7;

interface ImageCache {
  [url: string]: {
    imageUrl: string;
    timestamp: number;
  };
}

// Load cache from localStorage
function loadCache(): ImageCache {
  try {
    const cached = localStorage.getItem(IMAGE_CACHE_KEY);
    if (!cached) return {};
    const cache = JSON.parse(cached) as ImageCache;
    
    // Clean expired entries
    const now = Date.now();
    const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    Object.keys(cache).forEach(url => {
      if (now - cache[url].timestamp > expiryMs) {
        delete cache[url];
      }
    });
    
    return cache;
  } catch {
    return {};
  }
}

// Save cache to localStorage
function saveCache(cache: ImageCache): void {
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save image cache:', error);
  }
}

const imageCache: ImageCache = loadCache();

// Extract Open Graph image from HTML
function extractOGImage(html: string): string | null {
  // Look for og:image meta tag
  const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                       html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
  
  if (ogImageMatch && ogImageMatch[1]) {
    return ogImageMatch[1];
  }
  
  // Fallback to twitter:image
  const twitterImageMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
                            html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i);
  
  if (twitterImageMatch && twitterImageMatch[1]) {
    return twitterImageMatch[1];
  }
  
  return null;
}

// Fetch Open Graph image from URL
export async function fetchOGImage(url: string): Promise<string | null> {
  // Check cache first
  if (imageCache[url]) {
    return imageCache[url].imageUrl;
  }
  
  if (!url || !url.startsWith('http')) {
    return null;
  }
  
  try {
    // Use CORS proxy to fetch the page
    // You can use allorigins.win, corsproxy.io, or your own proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const imageUrl = extractOGImage(html);
    
    if (imageUrl) {
      // Cache the result
      imageCache[url] = {
        imageUrl,
        timestamp: Date.now(),
      };
      saveCache(imageCache);
      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to fetch OG image for ${url}:`, error);
    return null;
  }
}

// Batch fetch images for multiple URLs
export async function fetchOGImages(urls: string[]): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  
  // Filter out cached URLs
  const uncachedUrls = urls.filter(url => !imageCache[url]);
  const cachedUrls = urls.filter(url => imageCache[url]);
  
  // Add cached results immediately
  cachedUrls.forEach(url => {
    results.set(url, imageCache[url].imageUrl);
  });
  
  // Fetch uncached URLs in parallel (limit concurrency to avoid overwhelming the server)
  const BATCH_SIZE = 5;
  for (let i = 0; i < uncachedUrls.length; i += BATCH_SIZE) {
    const batch = uncachedUrls.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (url) => {
      const imageUrl = await fetchOGImage(url);
      results.set(url, imageUrl);
    });
    
    await Promise.all(batchPromises);
    
    // Small delay between batches to be respectful
    if (i + BATCH_SIZE < uncachedUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

// Get cached image immediately (no fetch)
export function getCachedImage(url: string): string | null {
  return imageCache[url]?.imageUrl || null;
}

// Clear old cache entries
export function clearImageCache(): void {
  localStorage.removeItem(IMAGE_CACHE_KEY);
  Object.keys(imageCache).forEach(key => delete imageCache[key]);
}

// Default fallback image
export const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=600&q=80';
