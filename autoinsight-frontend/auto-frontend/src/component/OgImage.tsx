import React, { useEffect, useState } from 'react';
import { fetchOgImage, getCachedOgImage } from '../services/ogImageService';

interface OgImageProps {
  listingUrl?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}

const OgImage: React.FC<OgImageProps> = ({ listingUrl, fallbackSrc, alt, className }) => {
  const [src, setSrc] = useState<string | undefined>(() => {
    const cached = getCachedOgImage(listingUrl);
    return cached || fallbackSrc;
  });

  useEffect(() => {
    let active = true;
    const cached = getCachedOgImage(listingUrl);

    if (cached) {
      setSrc(cached);
      return () => {
        active = false;
      };
    }

    setSrc(fallbackSrc);

    if (!listingUrl) {
      return () => {
        active = false;
      };
    }

    fetchOgImage(listingUrl).then((image) => {
      if (active && image) {
        setSrc(image);
      }
    });

    return () => {
      active = false;
    };
  }, [listingUrl, fallbackSrc]);

  if (!src) return null;

  return <img src={src} alt={alt} className={className} loading="lazy" />;
};

export default OgImage;
