import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className: string;
  priority?: boolean;
  onLoadComplete?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ src, alt, className, priority = false, onLoadComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoadComplete) onLoadComplete();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (onLoadComplete) onLoadComplete();
  };

  // Si no hay src o hubo error, mostramos un placeholder prolijo
  if (!src || hasError) {
    return (
      <div className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-black border border-white/5 ${className}`}>
        <div className="absolute inset-0 opacity-10 flex items-center justify-center overflow-hidden">
           <img src="https://www.a1toque.com/wp-content/uploads/2020/06/Artboard-22-4.png" className="w-1/2 grayscale invert scale-150 rotate-12" alt="" />
        </div>
        <ImageIcon className="text-white/20 mb-2 relative z-10" size={src ? 20 : 32} />
        {!src && <span className="text-[8px] font-black uppercase tracking-widest text-white/30 relative z-10">Sin Imagen</span>}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-neon/20 border-t-neon rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src || undefined}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-700 ${isLoading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};