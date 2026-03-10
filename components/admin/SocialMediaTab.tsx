import React, { useMemo, useState } from 'react';
import { SocialPost, User, SocialAccount, SocialGenerationTask, SiteConfig } from '../../types';
import { formatArgentinaTimestamp } from '../../services/dateUtils';
import { 
  Plus, Edit3, Trash2, ExternalLink, Send, CheckCircle2, 
  Clock, Sparkles, Zap, ArrowRight, Loader2, AlertTriangle,
  LayoutGrid, History, Settings2, AtSign, AlertCircle, ChevronDown
} from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';
import { DEFAULT_SOCIAL_COPY_PROMPT } from '../../constants';

interface SocialMediaTabProps {
  socialPosts: SocialPost[];
  users: User[];
  currentUser: User;
  socialAccountMap: Map<string, SocialAccount>;
  socialAccounts: SocialAccount[];
  aiSystemPrompt: string;
  siteConfig: SiteConfig;
  socialGenerationQueue: SocialGenerationTask[];
  onOpenCreator: () => void;
  onOpenDetail: (post: SocialPost) => void;
  onOpenEditor: (post: SocialPost) => void;
  onDeletePost: (id: string) => void;
  onGenerateSocialFromTopic: (topic: string, systemPrompt: string, copyPrompt: string) => void;
  onLoadSocialDraft: (task: SocialGenerationTask) => void;
  onRemoveSocialTask: (id: string) => void;
}

