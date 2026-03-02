// Vehicle Image Component with Open Graph image loading
import React from 'react';
import { useVehicleImage } from '../hooks/useVehicleImage';

interface VehicleImageProps {
  vehicleUrl?: string;
  alt: string;
  className?: string;
  fallbackImage?: string;
  lazy?: boolean;
  showLoadingState?: boolean;
}

export const VehicleImage: React.FC<VehicleImageProps> = ({
  vehicleUrl,
  alt,
  className = '',
  fallbackImage,
  lazy = false,
  showLoadingState = true,
}) => {
  const { imageUrl, isLoading } = useVehicleImage({
    vehicleUrl,
    fallbackImage,
    lazy,
  });
  
  return (
    <div className={`vehicle-image-container ${className}`} style={{ position: 'relative' }}>
      {isLoading && showLoadingState && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(4px)',
            zIndex: 1,
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div className="loading-spinner" style={{
              width: '24px',
              height: '24px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
            }}>
              Loading...
            </span>
          </div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        onError={(e) => {
          // Fallback to default image on error
          const target = e.target as HTMLImageElement;
          if (fallbackImage && target.src !== fallbackImage) {
            target.src = fallbackImage;
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoading ? 0.5 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  );
};

// Add keyframes for spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
