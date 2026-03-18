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
    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden rounded-2xl md:rounded-[32px] group bg-black">
      {articles.map((art, idx) => {
        const cleanTitle = art.title.replace(/^["'“‘]+|["'”’]+$/g, '');
        return (
        <div
          key={art.id}
          onClick={() => onArticleClick(art.id)}
          className={`absolute inset-0 transition-opacity duration-1000 cursor-pointer ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <OptimizedImage 
            src={art.imageUrl} 
            alt={cleanTitle} 
            className={`w-full h-full object-cover transform transition-transform duration-[20s] ease-out ${idx === current ? 'scale-105' : 'scale-100'}`}
            priority={idx === 0}
          />
          
          {/* Gradient Overlay: Darker on the left/bottom for text readability, transparent elsewhere */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent md:bg-gradient-to-r md:from-black/90 md:via-black/40 md:to-transparent"></div>
          
          {/* Content Container */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16">
            <div className="w-full md:w-3/4 lg:w-1/2 max-w-3xl transform transition-all duration-700 translate-y-0 opacity-100">
              
              {/* Meta Info */}
              <div className="flex items-center space-x-4 mb-4 md:mb-6">
                <span className="px-3 py-1 bg-neon text-black font-black text-[10px] md:text-xs uppercase tracking-[0.2em] rounded-sm">
                  {art.category}
                </span>
                <span className="w-8 md:w-12 h-px bg-neon/50"></span>
                <span className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Destacada</span>
              </div>
              
              {/* Title (No line clamp, relies on optimal character count) */}
              <h2 
                className="text-3xl md:text-5xl lg:text-6xl font-oswald font-black text-white leading-[1.1] mb-4 md:mb-6 uppercase italic tracking-tighter drop-shadow-lg"
              >
                {cleanTitle}
              </h2>
              
              {/* Excerpt with line clamp */}
              <p className="text-sm md:text-lg text-gray-300 font-medium border-l-2 border-neon pl-4 py-1 italic mb-6 md:mb-8 opacity-90 line-clamp-2 md:line-clamp-3">
                {art.excerpt}
              </p>

              {/* Action Button */}
              <div>
                <button className="flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black uppercase italic text-[10px] md:text-xs tracking-[0.2em] rounded-xl hover:bg-neon hover:text-black hover:border-neon transition-all group/btn shadow-xl">
                   Leer Noticia <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )})}

      {/* Navigation Controls */}
      <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 z-30 flex items-center gap-4">
        <div className="flex gap-2 mr-4 hidden md:flex">
          {articles.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
              className={`h-1.5 transition-all duration-500 rounded-full ${idx === current ? 'w-8 bg-neon shadow-[0_0_10px_rgba(0,255,157,0.5)]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
        <button 
          onClick={handlePrev}
          className="p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-neon hover:text-black transition-all shadow-xl"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <button 
          onClick={handleNext}
          className="p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-neon hover:text-black transition-all shadow-xl"
          aria-label="Next slide"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};