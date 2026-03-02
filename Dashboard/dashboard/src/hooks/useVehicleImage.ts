// Hook for loading vehicle images from Open Graph metadata
import { useState, useEffect } from 'react';
import { fetchOGImage, getCachedImage, DEFAULT_CAR_IMAGE } from '../services/imageService';

interface UseVehicleImageOptions {
  vehicleUrl?: string;
  fallbackImage?: string;
  lazy?: boolean;
}

interface UseVehicleImageResult {
  imageUrl: string;
  isLoading: boolean;
  error: boolean;
}

export function useVehicleImage(options: UseVehicleImageOptions): UseVehicleImageResult {
  const { vehicleUrl, fallbackImage = DEFAULT_CAR_IMAGE, lazy = false } = options;
  
  const [imageUrl, setImageUrl] = useState<string>(() => {
    // Check if we have a cached image immediately
    if (vehicleUrl) {
      const cached = getCachedImage(vehicleUrl);
      if (cached) return cached;
    }
    return fallbackImage;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Don't fetch if no URL or lazy loading is enabled
    if (!vehicleUrl || lazy) {
      return;
    }
    
    // Check cache again
    const cached = getCachedImage(vehicleUrl);
    if (cached) {
      setImageUrl(cached);
      return;
    }
    
    // Fetch the image
    let isMounted = true;
    setIsLoading(true);
    setError(false);
    
    fetchOGImage(vehicleUrl)
      .then(ogImageUrl => {
        if (isMounted) {
          if (ogImageUrl) {
            setImageUrl(ogImageUrl);
          } else {
            setError(true);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [vehicleUrl, lazy]);
  
  return { imageUrl, isLoading, error };
}

// Hook for batch loading multiple vehicle images
export function useBatchVehicleImages(vehicleUrls: string[]): Map<string, string> {
  const [imageMap, setImageMap] = useState<Map<string, string>>(() => {
    // Initialize with cached images
    const map = new Map<string, string>();
    vehicleUrls.forEach(url => {
      const cached = getCachedImage(url);
      if (cached) {
        map.set(url, cached);
      }
    });
    return map;
  });
  
  useEffect(() => {
    // Find URLs that are not in cache
    const uncachedUrls = vehicleUrls.filter(url => !getCachedImage(url));
    
    if (uncachedUrls.length === 0) {
      return;
    }
    
    let isMounted = true;
    
    // Fetch images one by one with a delay to avoid overwhelming
    const fetchSequentially = async () => {
      for (const url of uncachedUrls) {
        if (!isMounted) break;
        
        try {
          const ogImageUrl = await fetchOGImage(url);
          if (isMounted && ogImageUrl) {
            setImageMap(prev => new Map(prev).set(url, ogImageUrl));
          }
        } catch (error) {
          console.warn(`Failed to fetch image for ${url}:`, error);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    };
    
    fetchSequentially();
    
    return () => {
      isMounted = false;
    };
  }, [vehicleUrls.join(',')]);
  
  return imageMap;
}
