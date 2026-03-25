import React, { useEffect } from 'react';
import { Sponsorship, AdSlotConfig } from '../types';
import { X } from 'lucide-react';

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClosePopup}>
        <div 
          className="relative bg-[#0d0d0d] rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,255,157,0.2)] border border-white/10 flex flex-col animate-in zoom-in duration-500" 
          onClick={e => e.stopPropagation()}
          style={{ width: `${width}px`, height: `${height + 80}px`, maxWidth: '95vw', maxHeight: '95vh' }}
        >
          {/* Header */}
          <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-neon rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">ANUNCIO EXCLUSIVO</span>
            </div>
            <button 
              onClick={onClosePopup}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <a
            href={sponsorship.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="flex-1 relative group overflow-hidden"
          >
            {sponsorship.imageUrl && (
              <img 
                src={sponsorship.imageUrl} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                alt={sponsorship.name}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
              <div className="bg-neon text-black px-6 py-3 rounded-xl font-black uppercase italic tracking-widest text-xs shadow-[0_10px_30px_rgba(0,255,157,0.3)]">
                VER MÁS DETALLES
              </div>
            </div>
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