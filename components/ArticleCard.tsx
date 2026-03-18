import React from 'react';
import { Article, User } from '../types';
import { OptimizedImage } from './OptimizedImage';

interface ArticleCardProps {
  article: Article;
  users: User[];
  onClick: (id: string) => void;
  featured?: boolean;
  priority?: boolean;
}

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, users, onClick, featured = false, priority = false }) => {
  const author = users.find(u => u.id === article.author);
  const authorName = author ? author.name : 'Redacción';
  const authorAvatar = author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName.replace(/\s+/g, '')}`;
  const cleanTitle = article.title.replace(/^["'“‘]+|["'”’]+$/g, '');

  return (
    <div 
      onClick={() => onClick(article.id)}
      className="group relative bg-[#111] rounded-2xl overflow-hidden border border-white/5 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-neon/30 hover:shadow-[0_10px_40px_rgba(0,255,157,0.1)] flex flex-col h-full"
    >
      {/* Media Header */}
      <div className="h-56 overflow-hidden relative">
        <OptimizedImage 
          src={article.imageUrl} 
          alt={article.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/20 to-transparent opacity-90"></div>
        
        {/* Badges on Image */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
            <span className="px-3 py-1 bg-neon text-black text-[10px] font-black rounded uppercase tracking-widest shadow-lg">
              {article.category}
            </span>
            {article.isPremium && (
                 <span className="px-3 py-1 bg-amber-400 text-black text-[10px] font-black rounded uppercase tracking-widest shadow-lg">
                    PREMIUM
                 </span>
            )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-6 flex flex-col flex-1 relative z-10 -mt-8 bg-gradient-to-b from-transparent to-[#111]">
        
        <h3 className="font-oswald text-2xl md:text-3xl font-bold text-white leading-[1.15] mb-3 uppercase italic group-hover:text-neon transition-colors drop-shadow-md">
          {cleanTitle}
        </h3>
        
        <p className="text-gray-300 text-sm font-medium line-clamp-3 md:line-clamp-4 opacity-80 group-hover:opacity-100 transition-opacity mb-6 leading-relaxed">
          {article.excerpt}
        </p>
        
        {/* Bottom spacer / interactive indicator */}
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <img src={authorAvatar} alt={authorName} className="w-8 h-8 rounded-full object-cover border border-white/20 bg-black" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        {authorName}
                    </span>
                    <span className="text-[9px] font-medium text-gray-500 uppercase tracking-widest">
                        {formatDate(article.date)}
                    </span>
                </div>
            </div>
            <span className="text-[10px] font-black text-neon uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 flex items-center gap-1">
                Leer <span className="text-lg leading-none">→</span>
            </span>
        </div>
      </div>
      
      {/* Barra de acento lateral */}
      <div className="absolute top-0 left-0 w-1 h-full bg-neon scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500 z-20"></div>
    </div>
  );
};