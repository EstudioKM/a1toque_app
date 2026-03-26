import React, { useMemo, useState } from 'react';
import { SocialPost, User, SocialAccount, SocialGenerationTask, SiteConfig } from '../../types';
import { formatArgentinaTimestamp } from '../../services/dateUtils';
import { 
  Plus, Edit3, Trash2, ExternalLink, Send, CheckCircle2, 
  Clock, Sparkles, Zap, ArrowRight, Loader2, AlertTriangle,
  LayoutGrid, History, Settings2, AtSign, AlertCircle, ChevronDown,
  Calendar, ChevronLeft, ChevronRight
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
  onRepublish: (post: SocialPost) => void;
  onDeletePost: (id: string) => void;
  onGenerateSocialFromTopic: (topic: string, systemPrompt: string, copyPrompt: string, accountId?: string) => void;
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
  onRepublish,
  onDeletePost,
  onGenerateSocialFromTopic,
  onLoadSocialDraft,
  onRemoveSocialTask
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'posteos' | 'scheduled' | 'history'>('posteos');
  const [scheduledViewMode, setScheduledViewMode] = useState<'list' | 'calendar' | 'weekly'>('calendar');
  const [scheduledAccountFilter, setScheduledAccountFilter] = useState<string>('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [weeklyDate, setWeeklyDate] = useState(new Date());
  const [postToDelete, setPostToDelete] = useState<SocialPost | null>(null);
  const [generationQuery, setGenerationQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
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

  // Set initial account and reset if no longer available
  React.useEffect(() => {
    if (!selectedAccountId && availableSocialAccounts.length > 0) {
      setSelectedAccountId(availableSocialAccounts[0].id);
    } else if (selectedAccountId && !availableSocialAccounts.some(acc => acc.id === selectedAccountId)) {
      setSelectedAccountId(availableSocialAccounts.length > 0 ? availableSocialAccounts[0].id : '');
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

  const scheduledPostsByDate = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    filteredPosts
      .filter(p => p.status === 'scheduled')
      .filter(p => !scheduledAccountFilter || p.postedToAccounts.includes(scheduledAccountFilter))
      .forEach(post => {
      if (post.scheduledAt) {
        const date = new Date(post.scheduledAt);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (!map.has(dateStr)) {
          map.set(dateStr, []);
        }
        map.get(dateStr)!.push(post);
      }
    });
    return map;
  }, [filteredPosts, scheduledAccountFilter]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [calendarMonth]);

  const weeklyDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(weeklyDate);
    current.setDate(current.getDate() - current.getDay()); // Start on Sunday
    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [weeklyDate]);

  const handleGenerate = () => {
    if (!generationQuery) return;
    
    let systemPromptToUse = aiSystemPrompt;
    let copyPromptToUse = DEFAULT_SOCIAL_COPY_PROMPT;
    
    if (selectedAccountId && selectedAccount) {
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

    onGenerateSocialFromTopic(finalPrompt, systemPromptToUse, copyPromptToUse, selectedAccountId || undefined);
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

  const drafts = useMemo(() => 
    filteredPosts
      .filter(p => p.status === 'draft')
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()),
    [filteredPosts]
  );
  const scheduledPosts = useMemo(() => 
    filteredPosts
      .filter(p => p.status === 'scheduled')
      .filter(p => !scheduledAccountFilter || p.postedToAccounts.includes(scheduledAccountFilter))
      .sort((a, b) => new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime()),
    [filteredPosts, scheduledAccountFilter]
  );
  const publishedPosts = useMemo(() => 
    filteredPosts
      .filter(p => p.status === 'success' || p.status === 'failed')
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()),
    [filteredPosts]
  );

  const renderPostItem = (post: SocialPost) => {
    const author = users.find(u => u.id === post.postedBy);
    const isDraft = post.status === 'draft';
    const isScheduled = post.status === 'scheduled';
    const isEditable = isDraft || isScheduled;
    
    return (
      <div 
        key={post.id} 
        onClick={!isEditable ? () => onOpenDetail(post) : undefined}
        className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 ${!isEditable ? 'bg-[#0f0f0f] border-white/5 hover:border-white/10 cursor-pointer' : isScheduled ? 'bg-blue-500/5 border-blue-500/20' : 'bg-neon/[0.03] border-neon/20'}`}
      >
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6">
            <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl overflow-hidden bg-neutral-900 flex-shrink-0 border border-white/10">
                <OptimizedImage 
                  src={post.imageUrl} 
                  alt={post.titleOverlay} 
                  className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" 
                />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="flex -space-x-2 flex-shrink-0">
                    {post.postedToAccounts.map(accountId => {
                      const account = socialAccountMap.get(accountId);
                      return account?.profileImageUrl ? (
                        <img key={accountId} src={account.profileImageUrl} title={account.name} className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-black bg-neutral-800" />
                      ) : null;
                    })}
                  </div>
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-neon">
                    {post.postedToAccounts.length > 0 ? socialAccountMap.get(post.postedToAccounts[0])?.name : 'General'}
                  </span>
                  <h3 className="text-white font-black uppercase italic text-xs md:text-sm truncate group-hover:text-neon transition-colors">
                    {post.titleOverlay}
                  </h3>
                </div>

                <div className="bg-black/40 rounded-xl md:rounded-2xl p-3 md:p-5 border border-white/5 mb-3 md:mb-4">
                  <h4 className="text-white font-oswald font-black text-xs md:text-sm uppercase italic mb-1 md:mb-2">{post.titleOverlay}</h4>
                  <p className="text-gray-500 text-[10px] md:text-xs leading-relaxed line-clamp-2 md:line-clamp-3">{post.copy}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className={`flex items-center gap-1.5 px-2 md:px-3 py-0.5 md:py-1 rounded-md text-[8px] md:text-[9px] font-black uppercase italic tracking-widest ${post.status === 'success' ? 'text-green-500 bg-green-500/10' : post.status === 'draft' ? 'text-white bg-white/10' : 'text-blue-400 bg-blue-400/10'}`}>
                    {post.status === 'success' ? <CheckCircle2 size={8} className="md:w-[10px] md:h-[10px]" /> : <Clock size={8} className="md:w-[10px] md:h-[10px]" />}
                    {post.status === 'success' ? 'PUBLICADO' : post.status === 'draft' ? 'BORRADOR' : 'PROGRAMADO'}
                  </div>
                  
                  <span className="text-[8px] md:text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                    {author?.name.split(' ')[0] || 'Sistema'} • {formatArgentinaTimestamp(post.postedAt, { day: '2-digit', month: 'short' })}
                  </span>

                  {post.status === 'success' && (
                    <span className="text-[8px] md:text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 md:px-3 py-0.5 md:py-1 rounded-md">
                      {new Date(post.postedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}

                  {isScheduled && post.scheduledAt && (
                    <span className="text-[8px] md:text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 md:px-3 py-0.5 md:py-1 rounded-md">
                      {new Date(post.scheduledAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/5 flex-shrink-0">
              {isEditable ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); onOpenEditor(post); }} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 bg-neon text-black text-[9px] md:text-[11px] font-black uppercase italic tracking-widest rounded-lg md:rounded-xl hover:scale-105 transition-all shadow-lg"
                >
                  <Edit3 size={14} className="md:w-4 md:h-4" strokeWidth={3} /> REVISAR Y PUBLICAR
                </button>
              ) : (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRepublish(post); }}
                    className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-neon/10 border border-neon/20 text-neon hover:bg-neon hover:text-black rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase italic tracking-widest transition-all"
                  >
                    REPUBLICAR
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onOpenDetail(post); }}
                    className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase italic tracking-widest transition-all"
                  >
                    VER DETALLE
                  </button>
                </>
              )}
              
              <button 
                onClick={(e) => confirmDelete(e, post)}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white rounded-lg md:rounded-xl transition-all border border-red-500/10"
                title="Eliminar"
              >
                <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 px-3 md:px-0">
      {/* Header Superior */}
      <div className="sticky top-16 lg:top-20 z-40 bg-black/95 backdrop-blur-md pt-1 md:pt-4 pb-2 md:pb-6 mb-4 md:mb-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-6 -mx-3 px-3 md:mx-0 md:px-0">
        <div className="w-full md:w-auto">
          <h2 className="text-xl md:text-4xl font-oswald font-black italic uppercase text-white tracking-tighter flex items-center gap-2 md:gap-3">
            <Send className="text-neon w-5 h-5 md:w-8 md:h-8" /> REDES
          </h2>
          <p className="hidden md:block text-gray-500 text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-0.5 md:mt-1">Gestión de comunidad y automatización IA</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-6 w-full md:w-auto">
          <div className="hidden lg:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
                <AtSign className="text-neon" size={14} />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Cuentas Activas</span>
            </div>
            <div className="flex -space-x-2 overflow-hidden">
                {availableSocialAccounts.slice(0, 5).map(acc => (
                    <img key={acc.id} src={acc.profileImageUrl} className="w-6 h-6 rounded-full border border-[#0f0f0f] bg-neutral-800 object-cover" title={acc.name} />
                ))}
                {availableSocialAccounts.length > 5 && (
                    <div className="w-6 h-6 rounded-full border border-[#0f0f0f] bg-neutral-800 flex items-center justify-center text-[8px] font-bold text-gray-400">
                        +{availableSocialAccounts.length - 5}
                    </div>
                )}
            </div>
          </div>

          <div className="w-full overflow-hidden">
            <div className="flex bg-black/40 p-1 rounded-xl md:rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveSubTab('posteos')}
                className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase italic tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'posteos' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
              >
                <Zap size={12} className="md:w-[14px] md:h-[14px]" /> BORRADORES
              </button>
              <button 
                onClick={() => setActiveSubTab('scheduled')}
                className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase italic tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'scheduled' ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-gray-500 hover:text-white'}`}
              >
                <Clock size={12} className="md:w-[14px] md:h-[14px]" /> PROGRAMADOS
              </button>
              <button 
                onClick={() => setActiveSubTab('history')}
                className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase italic tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'history' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
              >
                <History size={12} className="md:w-[14px] md:h-[14px]" /> PUBLICADOS
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeSubTab === 'posteos' ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Input de Generación */}
          <div className="bg-[#0f0f0f] p-4 md:p-6 rounded-2xl border border-white/5 shadow-2xl relative mt-2 md:mt-4">
            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 overflow-hidden pointer-events-none">
                <Zap className="w-16 h-16 md:w-[120px] md:h-[120px]" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-neon/10 rounded-xl md:rounded-2xl flex items-center justify-center text-neon">
                        <Sparkles size={16} className="md:w-5 md:h-5" />
                    </div>
                    <h3 className="text-base md:text-lg font-oswald font-black text-white uppercase italic tracking-tight">GENERAR POSTEO</h3>
                </div>

                <div className="flex flex-col gap-3 md:gap-4">
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={generationQuery} 
                            onChange={e => setGenerationQuery(e.target.value)} 
                            placeholder="¿Sobre qué quieres postear hoy?" 
                            className="w-full bg-black border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-white focus:border-neon outline-none transition-all placeholder:text-gray-700" 
                            onKeyDown={(e) => e.key === 'Enter' && !!generationQuery && handleGenerate()}
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                        <div className="flex-1 relative">
                            <button 
                                onClick={() => setIsVoiceSelectorOpen(!isVoiceSelectorOpen)}
                                className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 h-10 md:h-[52px] text-[10px] md:text-xs font-bold text-white flex items-center justify-between hover:border-neon/50 transition-all"
                            >
                                <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                                    {selectedAccount?.profileImageUrl ? (
                                        <img src={selectedAccount.profileImageUrl} className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-neutral-800 object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-neon/20 flex items-center justify-center text-neon text-[8px] md:text-[10px] font-black flex-shrink-0">A1</div>
                                    )}
                                    <span className="truncate text-left">{selectedAccount ? `Voz: ${selectedAccount.name}` : 'Seleccionar Voz'}</span>
                                </div>
                                <ChevronDown size={12} className={`md:w-3.5 md:h-3.5 transition-transform ${isVoiceSelectorOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isVoiceSelectorOpen && (
                                <div className="absolute top-full mt-2 left-0 right-0 bg-[#111] border border-white/10 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
                                    <div className="max-h-48 md:max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                        {availableSocialAccounts.map(account => (
                                            <button 
                                                key={account.id}
                                                onClick={() => { setSelectedAccountId(account.id); setIsVoiceSelectorOpen(false); }}
                                                className={`w-full px-3 md:px-4 py-2.5 md:py-3 text-left text-[9px] md:text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2 md:gap-3 transition-colors ${selectedAccountId === account.id ? 'bg-neon text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                <img src={account.profileImageUrl} className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-neutral-800 object-cover flex-shrink-0" />
                                                <span className="truncate">{account.name} ({account.platform})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleGenerate} 
                            disabled={!generationQuery}
                            className="w-full md:w-56 h-10 md:h-[52px] bg-neon text-black text-[10px] md:text-[11px] font-black uppercase italic tracking-widest rounded-lg md:rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                            GENERAR <ArrowRight size={14} className="md:w-4 md:h-4" strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
          </div>

          {/* Cola de Generación */}
          <div>
            <div className="flex items-center justify-between mb-4 md:mb-6 px-1 md:px-2">
                <div className="flex items-center gap-2 md:gap-4">
                    <h3 className="text-lg md:text-xl font-oswald font-black italic uppercase text-white tracking-tight">Borradores</h3>
                    <span className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-2 md:px-3 py-0.5 md:py-1 rounded-md border border-white/5">{socialGenerationQueue.length + drafts.length} TAREAS</span>
                </div>
                <button 
                  onClick={() => onOpenCreator()} 
                  className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white text-black text-[9px] md:text-[10px] font-black uppercase italic tracking-widest rounded-lg md:rounded-xl hover:scale-105 transition-all shadow-lg"
                >
                  <Plus size={14} className="md:w-4 md:h-4" strokeWidth={3} /> <span className="hidden sm:inline">NUEVO MANUAL</span><span className="sm:hidden">NUEVO</span>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {socialGenerationQueue.length === 0 && drafts.length === 0 ? (
                <div className="text-center py-12 md:py-16 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-gray-800 mx-auto mb-3 md:mb-4 opacity-20" />
                    <p className="text-gray-500 font-black uppercase italic text-xs md:text-sm tracking-widest">Sin tareas activas</p>
                </div>
              ) : (
                <>
                  {socialGenerationQueue.map(task => {
                    const taskAccount = task.accountId ? socialAccountMap.get(task.accountId) : null;
                    return (
                    <div key={task.id} className={`bg-[#0f0f0f] p-4 md:p-6 rounded-2xl md:rounded-3xl border overflow-hidden transition-all ${task.status === 'completed' ? 'border-neon/20' : task.status === 'failed' ? 'border-red-500/20' : 'border-white/5 animate-pulse'}`}>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6">
                            <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                                <div className={`mt-1 flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center overflow-hidden ${task.status === 'completed' ? 'bg-neon/10 text-neon' : task.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {taskAccount && taskAccount.profileImageUrl ? (
                                        <img src={taskAccount.profileImageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            {task.status === 'researching' && <Loader2 size={18} className="md:w-5 md:h-5 animate-spin" />}
                                            {task.status === 'completed' && <CheckCircle2 size={18} className="md:w-5 md:h-5" strokeWidth={3} />}
                                            {task.status === 'failed' && <AlertTriangle size={18} className="md:w-5 md:h-5" />}
                                        </>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                        {taskAccount && <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-neon">{taskAccount.name}</span>}
                                        <h4 className="text-white font-black uppercase italic text-xs md:text-sm truncate">{task.prompt}</h4>
                                    </div>
                                    
                                    {task.status === 'completed' && task.result && (
                                        <div className="bg-black/40 rounded-xl md:rounded-2xl p-3 md:p-5 border border-white/5 mb-3 md:mb-4">
                                            <h5 className="text-white font-oswald font-black text-xs md:text-sm uppercase italic mb-1 md:mb-2">{task.result.shortTitle}</h5>
                                            <p className="text-gray-500 text-[10px] md:text-xs leading-relaxed line-clamp-2 md:line-clamp-3">{task.result.copy}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 md:gap-3">
                                        <span className={`text-[8px] md:text-[9px] font-black uppercase px-2 md:px-3 py-0.5 md:py-1 rounded-md ${task.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}>{task.status}</span>
                                        {task.error && <span className="text-[8px] md:text-[9px] font-bold text-red-500/60 uppercase">{task.error}</span>}
                                        {task.status === 'completed' && (
                                            <span className="text-[8px] md:text-[9px] font-black uppercase text-neon tracking-widest flex items-center gap-1.5">
                                                <Sparkles size={10} /> LISTO
                                            </span>
                                        )}
                                    </div>
                                    
                                    {task.status === 'failed' && (
                                        <button 
                                            onClick={() => onGenerateSocialFromTopic(task.prompt, aiSystemPrompt, DEFAULT_SOCIAL_COPY_PROMPT, task.accountId)}
                                            className="mt-2 md:mt-3 text-[8px] md:text-[9px] font-black uppercase italic tracking-widest text-neon hover:text-white transition-colors flex items-center gap-1.5"
                                        >
                                            <Sparkles size={10} /> REGENERAR
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/5 flex-shrink-0">
                                {task.status === 'completed' && task.result && (
                                    <button 
                                        onClick={() => onLoadSocialDraft(task)} 
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 bg-neon text-black text-[9px] md:text-[11px] font-black uppercase italic tracking-widest rounded-lg md:rounded-xl hover:scale-105 transition-all shadow-lg"
                                    >
                                        <Edit3 size={14} className="md:w-4 md:h-4" strokeWidth={3} /> REVISAR Y PUBLICAR
                                    </button>
                                )}
                                <button 
                                    onClick={() => onRemoveSocialTask(task.id)} 
                                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white rounded-lg md:rounded-xl transition-all border border-red-500/10"
                                    title="Eliminar borrador"
                                >
                                    <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                                </button>
                            </div>
                        </div>
                    </div>
                  )})}
              {drafts.map(renderPostItem)}
              </>
              )}
            </div>
          </div>
        </div>
      ) : activeSubTab === 'scheduled' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 md:pt-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-oswald font-black italic uppercase text-white tracking-tight flex items-center gap-2">
                <Clock className="text-blue-500 w-5 h-5 md:w-6 md:h-6" /> POSTEOS PROGRAMADOS
              </h3>
              <p className="text-gray-500 text-[8px] md:text-[9px] font-bold uppercase tracking-widest mt-0.5 md:mt-1">Contenido pendiente de publicación</p>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 w-full md:w-auto flex-wrap">
              {/* Filtro por cuenta */}
              <div className="relative group min-w-[140px]">
                <select 
                  value={scheduledAccountFilter} 
                  onChange={e => setScheduledAccountFilter(e.target.value)} 
                  className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-[10px] font-bold text-white focus:border-neon outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors uppercase tracking-widest"
                >
                  <option value="">TODAS LAS CUENTAS</option>
                  {availableSocialAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-neon transition-colors">▼</div>
              </div>

              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => setScheduledViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${scheduledViewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                  title="Vista de Lista"
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setScheduledViewMode('calendar')}
                  className={`p-2 rounded-lg transition-all ${scheduledViewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                  title="Vista Mensual"
                >
                  <Calendar size={16} />
                </button>
                <button 
                  onClick={() => setScheduledViewMode('weekly')}
                  className={`p-2 rounded-lg transition-all flex items-center gap-1 ${scheduledViewMode === 'weekly' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                  title="Vista Semanal"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest">Semana</span>
                </button>
              </div>
              <button 
                onClick={() => onOpenCreator()} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white text-black text-[9px] md:text-[10px] font-black uppercase italic tracking-widest rounded-lg md:rounded-xl hover:scale-105 transition-all shadow-lg"
              >
                <Plus size={14} className="md:w-4 md:h-4" strokeWidth={3} /> <span className="hidden sm:inline">NUEVO MANUAL</span><span className="sm:hidden">NUEVO</span>
              </button>
            </div>
          </div>

          {scheduledViewMode === 'calendar' ? (
            <div className="w-full overflow-hidden">
              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 overflow-x-auto no-scrollbar">
                <div className="min-w-[600px]">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-white font-oswald font-bold text-base md:text-lg uppercase tracking-wider">
                      {calendarMonth.toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                        className="p-1.5 md:p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all"
                      >
                        <ChevronLeft size={14} className="md:w-4 md:h-4" />
                      </button>
                      <button 
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                        className="p-1.5 md:p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all"
                      >
                        <ChevronRight size={14} className="md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div key={day} className="text-center text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {calendarDays.map((date, i) => {
                      if (!date) return <div key={`empty-${i}`} className="bg-white/[0.02] rounded-lg md:rounded-xl min-h-[80px] md:min-h-[100px]" />;
                      
                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      const dayPosts = scheduledPostsByDate.get(dateStr) || [];
                      const isToday = new Date().toDateString() === date.toDateString();
                      
                      return (
                        <div key={dateStr} className={`bg-white/[0.02] rounded-lg md:rounded-xl min-h-[80px] md:min-h-[100px] p-1.5 md:p-2 border transition-all ${isToday ? 'border-neon/30 bg-neon/5' : 'border-white/5 hover:border-white/10'}`}>
                          <div className={`text-[8px] md:text-[10px] font-black mb-1.5 md:mb-2 ${isToday ? 'text-neon' : 'text-gray-500'}`}>
                            {date.getDate()}
                          </div>
                          <div className="flex flex-col gap-1 md:gap-1.5">
                            {dayPosts.map(post => (
                              <div 
                                key={post.id} 
                                onClick={() => onOpenEditor(post)}
                                className="bg-black/40 hover:bg-white/10 p-1 md:p-1.5 rounded-md md:rounded-lg border border-white/5 cursor-pointer transition-all flex flex-col gap-1 group"
                                title={post.titleOverlay}
                              >
                                <div className="flex items-center gap-1 md:gap-2">
                                  <div className="flex -space-x-1 flex-shrink-0">
                                    {post.postedToAccounts.slice(0, 2).map(accountId => {
                                      const account = socialAccountMap.get(accountId);
                                      return account?.profileImageUrl ? (
                                        <img key={accountId} src={account.profileImageUrl} className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-black bg-neutral-800 object-cover" />
                                      ) : null;
                                    })}
                                  </div>
                                  <span className="text-[7px] md:text-[9px] font-bold text-gray-300 group-hover:text-white truncate">
                                    {post.titleOverlay}
                                  </span>
                                </div>
                                {post.scheduledAt && (
                                  <div className="text-[6px] md:text-[8px] font-mono text-gray-500 pl-1">
                                    {new Date(post.scheduledAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : scheduledViewMode === 'weekly' ? (
            <div className="w-full overflow-hidden">
              <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 overflow-x-auto no-scrollbar">
                <div className="min-w-[800px]">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-white font-oswald font-bold text-base md:text-lg uppercase tracking-wider">
                      Semana del {weeklyDays[0].getDate()} de {weeklyDays[0].toLocaleString('es-AR', { month: 'long' })}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          const newDate = new Date(weeklyDate);
                          newDate.setDate(newDate.getDate() - 7);
                          setWeeklyDate(newDate);
                        }}
                        className="p-1.5 md:p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all"
                      >
                        <ChevronLeft size={14} className="md:w-4 md:h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          const newDate = new Date(weeklyDate);
                          newDate.setDate(newDate.getDate() + 7);
                          setWeeklyDate(newDate);
                        }}
                        className="p-1.5 md:p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all"
                      >
                        <ChevronRight size={14} className="md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {weeklyDays.map(date => {
                      const isToday = new Date().toDateString() === date.toDateString();
                      return (
                        <div key={date.toISOString()} className={`text-center py-2 rounded-lg ${isToday ? 'bg-neon/10' : ''}`}>
                          <div className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-neon' : 'text-gray-500'}`}>
                            {date.toLocaleString('es-AR', { weekday: 'short' })}
                          </div>
                          <div className={`text-lg font-oswald font-bold ${isToday ? 'text-white' : 'text-gray-400'}`}>
                            {date.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {weeklyDays.map(date => {
                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      const dayPosts = scheduledPostsByDate.get(dateStr) || [];
                      const isToday = new Date().toDateString() === date.toDateString();
                      
                      return (
                        <div key={dateStr} className={`bg-white/[0.02] rounded-xl min-h-[300px] p-2 border transition-all ${isToday ? 'border-neon/30 bg-neon/5' : 'border-white/5 hover:border-white/10'}`}>
                          <div className="flex flex-col gap-2">
                            {dayPosts.map(post => (
                              <div 
                                key={post.id} 
                                onClick={() => onOpenEditor(post)}
                                className="bg-black/60 hover:bg-white/10 p-2 rounded-lg border border-white/5 cursor-pointer transition-all flex flex-col gap-2 group"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex -space-x-1 flex-shrink-0">
                                    {post.postedToAccounts.map(accountId => {
                                      const account = socialAccountMap.get(accountId);
                                      return account?.profileImageUrl ? (
                                        <img key={accountId} src={account.profileImageUrl} className="w-4 h-4 rounded-full border border-black bg-neutral-800 object-cover" />
                                      ) : null;
                                    })}
                                  </div>
                                  {post.scheduledAt && (
                                    <div className="text-[9px] font-mono text-neon font-bold flex items-center gap-1 bg-neon/10 px-1.5 py-0.5 rounded">
                                      <Clock size={10} />
                                      {new Date(post.scheduledAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  )}
                                </div>
                                {post.imageUrl && (
                                  <div className="w-full h-24 rounded-md overflow-hidden relative">
                                    <img src={post.imageUrl} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                )}
                                <span className="text-[10px] font-bold text-gray-300 group-hover:text-white line-clamp-3 leading-tight">
                                  {post.titleOverlay || post.copy}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {scheduledPosts.length > 0 ? scheduledPosts.map(renderPostItem) : (
                <div className="py-16 text-center border border-dashed border-white/5 rounded-2xl bg-[#0f0f0f]">
                  <Clock className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-30" />
                  <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">No hay posteos programados</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-10 md:pt-14">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-oswald font-black italic uppercase text-white tracking-tight">POSTEOS PUBLICADOS</h3>
              <p className="text-gray-500 text-[8px] md:text-[9px] font-bold uppercase tracking-widest mt-0.5 md:mt-1">Registro de actividad en redes</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {publishedPosts.length > 0 ? publishedPosts.map(renderPostItem) : (
              <div className="py-16 text-center border border-dashed border-white/5 rounded-2xl bg-[#0f0f0f]">
                <Send className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-30" />
                <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Sin publicaciones activas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de eliminación simplificado */}
      {postToDelete && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
           <div className="max-w-xs w-full bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 md:mb-6">
                <Trash2 size={24} className="md:w-8 md:h-8" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl md:text-2xl font-oswald font-black text-white uppercase italic mb-2 md:mb-3 tracking-tighter">¿BORRAR POSTEO?</h3>
              <p className="text-gray-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-6 md:mb-10 px-2 leading-relaxed">
                Esta acción es irreversible y eliminará el registro de tus publicaciones.
              </p>
              <div className="flex flex-col gap-2 md:gap-3">
                <button onClick={executeDelete} className="w-full py-3 md:py-4 bg-red-600 text-white font-black uppercase italic text-[10px] md:text-[11px] tracking-widest rounded-lg md:rounded-xl hover:bg-red-500 transition-colors">ELIMINAR AHORA</button>
                <button onClick={() => setPostToDelete(null)} className="w-full py-3 md:py-4 bg-white/5 text-gray-400 font-black uppercase italic text-[10px] md:text-[11px] tracking-widest rounded-lg md:rounded-xl">CANCELAR</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
