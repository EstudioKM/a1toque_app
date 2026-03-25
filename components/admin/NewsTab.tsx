import React, { useState, useMemo } from 'react';
import { Article, Category, User, CategoryConfig, SocialAccount } from '../../types';
import { Plus, Search, Send, Edit3, Trash2, Clock, CheckCircle, Upload, EyeOff, FilterX, AlertTriangle, X, Sparkles, Filter } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';

interface NewsTabProps {
  articles: Article[];
  users: User[];
  categories: CategoryConfig[];
  socialAccounts: SocialAccount[];
  onOpenEditor: (article?: Article) => void;
  onOpenSocialCreator: (article: Article, accountId: string) => void;
  onDeleteArticle: (id: string) => void;
  onToggleArticleStatus: (id: string) => void;
  onViewArticle: (id: string) => void;
  forcedFilterStatus?: 'Published' | 'Draft' | 'All';
  hideHeader?: boolean;
}

export const NewsTab: React.FC<NewsTabProps> = ({
  articles,
  users,
  categories,
  socialAccounts,
  onOpenEditor,
  onOpenSocialCreator,
  onDeleteArticle,
  onToggleArticleStatus,
  onViewArticle,
  forcedFilterStatus,
  hideHeader = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Published' | 'Draft'>(forcedFilterStatus || 'Published'); // Por defecto publicadas
  
  // Estados para modales de confirmación
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [articleForSocialConfirm, setArticleForSocialConfirm] = useState<Article | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const filteredArticles = useMemo(() => {
    const currentStatusFilter = forcedFilterStatus || filterStatus;
    return articles
      .filter(art => {
        const term = searchTerm.toLowerCase();
        return (art.title || '').toLowerCase().includes(term) || (art.excerpt || '').toLowerCase().includes(term);
      })
      .filter(art => filterCategory === 'All' || art.category === filterCategory)
      .filter(art => {
        if (currentStatusFilter === 'All') return true;
        return currentStatusFilter === 'Published' ? art.isPublished : !art.isPublished;
      });
  }, [articles, searchTerm, filterCategory, filterStatus, forcedFilterStatus]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCategory('All');
    if (!forcedFilterStatus) {
      setFilterStatus('Published');
    }
  };

  const confirmDelete = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    setArticleToDelete(article);
  };

  const executeDelete = () => {
    if (articleToDelete) {
      onDeleteArticle(articleToDelete.id);
      setArticleToDelete(null);
    }
  };

  const handleConfirmSocial = () => {
    if (articleForSocialConfirm && selectedAccountId) {
      onOpenSocialCreator(articleForSocialConfirm, selectedAccountId);
      setArticleForSocialConfirm(null);
      setSelectedAccountId('');
    }
  };

  const formatDateWithHierarchy = (dateString: string) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return (
          <span className="flex items-center gap-1.5">
            <span className="text-white font-bold">{day}-{month}-{year}</span>
            <span className="text-gray-600">{hours}:{minutes}</span>
          </span>
        );
    } catch (e) {
        return dateString;
    }
  };

  return (
    <div>
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-oswald font-black italic uppercase text-white tracking-tighter">GESTOR DE NOTICIAS</h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Control editorial y distribución A1TOQUE</p>
          </div>
          <button 
            onClick={() => onOpenEditor()} 
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-neon text-black text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(0,255,157,0.2)] active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> NUEVA NOTICIA
          </button>
        </div>
      )}

      {/* Buscador y Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-8 p-3 bg-white/5 rounded-2xl border border-white/10">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar por título o bajada..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full bg-black/50 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-neon/50 outline-none transition-all placeholder:text-gray-600" 
          />
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {/* Filtro de Estado */}
            {!forcedFilterStatus && (
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value as any)} 
                className="flex-1 md:flex-none bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-neon focus:border-neon/50 outline-none cursor-pointer"
              >
                <option value="Published">Publicadas</option>
                <option value="Draft">Borradores</option>
                <option value="All">Todos</option>
              </select>
            )}
            
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value as Category | 'All')} 
              className="flex-1 md:flex-none bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-gray-400 focus:border-neon/50 outline-none cursor-pointer"
            >
              <option value="All">Categoría</option>
              {categories.filter(c => c.visible).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {(searchTerm || filterCategory !== 'All' || (!forcedFilterStatus && filterStatus !== 'Published')) && (
              <button onClick={handleResetFilters} className="p-3 bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors">
                <FilterX size={18} />
              </button>
            )}
        </div>
      </div>

      {/* Lista de Noticias */}
      <div className="space-y-4">
        {filteredArticles.length > 0 ? (
          filteredArticles.map(article => {
            const author = users.find(u => u.id === article.author);
            const isPublished = article.isPublished;
            
            return (
              <div 
                key={article.id} 
                onClick={() => onOpenEditor(article)} // ACCIÓN POR CLIC EN LA FILA
                className={`group rounded-2xl flex flex-col md:flex-row overflow-hidden border transition-all duration-300 cursor-pointer ${isPublished ? 'bg-neon/[0.03] border-neon/20 shadow-[0_0_20px_rgba(0,255,157,0.05)]' : 'bg-[#0d0d0d] border-white/5 opacity-80 hover:opacity-100 hover:border-white/20'}`}
              >
                {/* Contenido Principal */}
                <div className="flex-1 flex flex-row items-center p-3 md:p-4 gap-4">
                    {/* Thumbnail Compacto */}
                    <div className="w-20 h-20 md:w-32 md:h-24 flex-shrink-0 relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900 shadow-lg">
                      <OptimizedImage 
                          src={article.imageUrl} 
                          alt={article.title} 
                          className="w-full h-full group-hover:scale-110 transition-transform duration-700"
                      />
                      {!isPublished && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-[8px] font-black text-white/50 uppercase tracking-widest bg-black/40 px-2 py-1 rounded">HIDDEN</span>
                        </div>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-[8px] font-black rounded-sm uppercase tracking-tighter ${isPublished ? 'bg-neon text-black' : 'bg-gray-800 text-gray-400'}`}>
                              {article.category}
                            </span>
                            <span className="text-gray-700 text-[10px] hidden sm:inline">•</span>
                            <span className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                <Clock size={12} className="text-gray-600" /> {formatDateWithHierarchy(article.date)}
                            </span>
                        </div>
                        
                        <h3 className={`font-oswald font-bold text-base md:text-xl leading-tight mb-2 line-clamp-2 transition-colors ${isPublished ? 'text-white group-hover:text-neon' : 'text-gray-400 group-hover:text-white'}`}>
                            {article.title}
                        </h3>

                        <div className="flex items-center gap-2">
                             <div className="w-5 h-5 rounded-full border border-white/10 overflow-hidden bg-neutral-800">
                                {author?.avatar && <img src={author.avatar} className="w-full h-full object-cover" alt="" />}
                            </div>
                            <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest truncate">{author?.name || 'Redacción'}</span>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between md:justify-end px-4 py-3 md:px-6 bg-white/[0.02] md:bg-transparent border-t md:border-t-0 md:border-l border-white/5 gap-4" onClick={e => e.stopPropagation()}>
                  
                  {/* Estado Visual */}
                  <div className="flex items-center gap-4">
                    {isPublished ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 text-neon text-[9px] font-black uppercase tracking-widest bg-neon/10 rounded-full border border-neon/20">
                        <CheckCircle size={14} strokeWidth={2.5} /> PUBLICADO
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 text-gray-500 text-[9px] font-black uppercase tracking-widest bg-white/5 rounded-full">
                        <Clock size={14} /> BORRADOR
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botón PUBLICAR / OCULTAR */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleArticleStatus(article.id); }} 
                      className={`px-4 py-2 text-[9px] font-black uppercase italic rounded-lg transition-all flex items-center gap-2 active:scale-95 shadow-lg ${isPublished ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-neon text-black hover:scale-105'}`}
                    >
                      {isPublished ? <><EyeOff size={14} /> OCULTAR</> : <><Upload size={14} strokeWidth={3} /> PUBLICAR</>}
                    </button>

                    {/* Botón GENERAR POSTEO */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setArticleForSocialConfirm(article); }} 
                      className="px-4 py-2 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 group/post"
                    >
                      <Send size={14} className="group-hover/post:translate-x-0.5 group-hover/post:-translate-y-0.5 transition-transform" /> 
                      <span className="hidden lg:inline">GENERAR POSTEO</span>
                    </button>
                  </div>

                  {/* CRUD sutil */}
                  <div className="flex gap-1 border-l border-white/10 pl-4">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onOpenEditor(article); }} 
                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 rounded-xl text-gray-500 transition-all"
                        title="Editar"
                    >
                        <Edit3 size={16} />
                    </button>
                    <button 
                        onClick={(e) => confirmDelete(e, article)} 
                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-gray-500 transition-all"
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-gray-700" />
            </div>
            <h3 className="text-lg font-oswald font-bold text-gray-500 uppercase tracking-widest">Sin resultados encontrados</h3>
            <p className="text-gray-600 text-xs mt-2 max-w-xs mx-auto uppercase font-bold tracking-wider">Intenta ajustar los filtros de búsqueda para encontrar lo que necesitas.</p>
            <button onClick={handleResetFilters} className="mt-8 px-6 py-3 bg-white/5 text-neon text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-neon/10 transition-all">Limpiar Todos los Filtros</button>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {articleToDelete && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="max-w-md w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
              
              <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/20 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <AlertTriangle size={40} strokeWidth={1.5} />
              </div>

              <h3 className="text-2xl font-oswald font-black text-white uppercase italic mb-4 tracking-tighter">¿ELIMINAR NOTICIA?</h3>
              
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2 leading-relaxed">
                Estás a punto de borrar:
              </p>
              <p className="text-white text-lg font-oswald font-bold italic mb-8 line-clamp-2 px-4">
                "{articleToDelete.title}"
              </p>

              <p className="bg-red-500/5 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] py-3 rounded-xl border border-red-500/10 mb-8">
                ESTA ACCIÓN NO SE PUEDE DESHACER
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={executeDelete} 
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase italic text-xs tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                >
                  SÍ, ELIMINAR PERMANENTEMENTE
                </button>
                <button 
                  onClick={() => setArticleToDelete(null)} 
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black uppercase italic text-xs tracking-widest rounded-xl transition-all"
                >
                  CANCELAR Y VOLVER
                </button>
              </div>

              <button 
                onClick={() => setArticleToDelete(null)}
                className="absolute top-4 right-4 p-2 text-gray-600 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
           </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE GENERACIÓN SOCIAL */}
      {articleForSocialConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="max-w-md w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,255,157,0.2)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon to-transparent"></div>
              
              <div className="w-20 h-20 bg-neon/10 border-2 border-neon/20 rounded-full flex items-center justify-center text-neon mx-auto mb-6">
                <Sparkles size={40} strokeWidth={1.5} className="animate-pulse" />
              </div>

              <h3 className="text-2xl font-oswald font-black text-white uppercase italic mb-4 tracking-tighter">¿GENERAR POSTEO SOCIAL?</h3>
              
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-6 leading-relaxed">
                La IA analizará esta noticia para crear un titular de impacto y un copy optimizado para tus redes sociales.
              </p>

              <div className="bg-white/5 p-4 rounded-2xl mb-4 border border-white/5">
                <p className="text-white text-base font-oswald font-bold italic line-clamp-2">
                  "{articleForSocialConfirm.title}"
                </p>
              </div>
              
              <div className="mb-8">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block text-left">Selecciona la cuenta</label>
                <select 
                  value={selectedAccountId} 
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-neon outline-none"
                >
                  <option value="">Selecciona una cuenta...</option>
                  {socialAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.platform})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleConfirmSocial} 
                  className="w-full py-4 bg-neon hover:scale-105 text-black font-black uppercase italic text-xs tracking-widest rounded-xl transition-all shadow-[0_10px_30px_rgba(0,255,157,0.3)] active:scale-95 flex items-center justify-center gap-3"
                >
                  <Send size={16} strokeWidth={3} /> SÍ, GENERAR POSTEO AHORA
                </button>
                <button 
                  onClick={() => setArticleForSocialConfirm(null)} 
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black uppercase italic text-xs tracking-widest rounded-xl transition-all"
                >
                  VOLVER AL GESTOR
                </button>
              </div>

              <button 
                onClick={() => setArticleForSocialConfirm(null)}
                className="absolute top-4 right-4 p-2 text-gray-600 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
