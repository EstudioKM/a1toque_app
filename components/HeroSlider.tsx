import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { OptimizedImage } from './OptimizedImage';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSliderProps {
  articles: Article[];
  onArticleClick: (id: string) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ articles, onArticleClick }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (articles.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % articles.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [articles.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((prev) => (prev - 1 + articles.length) % articles.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((prev) => (prev + 1) % articles.length);
  };

  if (articles.length === 0) return null;

  return (
    <div className="relative w-full h-[600px] md:h-[650px] overflow-hidden rounded-[30px] md:rounded-[40px] group shadow-[0_40px_100px_rgba(0,0,0,0.5)] bg-white/5 border border-white/10">
      {articles.map((art, idx) => (
        <div
          key={art.id}
          onClick={() => onArticleClick(art.id)}
          className={`absolute inset-0 transition-all duration-1000 cursor-pointer ${idx === current ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0'}`}
        >
          <OptimizedImage 
            src={art.imageUrl} 
            alt={art.title} 
            className="w-full h-full object-cover transform transition-transform duration-[15s] ease-out group-hover:scale-105"
            priority={idx === 0}
          />
          
          {/* Overlay gradiente optimizado: Suavizado para dejar ver más imagen */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-700"></div>
          
          <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full max-w-5xl">
            <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-6">
              <span className="px-3 py-1 bg-neon text-black font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] rounded-sm">
                {art.category}
              </span>
              <span className="w-8 md:w-12 h-px bg-white/20"></span>
              <span className="text-white/60 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Destacada A1TOQUE</span>
            </div>
            
            <h2 
              className="text-3xl md:text-6xl font-oswald font-black text-white leading-tight mb-3 md:mb-6 uppercase italic tracking-tighter drop-shadow-2xl"
            >
              {art.title}
            </h2>
            
            <p className="text-[13px] md:text-xl text-gray-300 font-medium max-w-3xl border-l-2 md:border-l-4 border-neon pl-4 md:pl-6 py-1 md:py-2 italic mb-6 md:mb-8 opacity-90 group-hover:opacity-100 transition-opacity line-clamp-5 md:line-clamp-none">
              {art.excerpt}
            </p>

            <button className="flex items-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black uppercase italic text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] rounded-xl hover:bg-neon hover:text-black hover:border-neon transition-all group/btn shadow-xl">
               Leer Noticia <span className="hidden sm:inline">Completa</span> <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      ))}

      {/* Navegación por Flechas */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-2 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-neon hover:text-black transition-all opacity-0 group-hover:opacity-100 shadow-2xl"
      >
        <ChevronLeft size={20} strokeWidth={3} />
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-2 md:p-4 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-neon hover:text-black transition-all opacity-0 group-hover:opacity-100 shadow-2xl"
      >
        <ChevronRight size={20} strokeWidth={3} />
      </button>

      {/* Indicadores Verticales */}
      <div className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-4 md:space-y-6">
        {articles.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
            className={`w-1 transition-all duration-500 rounded-full ${idx === current ? 'h-10 md:h-16 bg-neon shadow-[0_0_15px_rgba(0,255,157,0.8)]' : 'h-4 md:h-6 bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
};