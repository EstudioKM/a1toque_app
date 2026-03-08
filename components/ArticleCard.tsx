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

  return (
    <div 
      onClick={() => onClick(article.id)}
      className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/10 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-neon/50 hover:shadow-[0_20px_50px_rgba(0,255,157,0.1)] flex flex-col"
    >
      {/* Media Header */}
      <div className="h-64 overflow-hidden relative">
        <OptimizedImage 
          src={article.imageUrl} 
          alt={article.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
        
        {/* Badges on Image */}
        <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="px-2 py-0.5 bg-neon text-black text-[9px] font-black rounded-sm uppercase italic tracking-tighter">
              {article.category}
            </span>
            {article.isPremium && (
                 <span className="px-2 py-0.5 bg-amber-400 text-black text-[9px] font-black rounded-sm uppercase italic tracking-tighter">
                    PREMIUM
                 </span>
            )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-6 flex flex-col flex-1">
        {/* Meta Metadata Row (Reubicado arriba) */}
        <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-neon rounded-full"></span>
                POR {authorName}
            </span>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                {formatDate(article.date)}
            </span>
        </div>

        <h3 className="font-oswald text-2xl font-bold text-white leading-[1.1] mb-4 uppercase italic group-hover:text-neon transition-colors">
          <span className="text-neon/50 mr-1">“</span>
          {article.title}
          <span className="text-neon/50 ml-1">”</span>
        </h3>
        
        <p className="text-gray-400 text-xs font-medium line-clamp-2 uppercase tracking-wide opacity-70 group-hover:opacity-100 transition-opacity mb-4">
          {article.excerpt}
        </p>
        
        {/* Bottom spacer / interactive indicator */}
        <div className="mt-auto pt-4 flex justify-end">
            <span className="text-[8px] font-black text-neon uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
                Leer Nota →
            </span>
        </div>
      </div>
      
      {/* Barra de acento lateral */}
      <div className="absolute top-0 left-0 w-1 h-full bg-neon scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500"></div>
    </div>
  );
};