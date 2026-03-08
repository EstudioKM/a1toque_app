import React, { useState, useEffect } from 'react';
import { Article, Sponsorship, ContentBlock, User, AdSlotConfig } from '../types';
import { summarizeArticle } from '../services/geminiService';
import { SponsorshipBanner } from './SponsorshipBanner';
import { Share2, Twitter, Facebook, Link as LinkIcon, Globe, ExternalLink } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  sponsorships: Sponsorship[];
  adSlots: AdSlotConfig[];
  backLabel?: string;
  users: User[];
}

export const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack, sponsorships, adSlots, backLabel = 'feed', users }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const author = users.find(u => u.id === article.author);
  const authorName = author ? author.name : 'Redacción';

  const handleSummarize = async () => {
    setLoadingSummary(true);
    // FIX: Ensure content passed to summarize is a string.
    const contentString = typeof article.content === 'string'
      ? article.content
      : Array.isArray(article.content) ? article.content.map(b => b.content).join('\n') : '';
    const res = await summarizeArticle(contentString);
    setSummary(res);
    setLoadingSummary(false);
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const copyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar link", err);
    }
  };
  
  const getAdAndSlot = (position: string) => {
      const ad = sponsorships.find(s => s.position === position && s.active);
      const slot = adSlots.find(s => s.id === position);
      return { ad, slot };
  }

  const { ad: topAd, slot: topSlot } = getAdAndSlot('NEWS_TOP_LVL_1');
  const { ad: sideAd1, slot: sideSlot1 } = getAdAndSlot('NEWS_SIDE_LVL_1');
  const { ad: sideAd2, slot: sideSlot2 } = getAdAndSlot('NEWS_SIDE_LVL_2');


  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  
  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return <p key={block.id}>{block.content}</p>;
      case 'heading':
        return <h2 key={block.id} className="text-3xl font-oswald font-bold my-4 uppercase italic">{block.content}</h2>;
      case 'quote':
        return <blockquote key={block.id} className="border-l-4 border-neon pl-4 my-4 italic text-gray-400"><p>{block.content}</p>{block.caption && <cite>- {block.caption}</cite>}</blockquote>
      case 'image':
        return (
          <figure key={block.id} className="my-8">
            <OptimizedImage src={block.content} alt={block.caption || 'Imagen de la noticia'} className="w-full rounded-xl border border-white/10" />
            {block.caption && <figcaption className="text-center text-gray-500 text-xs mt-2 uppercase font-bold tracking-wide">{block.caption}</figcaption>}
          </figure>
        );
      default:
        return null;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SponsorshipBanner sponsorship={topAd} slotConfig={topSlot} />
      
      <button 
        onClick={onBack}
        className="mb-8 flex items-center text-neon font-black uppercase italic text-xs tracking-widest hover:translate-x-[-4px] transition-transform"
      >
        ← Volver a {backLabel}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <span className="px-4 py-1 bg-white text-black text-xs font-black rounded-sm uppercase italic tracking-wider">
                {article.category}
              </span>
              {article.isPublinota && (
                <span className="px-4 py-1 bg-neon/20 text-neon text-xs font-black rounded-sm border border-neon/30 uppercase italic">
                  Publinota Exclusiva
                </span>
              )}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-oswald font-black text-white mb-8 leading-none uppercase italic">
              {article.title}
            </h1>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 border-b border-white/10 pb-8 gap-6">
              <div className="flex items-center space-x-6 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                <span className="text-white">POR {authorName}</span>
                <span>•</span>
                <span>{article.date}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mr-2">Compartir:</span>
                <button 
                  onClick={shareOnTwitter}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-neon hover:border-neon transition-colors"
                  title="Compartir en Twitter"
                >
                  <Twitter size={14} />
                </button>
                <button 
                  onClick={shareOnFacebook}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-neon hover:border-neon transition-colors"
                  title="Compartir en Facebook"
                >
                  <Facebook size={14} />
                </button>
                <button 
                  onClick={copyLink}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${copied ? 'bg-neon border-neon text-black' : 'border-white/10 text-gray-400 hover:text-neon hover:border-neon'}`}
                  title="Copiar enlace"
                >
                  <LinkIcon size={14} />
                </button>
                {canNativeShare && (
                  <button 
                    onClick={() => navigator.share({ title: article.title, url: window.location.href })}
                    className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-neon hover:border-neon transition-colors"
                  >
                    <Share2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-12">
              {article.imageUrl && (
                <img src={article.imageUrl} alt={article.title} className="w-full h-auto" />
              )}
              {article.isPublinota && (
                <div className="absolute inset-0 border-8 border-neon/20 pointer-events-none"></div>
              )}
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="text-gray-300 text-lg leading-relaxed space-y-8 font-medium">
                {/* FIX: Handle both string and ContentBlock[] for article content */}
                {typeof article.content === 'string'
                  ? article.content.split('\n').map((para, i) => <p key={i}>{para}</p>)
                  : Array.isArray(article.content) ? article.content.map(renderBlock) : null}
              </div>

              {article.sources && article.sources.length > 0 && (
                  <div className="mt-16 border-t border-white/10 pt-8">
                    <h3 className="text-xl font-oswald font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-3">
                      <Globe size={18} className="text-neon" /> Fuentes Consultadas
                    </h3>
                    <ul className="space-y-3">
                      {article.sources.map((source, index) => (
                        <li key={index}>
                          <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-neon transition group p-2 rounded-lg hover:bg-white/5">
                            <ExternalLink size={16} className="flex-shrink-0 text-gray-600 group-hover:text-neon transition" />
                            <div className="min-w-0">
                                <p className="text-sm font-bold truncate group-hover:underline">{source.title}</p>
                                <p className="text-xs text-gray-600 truncate">{source.uri}</p>
                            </div>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
              )}

              <div className="bg-white/5 rounded-3xl p-8 border border-white/10 shadow-sm mt-16 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon/5 blur-3xl rounded-full"></div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="text-xl font-oswald font-black text-white italic uppercase tracking-tighter">
                    <span className="text-neon mr-2">/</span> IA Flash Report
                  </h3>
                  {!summary && !loadingSummary && (
                    <button 
                      onClick={handleSummarize}
                      className="bg-white text-black px-6 py-2 rounded-sm text-[10px] font-black uppercase italic hover:bg-neon transition-colors"
                    >
                      Resumir ahora
                    </button>
                  )}
                </div>

                {loadingSummary && (
                  <div className="animate-pulse space-y-4">
                    <div className="h-2 bg-white/10 rounded w-3/4"></div>
                    <div className="h-2 bg-white/10 rounded"></div>
                    <div className="h-2 bg-white/10 rounded w-5/6"></div>
                  </div>
                )}

                {summary && (
                  <div className="text-gray-400 text-sm font-bold uppercase tracking-wide leading-relaxed relative z-10">
                    {summary}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 mb-6">Partners</h3>
          <SponsorshipBanner sponsorship={sideAd1} slotConfig={sideSlot1} />
          <SponsorshipBanner sponsorship={sideAd2} slotConfig={sideSlot2} />
          
          <div className="mt-12 sticky top-28">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-neon mb-6">Recomendado</h4>
            <div className="space-y-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-neon transition cursor-pointer group">
                <div className="text-[9px] font-black text-gray-500 uppercase mb-2">Publinota</div>
                <div className="font-oswald font-bold text-white uppercase italic group-hover:text-neon">Cómo optimizar tu hidratación según la IA</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};