export const SocialMediaTab: React.FC<SocialMediaTabProps> = ({ 
  socialPosts, 
  users,
  currentUser,
  socialAccountMap, 
  socialAccounts,
  aiSystemPrompt,
  siteConfig,
  socialGenerationQueue,
  onOpenCreator, 
  onOpenDetail,
  onOpenEditor,
  onDeletePost,
  onGenerateSocialFromTopic,
  onLoadSocialDraft,
  onRemoveSocialTask
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'posteos' | 'history'>('posteos');
  const [postToDelete, setPostToDelete] = useState<SocialPost | null>(null);
  const [generationQuery, setGenerationQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('global');
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);

  const availableSocialAccounts = useMemo(() => {
    if (currentUser.roleId === 'admin') {
      return socialAccounts;
    }
    const managedIds = currentUser.managedSocialAccountIds || [];
    return socialAccounts.filter(acc => managedIds.includes(acc.id));
  }, [socialAccounts, currentUser]);

  const selectedAccount = useMemo(() => 
    availableSocialAccounts.find(acc => acc.id === selectedAccountId), 
    [availableSocialAccounts, selectedAccountId]
  );

  // Reset selected account if it's no longer available
  React.useEffect(() => {
    if (selectedAccountId !== 'global' && !availableSocialAccounts.some(acc => acc.id === selectedAccountId)) {
      setSelectedAccountId('global');
    }
  }, [availableSocialAccounts, selectedAccountId]);

  const filteredPosts = useMemo(() => {
    if (currentUser.roleId === 'admin') {
      return socialPosts;
    }
    const managedIds = currentUser.managedSocialAccountIds || [];
    if (managedIds.length === 0) {
      return [];
    }
    return socialPosts.filter(post => 
      post.postedBy === currentUser.id || 
      post.postedToAccounts.some(accountId => managedIds.includes(accountId))
    );
  }, [socialPosts, currentUser]);

  const handleGenerate = () => {
    if (!generationQuery) return;
    
    let systemPromptToUse = aiSystemPrompt;
    let copyPromptToUse = DEFAULT_SOCIAL_COPY_PROMPT;
    
    if (selectedAccountId !== 'global' && selectedAccount) {
        if (selectedAccount.systemPrompt) {
            systemPromptToUse = selectedAccount.systemPrompt;
        }
        if (selectedAccount.copyPrompt) {
            copyPromptToUse = selectedAccount.copyPrompt;
        }
    }

    // Detect if it's a URL
    const isUrl = generationQuery.match(/^(https?:\/\/[^\s]+)/);
    const finalPrompt = isUrl ? `Genera un posteo basado en esta noticia: ${generationQuery}` : generationQuery;

    onGenerateSocialFromTopic(finalPrompt, systemPromptToUse, copyPromptToUse);
    setGenerationQuery('');
  };

  const confirmDelete = (e: React.MouseEvent, post: SocialPost) => {
    e.stopPropagation();
    setPostToDelete(post);
  };

  const executeDelete = () => {
    if (postToDelete) {
      onDeletePost(postToDelete.id);
      setPostToDelete(null);
    }
  };

  const drafts = filteredPosts.filter(p => p.status === 'draft');
  const publishedPosts = filteredPosts.filter(p => p.status !== 'draft');

  const renderPostItem = (post: SocialPost) => {
    const author = users.find(u => u.id === post.postedBy);
    const isDraft = post.status === 'draft';
    
    return (
      <div 
        key={post.id} 
        onClick={!isDraft ? () => onOpenDetail(post) : undefined}
        className={`group relative rounded-2xl overflow-hidden border transition-all duration-200 ${!isDraft ? 'bg-[#0f0f0f] border-white/5 hover:border-white/10 cursor-pointer' : 'bg-neon/[0.03] border-neon/20'}`}
      >
        <div className="flex items-center h-24 md:h-20">
          <div className="w-24 md:w-20 h-full flex-shrink-0 relative overflow-hidden bg-neutral-900">
              <OptimizedImage 
                src={post.imageUrl} 
                alt={post.titleOverlay} 
                className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" 
              />
              {isDraft && (
                <div className="absolute inset-0 bg-neon/10 flex items-center justify-center">
                   <Clock size={16} className="text-neon" />
                </div>
              )}
          </div>

          <div className="flex-1 px-4 min-w-0 flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-1 overflow-hidden">
                <div className="flex items-center -space-x-1.5 flex-shrink-0">
                  {post.postedToAccounts.map(accountId => {
                    const account = socialAccountMap.get(accountId);
                    return account?.profileImageUrl ? (
                      <img key={accountId} src={account.profileImageUrl} title={account.name} className="w-5 h-5 rounded-full border border-black bg-neutral-800" />
                    ) : null;
                  })}
                </div>
                <span className="text-gray-700 text-[10px]">•</span>
                <div className="text-gray-500 text-[8px] font-black uppercase tracking-widest truncate">
                  {author?.name.split(' ')[0] || 'Sistema'} • {formatArgentinaTimestamp(post.postedAt, { day: '2-digit', month: 'short' })}
                </div>
             </div>

             <h3 className="text-white font-oswald font-bold text-sm md:text-base uppercase italic leading-tight truncate group-hover:text-neon transition-colors" title={post.titleOverlay}>
              {post.titleOverlay}
             </h3>
             <p className="text-gray-500 text-[10px] font-medium leading-relaxed truncate mt-1">
               {post.copy.substring(0, 80)}{post.copy.length > 80 ? '...' : ''}
             </p>

             {post.originalArticleId !== 'standalone' && (
              <div className="mt-1 flex items-center gap-1.5 text-gray-600 text-[8px] font-bold uppercase tracking-wider truncate">
                 <ExternalLink size={8} /> {post.originalArticleTitle}
              </div>
            )}
          </div>

          <div className="flex items-center pr-3 md:pr-5 gap-2 flex-shrink-0">
             {isDraft ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); onOpenEditor(post); }} 
                  className="p-2 md:px-4 md:py-1.5 bg-white/5 border border-white/10 text-white hover:text-black hover:bg-neon hover:border-neon rounded-lg text-[9px] font-black uppercase italic tracking-widest transition-all active:scale-95"
                >
                  <Edit3 size={14} className="md:hidden" />
                  <span className="hidden md:inline">EDITAR</span>
                </button>
              ) : (
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${post.status === 'success' ? 'text-green-500/80 bg-green-500/5' : 'text-red-500/80 bg-red-500/5'}`}>
                   {post.status === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                   <span className="text-[8px] font-black uppercase italic tracking-widest hidden sm:inline">{post.status === 'success' ? 'LISTO' : 'ERROR'}</span>
                </div>
              )}
              
              <button 
                onClick={(e) => confirmDelete(e, post)}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-500/10"
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 md:px-0">
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-oswald font-black italic uppercase text-white tracking-tighter flex items-center gap-3">
            <Send className="text-neon" size={32} /> REDES SOCIALES
          </h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Gestión de comunidad y automatización IA</p>
        </div>
        
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 self-stretch md:self-auto">
          <button 
            onClick={() => setActiveSubTab('posteos')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all ${activeSubTab === 'posteos' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
          >
            <Zap size={14} /> POSTEOS
          </button>
          <button 
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all ${activeSubTab === 'history' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
          >
            <History size={14} /> HISTORIAL
          </button>
        </div>
      </div>

      {activeSubTab === 'posteos' ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Dashboard de Cuentas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-[#0f0f0f] p-6 rounded-[32px] border border-white/5 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <AtSign className="text-neon" size={16} />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Cuentas Activas</h3>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden mb-4">
                        {availableSocialAccounts.slice(0, 5).map(acc => (
                            <img key={acc.id} src={acc.profileImageUrl} className="w-8 h-8 rounded-full border-2 border-[#0f0f0f] bg-neutral-800 object-cover" title={acc.name} />
                        ))}
                        {availableSocialAccounts.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-[#0f0f0f] bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                +{availableSocialAccounts.length - 5}
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Gestionando {availableSocialAccounts.length} perfiles sociales</p>
             </div>

             <div className="bg-[#0f0f0f] p-6 rounded-[32px] border border-white/5 md:col-span-2 flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="text-neon" size={16} />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Generador Rápido</h3>
                    </div>
                    <p className="text-gray-500 text-[10px] font-medium leading-relaxed max-w-md">
                        Crea contenido optimizado para tus redes usando inteligencia artificial entrenada con la voz de tu marca.
                    </p>
                </div>
                <button 
                  onClick={onOpenCreator}
                  className="bg-white/5 hover:bg-white/10 text-white p-4 rounded-2xl transition-all group"
                >
                    <Plus className="group-hover:rotate-90 transition-transform" size={24} />
                </button>
             </div>
          </div>

          {/* Input de Generación */}
          <div className="bg-[#0f0f0f] p-8 rounded-[40px] border border-white/5 shadow-2xl relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 overflow-hidden pointer-events-none">
                <Zap size={120} />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-neon/10 rounded-2xl flex items-center justify-center text-neon">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-oswald font-black text-white uppercase italic tracking-tight">Workbench IA</h3>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Generación masiva de posteos</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={generationQuery} 
                            onChange={e => setGenerationQuery(e.target.value)} 
                            placeholder="¿Sobre qué quieres postear hoy? (Ej: El triunfo de Messi, Rumores de mercado...)" 
                            className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-sm text-white focus:border-neon outline-none transition-all placeholder:text-gray-700" 
                            onKeyDown={(e) => e.key === 'Enter' && !!generationQuery && handleGenerate()}
                        />
                    </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <button 
                            onClick={() => setIsVoiceSelectorOpen(!isVoiceSelectorOpen)}
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-xs font-bold text-white flex items-center justify-between hover:border-neon/50 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                {selectedAccountId === 'global' ? (
                                    <div className="w-6 h-6 rounded-full bg-neon/20 flex items-center justify-center text-neon text-[10px] font-black">A1</div>
                                ) : (
                                    <img src={selectedAccount?.profileImageUrl} className="w-6 h-6 rounded-full bg-neutral-800 object-cover" />
                                )}
                                <span>{selectedAccountId === 'global' ? 'Voz Global A1Toque' : `Personalidad: ${selectedAccount?.name}`}</span>
                            </div>
                            <ChevronDown size={14} className={`transition-transform ${isVoiceSelectorOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isVoiceSelectorOpen && (
                            <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-200">
                                <div className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    <button 
                                        onClick={() => { setSelectedAccountId('global'); setIsVoiceSelectorOpen(false); }}
                                        className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase italic tracking-widest flex items-center gap-3 transition-colors ${selectedAccountId === 'global' ? 'bg-neon text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${selectedAccountId === 'global' ? 'bg-black/20' : 'bg-neon/20 text-neon'}`}>A1</div>
                                        Voz Global A1Toque
                                    </button>
                                    {availableSocialAccounts.map(account => (
                                        <button 
                                            key={account.id}
                                            onClick={() => { setSelectedAccountId(account.id); setIsVoiceSelectorOpen(false); }}
                                            className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase italic tracking-widest flex items-center gap-3 transition-colors ${selectedAccountId === account.id ? 'bg-neon text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <img src={account.profileImageUrl} className="w-6 h-6 rounded-full bg-neutral-800 object-cover" />
                                            {account.name} ({account.platform})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={handleGenerate} 
                        disabled={!generationQuery}
                        className="w-full md:w-56 h-[52px] bg-neon text-black text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        GENERAR POSTEO <ArrowRight size={16} strokeWidth={3} />
                    </button>
                </div>
                </div>
            </div>
          </div>

          {/* Cola de Generación */}
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-oswald font-black italic uppercase text-white tracking-tight">Borradores en Proceso</h3>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">{socialGenerationQueue.length + drafts.length} TAREAS</span>
                </div>
                <button 
                  onClick={() => onOpenCreator()} 
                  className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase italic tracking-widest rounded-xl hover:bg-white/10 transition-all"
                >
                  <Plus size={16} strokeWidth={3} /> <span className="hidden sm:inline">NUEVO MANUAL</span>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {socialGenerationQueue.length === 0 && drafts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                    <Loader2 className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-20" />
                    <p className="text-gray-500 font-black uppercase italic text-sm tracking-widest">Sin tareas activas</p>
                </div>
              ) : (
                <>
                  {socialGenerationQueue.map(task => (
                    <div key={task.id} className={`bg-[#0f0f0f] p-6 rounded-3xl border transition-all ${task.status === 'completed' ? 'border-neon/20' : task.status === 'failed' ? 'border-red-500/20' : 'border-white/5 animate-pulse'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${task.status === 'completed' ? 'bg-neon text-black' : task.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {task.status === 'researching' && <Loader2 size={18} className="animate-spin" />}
                                    {task.status === 'completed' && <CheckCircle2 size={18} strokeWidth={3} />}
                                    {task.status === 'failed' && <AlertTriangle size={18} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-white font-bold text-sm truncate md:max-w-md">{task.prompt}</p>
                                    {task.status === 'failed' && (
                                        <button 
                                            onClick={() => onGenerateSocialFromTopic(task.prompt, aiSystemPrompt, DEFAULT_SOCIAL_COPY_PROMPT)}
                                            className="mt-2 text-[9px] font-black uppercase italic tracking-widest text-neon hover:text-white transition-colors flex items-center gap-1"
                                        >
                                            <Sparkles size={10} /> REGENERAR
                                        </button>
                                    )}
                                    
                                    {task.status === 'completed' && task.result && (
                                        <div className="mt-2 bg-black/50 rounded-xl p-3 border border-white/5">
                                            <h4 className="text-white font-oswald font-bold text-xs uppercase italic truncate">{task.result.shortTitle}</h4>
                                            <p className="text-gray-500 text-[10px] mt-1 line-clamp-2">{task.result.copy}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${task.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400'}`}>{task.status}</span>
                                        {task.error && <span className="text-[8px] font-bold text-red-500/60 uppercase">{task.error}</span>}
                                        {task.result && (
                                            <span className="text-[8px] font-black uppercase text-neon tracking-widest">Listo para revisión</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                                {task.status === 'completed' && task.result && (
                                    <button 
                                        onClick={() => onLoadSocialDraft(task)} 
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-neon text-black text-[10px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition-all"
                                    >
                                        <Edit3 size={14} strokeWidth={3} /> REVISAR Y PUBLICAR
                                    </button>
                                )}
                                <button 
                                    onClick={() => onRemoveSocialTask(task.id)} 
                                    className="w-10 h-10 flex items-center justify-center bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/10"
                                    title="Eliminar borrador"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
              {drafts.map(renderPostItem)}
              </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-oswald font-black italic uppercase text-white tracking-tight">Historial de Posteos</h3>
              <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Registro de actividad en redes</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {publishedPosts.length > 0 ? publishedPosts.map(renderPostItem) : (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-[40px] bg-[#0f0f0f]">
                <Send className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-30" />
                <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Sin publicaciones activas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de eliminación simplificado */}
      {postToDelete && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4">
           <div className="max-w-xs w-full bg-[#111] border border-white/10 rounded-[40px] p-10 text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <Trash2 size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-oswald font-black text-white uppercase italic mb-3 tracking-tighter">¿BORRAR POSTEO?</h3>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-10 px-2 leading-relaxed">
                Esta acción es irreversible y eliminará el registro de tu historial.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={executeDelete} className="w-full py-4 bg-red-600 text-white font-black uppercase italic text-[11px] tracking-widest rounded-xl hover:bg-red-500 transition-colors">ELIMINAR AHORA</button>
                <button onClick={() => setPostToDelete(null)} className="w-full py-4 bg-white/5 text-gray-400 font-black uppercase italic text-[11px] tracking-widest rounded-xl">CANCELAR</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
