import React, { useEffect, useRef, useState } from 'react';
import { Article, Sponsorship, ContentBlock, User, AdSlotConfig } from '../types';
import { X, Clock, Twitter, Facebook, ExternalLink, Lock, Share2 } from 'lucide-react';
import { SponsorshipBanner } from './SponsorshipBanner';
import { OptimizedImage } from './OptimizedImage';

// Componente dedicado para el Embed de Instagram
const InstagramEmbed: React.FC<{ url: string }> = ({ url }) => {
  const [isProcessed, setIsProcessed] = useState(false);
  
  useEffect(() => {
    const scriptSrc = "https://www.instagram.com/embed.js";
    
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = scriptSrc;
      document.body.appendChild(script);
    }

    const processEmbeds = () => {
        // @ts-ignore
        if (window.instgrm) {
            // @ts-ignore
            window.instgrm.Embeds.process();
            setIsProcessed(true);
        }
    };

    processEmbeds();
    const interval = setInterval(processEmbeds, 1000);
    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
  }, [url]);

  const cleanUrl = url.split('?')[0].replace(/\/$/, '');
  const embedUrl = `${cleanUrl}/?utm_source=ig_embed&utm_campaign=loading`;

  return (
    <div className="my-12 flex flex-col items-center w-full relative min-h-[400px]">
         {!isProcessed && (
           <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs font-black uppercase tracking-widest animate-pulse z-0">
             Cargando Instagram...
           </div>
         )}
         <div className="relative z-10 w-full flex justify-center">
            <blockquote 
                className="instagram-media" 
                data-instgrm-permalink={embedUrl}
                data-instgrm-version="14" 
                data-instgrm-captioned
                style={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', margin: '1px', maxWidth: '540px', minWidth: '326px', padding: 0, width: '99.375%', }}>
            </blockquote>
         </div>
    </div>
  );
};

