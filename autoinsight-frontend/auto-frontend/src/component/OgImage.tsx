import React, { useEffect, useState } from 'react';
import { fetchOgImage, getCachedOgImage } from '../services/ogImageService';

interface OgImageProps {
  listingUrl?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}

const DEFAULT_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <rect width="100%" height="100%" fill="#0f172a"/>
      <rect x="80" y="70" width="800" height="400" rx="32" fill="#1e293b" stroke="#334155" stroke-width="4"/>
      <text x="50%" y="46%" text-anchor="middle" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="42">Vehicle image unavailable</text>
      <text x="50%" y="56%" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="24">AutoInsight fallback cover</text>
    </svg>`,
  );

const OgImage: React.FC<OgImageProps> = ({ listingUrl, fallbackSrc, alt, className }) => {
  const [src, setSrc] = useState<string | undefined>(() => {
    const cached = getCachedOgImage(listingUrl);
    return cached || fallbackSrc || DEFAULT_FALLBACK;
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

    setSrc(fallbackSrc || DEFAULT_FALLBACK);

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

  return (
    <img
      src={src || DEFAULT_FALLBACK}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setSrc(fallbackSrc || DEFAULT_FALLBACK)}
    />
  );
};

export default OgImage;
