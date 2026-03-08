import React, { useEffect } from 'react';
import { Sponsorship, AdSlotConfig } from '../types';

interface SponsorshipBannerProps {
  sponsorship?: Sponsorship;
  slotConfig?: AdSlotConfig;
  onClosePopup?: () => void;
  onImpression?: (id: string) => void;
  onClickEvent?: (id: string) => void;
}

export const SponsorshipBanner: React.FC<SponsorshipBannerProps> = ({ sponsorship, slotConfig, onClosePopup, onImpression, onClickEvent }) => {
  useEffect(() => {
    if (sponsorship && onImpression) {
      onImpression(sponsorship.id);
    }
  }, [sponsorship?.id, onImpression]);

  if (!sponsorship || !sponsorship.active || !slotConfig) return null;
  
  const handleClick = () => {
    if (sponsorship && onClickEvent) {
      onClickEvent(sponsorship.id);
    }
  }

  const { width, height, id: position } = slotConfig;

  if (position === 'HOME_POPUP') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClosePopup}>
        <div 
          className="relative bg-neutral-900 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,255,157,0.3)] border border-white/10" 
          onClick={e => e.stopPropagation()}
          style={{ width: `${width}px`, height: `${height}px`, maxWidth: '95vw', maxHeight: '95vh' }}
        >
          <button 
            onClick={onClosePopup}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-neon hover:text-black transition-colors font-bold"
          >
            ✕
          </button>
          <a
            href={sponsorship.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="block w-full h-full cursor-pointer"
          >
            {sponsorship.imageUrl && (
              <img 
                src={sponsorship.imageUrl} 
                className="w-full h-full object-contain" 
                alt={sponsorship.name}
                style={{ width: `${width}px`, height: `${height}px` }}
              />
            )}
          </a>
        </div>
      </div>
    );
  }

  const containerStylesMap: Record<string, string> = {
    HOME_LVL_1: "my-12 flex justify-center",
    HOME_LVL_3: "mb-6 flex justify-center",
    NEWS_TOP_LVL_1: "mb-8 flex justify-center",
    NEWS_SIDE_LVL_1: "mb-6 flex justify-center",
    NEWS_SIDE_LVL_2: "mb-6 flex justify-center",
    LANDING_PAGE: "my-10 flex justify-center"
  };

  const containerStyles = position === 'HOME_LVL_2' ? 'my-8 flex justify-center' : (containerStylesMap[position] || "my-6 flex justify-center");

  const anchorStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    minWidth: `${width}px`,
    minHeight: `${height}px`,
  };

  return (
    <div className={containerStyles}>
      <a 
        href={sponsorship.link} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`block group relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-xl`}
        style={anchorStyle}
      >
        {sponsorship.imageUrl && (
          <img 
            src={sponsorship.imageUrl} 
            alt={sponsorship.name} 
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
            style={{ width: `${width}px`, height: `${height}px` }}
          />
        )}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md text-[8px] text-white/70 rounded border border-white/10 uppercase font-bold tracking-widest">
          Publicidad
        </div>
      </a>
    </div>
  );
};