interface ArticleModalProps {
  article: Article;
  articles: Article[];
  users: User[];
  currentUser: User | null;
  onClose: () => void;
  onArticleClick: (id: string) => void;
  sponsorships: Sponsorship[];
  adSlots: AdSlotConfig[];
  onLoginClick: () => void;
  onSponsorshipImpression: (id: string) => void;
  onSponsorshipClick: (id: string) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, articles, users, currentUser, onClose, onArticleClick, sponsorships, adSlots, onLoginClick, onSponsorshipImpression, onSponsorshipClick }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showAuthorBio, setShowAuthorBio] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const author = users.find(u => u.id === article.author) || {
      id: 'unknown',
      name: 'Redacción',
      publicRole: 'Staff',
      avatar: 'https://placehold.co/100',
      bio: 'Equipo editorial.'
  } as User;
  
  const isLocked = article.isPremium && !currentUser;
  const cleanTitle = article.title.replace(/^["'“‘]+|["'”’]+$/g, '');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    setScrollProgress(progress);
  };

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    setShowAuthorBio(false);
    setScrollProgress(0);
  }, [article.id]);

  const getContentText = () => {
    if (typeof article.content === 'string') return article.content;
    return article.content.filter(b => b.type === 'text' || b.type === 'quote').map(b => b.content).join(' ');
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(cleanTitle)}`;
    window.open(url, '_blank');
  };
  
  const getAdAndSlot = (position: string) => {
      const ad = sponsorships.find(s => s.position === position && s.active);
      const slot = adSlots.find(s => s.id === position);
      return { ad, slot };
  }

  const { ad: topAd, slot: topSlot } = getAdAndSlot('NEWS_TOP_LVL_1');
  const { ad: sideAd1, slot: sideSlot1 } = getAdAndSlot('NEWS_SIDE_LVL_1');
  const { ad: sideAd2, slot: sideSlot2 } = getAdAndSlot('NEWS_SIDE_LVL_2');
  const readTime = Math.ceil(getContentText().split(' ').length / 200);

  const relatedArticles = articles.filter(a => a.category === article.category && a.id !== article.id).slice(0, 3);

  const renderYoutube = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    const videoId = match ? match[1] : null;
    if (!videoId) return null;
    return (
      <div className="my-8 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black relative z-10 aspect-video">
        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}?rel=0`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="w-full h-full"></iframe>
      </div>
    );
  };

  const renderBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
      case 'text':
        return <p key={block.id} className="text-gray-300 font-light leading-relaxed mb-6 text-base tracking-tight">{block.content}</p>;
      case 'heading':
        return <h2 key={block.id} className="font-oswald font-black text-white uppercase italic text-2xl md:text-3xl my-8 !leading-tight tracking-tighter">{block.content}</h2>;
      case 'quote':
        return (
          <blockquote key={block.id} className="my-10 border-l-4 border-neon pl-6 py-2 bg-white/5 rounded-r-xl relative">
             <span className="absolute -top-4 left-3 text-5xl text-neon opacity-20 font-serif">“</span>
             <p className="font-oswald text-xl md:text-2xl text-white italic font-bold leading-tight mb-4"> {block.content} </p>
             {block.caption && <cite className="block text-neon text-[10px] font-black uppercase tracking-[0.2em] not-italic">// {block.caption}</cite>}
          </blockquote>
        );
      case 'image':
        return (
          <figure key={block.id} className="my-8">
            <OptimizedImage src={block.content} alt={block.caption || 'Imagen de la noticia'} className="w-full rounded-xl border border-white/10 shadow-lg" />
            {block.caption && <figcaption className="text-center text-gray-500 text-[9px] mt-3 uppercase font-black tracking-[0.1em]">{block.caption}</figcaption>}
          </figure>
        );
      case 'youtube':
        return <div key={block.id}>{renderYoutube(block.content)}</div>;
      case 'instagram':
        return <InstagramEmbed key={block.id} url={block.content} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl transition-opacity" onClick={onClose}></div>
      <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col animate-in fade-in duration-500">
        
        {/* Barra de progreso de lectura */}
        <div className="absolute top-0 left-0 h-1 bg-neon/20 w-full z-[60]">
            <div className="h-full bg-neon transition-all duration-200" style={{ width: `${scrollProgress}%` }}></div>
        </div>

        {showAuthorBio && (
            <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-300" onClick={() => setShowAuthorBio(false)}>
                <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-[40px] p-10 relative shadow-[0_0_80px_rgba(0,255,157,0.15)]" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowAuthorBio(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-32 h-32 rounded-full p-1.5 bg-gradient-to-tr from-neon to-blue-500 mb-8 shadow-xl">
                            <OptimizedImage src={author.avatar!} alt={author.name} className="w-full h-full rounded-full object-cover border-4 border-[#111]" />
                        </div>
                        <h3 className="font-oswald font-black italic text-4xl text-white uppercase mb-2 tracking-tighter">{author.name}</h3>
                        <span className="text-neon text-[10px] font-black uppercase tracking-[0.4em] mb-8">{author.publicRole}</span>
                        <p className="text-gray-400 leading-relaxed text-base mb-10">{author.bio}</p>
                        <div className="flex gap-4">
                            {author.twitter && <a href={`https://twitter.com/${author.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white/5 rounded-full hover:bg-[#1DA1F2] hover:text-white text-gray-400 transition flex items-center gap-2 text-xs font-black uppercase tracking-widest"><Twitter size={14} /> Twitter</a>}
                            {author.email && <button onClick={() => window.location.href = `mailto:${author.email}`} className="px-6 py-3 bg-white/5 rounded-full hover:bg-neon hover:text-black text-gray-400 transition flex items-center gap-2 text-xs font-black uppercase tracking-widest">Contacto</button>}
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-start p-8 pointer-events-none">
          <div className="flex gap-3 pointer-events-auto">
              <span className="px-4 py-1.5 bg-neon text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-sm shadow-xl">{article.category}</span>
              {article.isPremium && <span className="px-4 py-1.5 bg-amber-400 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-sm shadow-xl">A1TOQUE Premium</span>}
          </div>
          <button onClick={onClose} className="pointer-events-auto w-12 h-12 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center text-white hover:bg-neon hover:text-black transition-all border border-white/10 group shadow-2xl">
            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div ref={contentRef} onScroll={handleScroll} className="overflow-y-auto h-full custom-scrollbar scroll-smooth relative">
          
          {/* Header con imagen sin cortes (Contain + Blur Background) */}
          <div className="relative w-full bg-black flex items-center justify-center overflow-hidden min-h-[250px] max-h-[60vh]">
            <div 
              className="absolute inset-0 scale-110 blur-3xl opacity-20 grayscale"
              style={{ backgroundImage: `url(${article.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            <div className="absolute inset-0 bg-black/40"></div>
            {article.imageUrl && (
              <img 
                src={article.imageUrl} 
                alt={cleanTitle} 
                className="relative z-10 w-full h-auto max-h-[60vh] object-contain"
              />
            )}
            {/* Gradiente refinado para fundir con el fondo del contenido */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 via-30% to-transparent z-20"></div>
          </div>

          <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 relative z-30">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="col-span-1 lg:col-span-8">
                <header className="mb-10 -mt-20 relative z-40">
                    <div className="flex items-center gap-4 text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4 drop-shadow-md">
                        <button onClick={() => setShowAuthorBio(true)} className="hover:text-neon transition-colors flex items-center gap-2 group">
                            <OptimizedImage src={author.avatar!} className="w-6 h-6 rounded-full border border-white/20 group-hover:border-neon transition-colors" alt={author.name} />
                            Por {author.name}
                        </button>
                        <span>•</span>
                        <span className="flex items-center gap-2"><Clock size={12} /> {readTime} min lectura</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-oswald font-black text-white uppercase italic leading-[0.95] mb-6 tracking-tighter text-balance">{cleanTitle}</h1>
                    <p className="text-base md:text-lg text-gray-400 font-medium leading-relaxed font-oswald border-l-4 border-neon pl-5 py-0.5 italic">{article.excerpt}</p>
                </header>

                <SponsorshipBanner 
                  sponsorship={topAd} 
                  slotConfig={topSlot}
                  onImpression={onSponsorshipImpression} 
                  onClickEvent={onSponsorshipClick}
                />

                <div className="prose prose-invert prose-lg max-w-none relative">
                    {isLocked && (
                    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center text-center p-8 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-[#0a0a0a]/80 backdrop-blur-xl rounded-2xl border border-white/10 mt-8">
                        <div className="w-20 h-20 bg-amber-400/10 border-2 border-amber-400/30 rounded-full flex items-center justify-center text-amber-400 mx-auto mb-6 animate-pulse">
                            <Lock size={30} />
                        </div>
                        <h3 className="text-3xl font-oswald font-black text-white uppercase italic mb-3 tracking-tighter">Contenido Exclusivo A1TOQUE</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8 font-bold text-xs uppercase tracking-[0.1em] leading-loose">
                            Esta investigación es exclusiva para miembros de la comunidad A1TOQUE. Únete para acceder a la información sin límites.
                        </p>
                        <button onClick={onLoginClick} className="px-8 py-3 bg-neon text-black font-black uppercase italic text-xs tracking-[0.2em] rounded-lg hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,255,157,0.2)]">
                            Iniciar Sesión / Suscribirse
                        </button>
                    </div>
                    )}
                    <div className={`${isLocked ? 'blur-xl select-none pointer-events-none opacity-40 h-[300px] overflow-hidden' : ''} article-body`}>
                        {typeof article.content === 'string' 
                        ? article.content.split('\n').map((paragraph, idx) => <p key={idx} className="text-gray-300 font-light leading-relaxed mb-6 text-base tracking-tight">{paragraph}</p>)
                        : article.content.map((block, idx) => renderBlock(block, idx))
                        }
                    </div>
                </div>

                {!isLocked && (
                    <div className="mt-16 border-t border-white/10 pt-8 flex items-center gap-6 cursor-pointer group p-6 bg-white/5 rounded-2xl hover:bg-white/[0.08] transition-all" onClick={() => setShowAuthorBio(true)}>
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-neon transition-all shadow-lg">
                            <OptimizedImage src={author.avatar!} alt={author.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="text-[9px] text-neon font-black uppercase tracking-[0.3em] mb-1">Redactado por</div>
                            <h4 className="font-oswald font-black text-white text-2xl uppercase italic group-hover:text-neon transition-colors tracking-tighter">{author.name}</h4>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{author.publicRole}</p>
                        </div>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                            <span className="text-[9px] bg-neon text-black px-3 py-1.5 rounded font-black uppercase italic tracking-widest">Ver Perfil</span>
                        </div>
                    </div>
                )}

                {/* Sección de Noticias Relacionadas debajo del contenido */}
                {!isLocked && relatedArticles.length > 0 && (
                  <div className="mt-20 border-t border-white/10 pt-12">
                    <h3 className="font-oswald font-black text-white uppercase italic text-3xl mb-8 tracking-tighter">Noticias Relacionadas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {relatedArticles.map(a => (
                        <div 
                          key={a.id} 
                          onClick={() => onArticleClick(a.id)}
                          className="group cursor-pointer"
                        >
                          <div className="aspect-video rounded-xl overflow-hidden mb-4 border border-white/10 group-hover:border-neon/50 transition-all shadow-lg">
                            <OptimizedImage src={a.imageUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="text-[8px] text-neon font-black uppercase tracking-[0.2em] mb-2">{a.category}</div>
                          <h4 className="font-oswald font-bold text-white uppercase italic group-hover:text-neon transition-colors leading-tight text-lg line-clamp-2 tracking-tight">{a.title}</h4>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className="col-span-1 lg:col-span-4 space-y-8">
                <div className="sticky top-8">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mb-4 px-2">Partners A1TOQUE</h4>
                    <SponsorshipBanner sponsorship={sideAd1} slotConfig={sideSlot1} onImpression={onSponsorshipImpression} onClickEvent={onSponsorshipClick} />
                    <SponsorshipBanner sponsorship={sideAd2} slotConfig={sideSlot2} onImpression={onSponsorshipImpression} onClickEvent={onSponsorshipClick} />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .article-body p {
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #0a0a0a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #222;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #00ff9d;
        }
      `}</style>
    </div>
  );
};