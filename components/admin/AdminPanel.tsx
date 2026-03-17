import React, { useState, useMemo, useEffect } from 'react';
import { Article, Sponsorship, Brand, User, Role, SocialAccount, SocialPost, Source, CategoryConfig, GenerationTask, SocialGenerationTask, ContentBlock, SiteConfig, AdSlotConfig, WorkLog, Task, ChatMessage, ViewMode } from '../../types';
import { LogOut, User as UserIcon, Settings, FileText, Send, BrainCircuit, ShoppingBag, BarChart3, Users, Shield, Menu, X, Clock, CheckSquare, MessageSquare, Bell, LayoutDashboard, Loader2 } from 'lucide-react';
import { NotificationCenter } from '../NotificationCenter';
import { ArticleEditor } from './modals/ArticleEditor';
import { SocialPostCreator } from './modals/SocialPostCreator';
import { UserEditorModal } from './modals/UserEditorModal';
import { BrandEditorModal } from './modals/BrandEditorModal';
import { SponsorshipEditorModal } from './modals/SponsorshipEditorModal';
import { SocialAccountEditorModal } from './modals/SocialAccountEditorModal';
import { SourcesModal } from './modals/SourcesModal';
import { SocialPostDetailModal } from './modals/SocialPostDetailModal';
import { AdSlotEditorModal } from './modals/AdSlotEditorModal';
import { ContentTab } from './ContentTab';
import { SocialMediaTab } from './SocialMediaTab';
import { AdsTab } from './AdsTab';
import { UsersTab } from './UsersTab';
import { ConfigTab } from './ConfigTab';
import { ProfileTab } from './ProfileTab';
import { MetricsTab } from './MetricsTab';
import { PermissionsTab } from './PermissionsTab';
import { TasksTab } from './TasksTab';
import { AdminTasksTab } from './AdminTasksTab';
import { ChatTab } from './ChatTab';
import { HomeTab } from './HomeTab';
import { generateNewsFromUrl, generateNewsDraftFromTopic, generateSocialMediaContentFromTopic, generateSocialMediaContentFast } from '../../services/geminiService';

type AdminTab = 'home' | 'news' | 'social' | 'users' | 'ads' | 'metrics' | 'config' | 'profile' | 'permissions' | 'tasks' | 'admin_tasks' | 'chat';

const TABS_CONFIG = [
    { id: 'home', icon: LayoutDashboard, label: 'Inicio' },
    { id: 'tasks', icon: CheckSquare, label: 'Mi Trabajo' },
    { id: 'news', icon: FileText, label: 'Noticias' },
    { id: 'social', icon: Send, label: 'Redes Sociales' },
    { id: 'ads', icon: ShoppingBag, label: 'Ads' },
    { id: 'metrics', icon: BarChart3, label: 'Métricas' },
    { id: 'users', icon: Users, label: 'Usuarios' },
    { id: 'config', icon: Settings, label: 'Configuración' },
    { id: 'permissions', icon: Shield, label: 'Permisos' },
    { id: 'admin_tasks', icon: Shield, label: 'Gestión Tareas' },
    { id: 'chat', icon: MessageSquare, label: 'Chat Interno' },
];

interface AdminPanelProps {
  articles: Article[];
  sponsorships: Sponsorship[];
  brands: Brand[];
  users: User[];
  socialAccounts: SocialAccount[];
  socialPosts: SocialPost[];
  categories: CategoryConfig[];
  roles: Role[];
  adSlots: AdSlotConfig[];
  onUpdateAdSlot: (slot: AdSlotConfig) => void;
  currentUser: User;
  currentUserRole: Role;
  siteConfig: SiteConfig;
  onUpdateSiteConfig: (config: SiteConfig) => void;
  aiSystemPrompt: string;
  onUpdateAiSystemPrompt: (prompt: string) => void;
  onAddArticle: (article: Omit<Article, 'id'>) => void;
  onUpdateArticle: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
  onToggleArticleStatus: (id: string) => void;
  onViewArticle: (id: string) => void;
  onAddSponsorship: (s: Omit<Sponsorship, 'id' | 'impressions' | 'clicks'>) => void;
  onUpdateSponsorship: (s: Sponsorship) => void;
  onDeleteSponsorship: (id: string) => void;
  onToggleSponsorshipStatus: (id: string) => void;
  onAddBrand: (b: Omit<Brand, 'id'>) => void;
  onUpdateBrand: (b: Brand) => void;
  onDeleteBrand: (id: string) => void;
  onAddUser: (u: Omit<User, 'id'>) => void;
  onUpdateUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  onAddSocialAccount: (a: Omit<SocialAccount, 'id'>) => void;
  onUpdateSocialAccount: (a: SocialAccount) => void;
  onDeleteSocialAccount: (id: string) => void;
  onAddSocialPost: (p: Omit<SocialPost, 'id'>) => void;
  onUpdateSocialPost: (p: SocialPost) => void;
  onDeleteSocialPost: (id: string) => void;
  onAddCategory: (category: Omit<CategoryConfig, 'id' | 'order'>) => void;
  onUpdateCategory: (category: CategoryConfig) => void;
  onUpdateCategoriesOrder: (categories: CategoryConfig[]) => void;
  onDeleteCategory: (id: string) => void;
  onAddRole: (role: Omit<Role, 'id'>) => void;
  onUpdateRole: (role: Role) => void;
  onDeleteRole: (id: string) => void;
  workLogs: WorkLog[];
  onAddWorkLog: (log: Omit<WorkLog, 'id'>) => void;
  onUpdateWorkLog: (log: WorkLog) => void;
  onDeleteWorkLog: (id: string) => void;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  chatMessages: ChatMessage[];
  onAddChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  onMarkChatAsRead: (senderId: string) => void;
  onMarkTaskAsViewed: (taskId: string) => void;
  aiNewsTasks: GenerationTask[];
  aiSocialTasks: SocialGenerationTask[];
  onAddAiNewsTask: (task: Omit<GenerationTask, 'id'>) => Promise<string>;
  onUpdateAiNewsTask: (id: string, task: Partial<GenerationTask>) => Promise<void>;
  onDeleteAiNewsTask: (id: string) => Promise<void>;
  onAddAiSocialTask: (task: Omit<SocialGenerationTask, 'id'>) => Promise<string>;
  onUpdateAiSocialTask: (id: string, task: Partial<SocialGenerationTask>) => Promise<void>;
  onDeleteAiSocialTask: (id: string) => Promise<void>;
  onExit: () => void;
  initialTab?: AdminTab;
  initialTargetId?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const availableTabs = useMemo(() => {
    const permissions = props.currentUserRole?.permissions || [];
    return TABS_CONFIG.filter(tab => permissions.includes(tab.id));
  }, [props.currentUserRole]);

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (props.initialTab) return props.initialTab;
    return 'home';
  });

  useEffect(() => {
    if (props.initialTab) {
      setActiveTab(props.initialTab);
    }
  }, [props.initialTab]);
  
  const [isArticleEditorOpen, setIsArticleEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [newsTaskBeingEdited, setNewsTaskBeingEdited] = useState<string | null>(null);
  const [isSocialPostCreatorOpen, setIsSocialPostCreatorOpen] = useState(false);
  const [articleForSocial, setArticleForSocial] = useState<Article | null>(null);
  const [selectedAccountIdForCreator, setSelectedAccountIdForCreator] = useState<string | undefined>(undefined);
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);
  const [preGeneratedSocialContent, setPreGeneratedSocialContent] = useState<any | null>(null);
  const [editingSocialPost, setEditingSocialPost] = useState<SocialPost | null>(null);
  const [socialTaskBeingEdited, setSocialTaskBeingEdited] = useState<string | null>(null);
  const [isUserEditorOpen, setIsUserEditorOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isBrandEditorOpen, setIsBrandEditorOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isSponsorshipEditorOpen, setIsSponsorshipEditorOpen] = useState(false);
  const [editingSponsorship, setEditingSponsorship] = useState<Partial<Sponsorship> | null>(null);
  const [isSocialAccountEditorOpen, setIsSocialAccountEditorOpen] = useState(false);
  const [editingSocialAccount, setEditingSocialAccount] = useState<SocialAccount | null>(null);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [sourcesToShow, setSourcesToShow] = useState<Source[]>([]);
  const [isSocialPostDetailOpen, setIsSocialPostDetailOpen] = useState(false);
  const [selectedSocialPost, setSelectedSocialPost] = useState<SocialPost | null>(null);
  const [editingAdSlot, setEditingAdSlot] = useState<AdSlotConfig | null>(null);

  const generationQueue = useMemo(() => 
    props.aiNewsTasks.filter(t => t.userId === props.currentUser.id), 
    [props.aiNewsTasks, props.currentUser.id]
  );

  const socialGenerationQueue = useMemo(() => 
    props.aiSocialTasks.filter(t => t.userId === props.currentUser.id), 
    [props.aiSocialTasks, props.currentUser.id]
  );

  const brandMap = useMemo(() => new Map(props.brands.map(b => [b.id, b])), [props.brands]);
  const socialAccountMap = useMemo(() => new Map(props.socialAccounts.map(a => [a.id, a])), [props.socialAccounts]);
  const rolesMap = useMemo(() => new Map(props.roles.map(r => [r.id, r])), [props.roles]);

  const handleOpenArticleEditor = (article?: Article) => { setEditingArticle(article || null); setIsArticleEditorOpen(true); };
  const handleOpenSocialCreator = async (article?: Article, accountId?: string) => { 
    setArticleForSocial(article || null); 
    setSelectedAccountIdForCreator(accountId);
    setEditingSocialPost(null); 
    
    if (article && accountId) {
        setIsGeneratingSocial(true);
        try {
            const account = props.socialAccounts.find(a => a.id === accountId);
            if (account) {
                const generated = await generateSocialMediaContentFast(
                    article.title,
                    article.excerpt,
                    account.systemPrompt,
                    account.copyPrompt
                );
                setPreGeneratedSocialContent(generated);
            }
        } catch (e) {
            console.error("Error generating social content:", e);
        } finally {
            setIsGeneratingSocial(false);
            setIsSocialPostCreatorOpen(true);
        }
    } else {
        setIsSocialPostCreatorOpen(true);
    }
  };
  const handleOpenSocialEditor = (post: SocialPost) => { setArticleForSocial(null); setEditingSocialPost(post); setIsSocialPostCreatorOpen(true); };
  const handleOpenUserEditor = (user?: User) => { setEditingUser(user || null); setIsUserEditorOpen(true); };
  const handleOpenBrandEditor = (brand?: Brand) => { setEditingBrand(brand || null); setIsBrandEditorOpen(true); };
  const handleOpenSponsorshipEditor = (sponsorship?: Partial<Sponsorship>) => { setEditingSponsorship(sponsorship || null); setIsSponsorshipEditorOpen(true); };
  const handleOpenSocialAccountEditor = (account?: SocialAccount) => { setEditingSocialAccount(account || null); setIsSocialAccountEditorOpen(true); };
  const handleOpenSourcesModal = (sources: Source[]) => { setSourcesToShow(sources); setIsSourcesModalOpen(true); };
  const handleOpenSocialPostDetail = (post: SocialPost) => { setSelectedSocialPost(post); setIsSocialPostDetailOpen(true); };
  const handleOpenAdSlotEditor = (slot: AdSlotConfig) => { setEditingAdSlot(slot); };

  const handleGenerateFromUrl = async (url: string, systemInstruction: string) => {
    const controller = new AbortController();
    const taskId = await props.onAddAiNewsTask({ 
        userId: props.currentUser.id, 
        prompt: url, 
        status: 'researching' 
    });
    
    const draft = await generateNewsFromUrl(url, systemInstruction, controller.signal);
    await props.onUpdateAiNewsTask(taskId, { 
        status: draft ? 'completed' : 'failed', 
        result: draft || undefined, 
        error: draft ? undefined : "Error en URL." 
    });
  };
  
  const handleGenerateFromTopic = async (topic: string, systemInstruction: string) => {
    const controller = new AbortController();
    const taskId = await props.onAddAiNewsTask({ 
        userId: props.currentUser.id, 
        prompt: topic, 
        status: 'researching' 
    });
    
    const draft = await generateNewsDraftFromTopic(topic, systemInstruction, props.siteConfig.searchDomains || [], controller.signal);
    await props.onUpdateAiNewsTask(taskId, { 
        status: draft ? 'completed' : 'failed', 
        result: draft || undefined, 
        error: draft ? undefined : "Error en tema." 
    });
  };

  const handleLoadDraftInEditor = (task: GenerationTask) => {
    if (task.result) {
      const articleForEditor: Article = { id: `draft-${task.id}`, title: task.result.title, excerpt: task.result.excerpt, category: task.result.category, content: task.result.blocks.map((b: ContentBlock, i: number) => ({...b, id: `${b.type}-${i}`})), author: props.currentUser.id, date: new Date().toISOString().split('T')[0], isPublished: false, imageUrl: task.result.imageUrl || '', sources: task.result.sources };
      setNewsTaskBeingEdited(task.id);
      handleOpenArticleEditor(articleForEditor);
    }
  };

  const handleSaveDraftFromTask = (task: GenerationTask) => {
    if (task.result) {
      const draftArticle: Omit<Article, 'id'> = { title: task.result.title, excerpt: task.result.excerpt, category: task.result.category, content: task.result.blocks.map((b: ContentBlock, i: number) => ({...b, id: `${b.type}-${i}`})), author: props.currentUser.id, date: new Date().toISOString().split('T')[0], isPublished: false, imageUrl: task.result.imageUrl || '', sources: task.result.sources };
      props.onAddArticle(draftArticle);
      props.onDeleteAiNewsTask(task.id);
    }
  };

  const handleSaveArticleFromEditor = (data: Article | Omit<Article, 'id'>) => {
    if ('id' in data && data.id && !data.id.startsWith('draft-')) { 
        props.onUpdateArticle(data as Article); 
    } else { 
        const { id, ...articleData } = data as Article; 
        props.onAddArticle(articleData); 
        if (newsTaskBeingEdited) props.onDeleteAiNewsTask(newsTaskBeingEdited);
    }
    setNewsTaskBeingEdited(null);
  };

  const handleGenerateSocialFromTopic = async (topic: string, systemInstruction: string, copyInstruction: string, accountId?: string) => {
    const controller = new AbortController();
    const taskId = await props.onAddAiSocialTask({ 
        userId: props.currentUser.id, 
        prompt: topic, 
        status: 'researching',
        accountId
    });
    
    try {
        const result = await generateSocialMediaContentFromTopic(topic, systemInstruction, copyInstruction);
        await props.onUpdateAiSocialTask(taskId, { 
            status: result ? 'completed' : 'failed', 
            result: result || undefined, 
            error: result ? undefined : "Error en generación social." 
        });
    } catch (error) {
        await props.onUpdateAiSocialTask(taskId, { 
            status: 'failed', 
            error: "Error de red." 
        });
    }
  };

  const handleLoadSocialDraft = (task: SocialGenerationTask) => {
    if (task.result) {
      const draftPost: Partial<SocialPost> = {
        titleOverlay: task.result.shortTitle,
        copy: task.result.copy,
        imageUrl: task.result.imageUrl || '',
        status: 'draft',
        sources: task.result.sources || [],
        postedToAccounts: task.accountId ? [task.accountId] : []
      };
      setEditingSocialPost(draftPost as SocialPost);
      setSocialTaskBeingEdited(task.id);
      setArticleForSocial(null);
      setIsSocialPostCreatorOpen(true);
    }
  };

  const handleNavClick = (tab: AdminTab) => { setActiveTab(tab); setIsSidebarOpen(false); };
  const NavButton: React.FC<{ tab: AdminTab, icon: React.ElementType, label: string }> = ({ tab, icon: Icon, label }) => {
    const hasNotification = (tab === 'chat' && props.chatMessages.some(m => m.receiverId === props.currentUser.id && !m.isRead)) ||
                           (tab === 'tasks' && props.tasks.some(t => t.assignedUserIds.includes(props.currentUser.id) && t.status === 'pending' && !(t.viewedByUserIds || []).includes(props.currentUser.id)));

    return (
      <button onClick={() => handleNavClick(tab)} className={`flex items-center justify-between w-full text-left px-3 py-3 rounded-xl transition-all duration-300 text-sm font-bold ${activeTab === tab ? 'bg-neon text-black shadow-lg scale-105' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
        <div className="flex items-center space-x-3">
          <Icon size={18} strokeWidth={2.5} /> <span>{label}</span>
        </div>
        {hasNotification && (
          <span className={`w-2 h-2 rounded-full ${activeTab === tab ? 'bg-black' : 'bg-neon animate-pulse'} shadow-[0_0_8px_rgba(0,255,157,0.5)]`}></span>
        )}
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-b border-white/5 z-[60] flex items-center justify-between px-4">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white hover:text-neon"><Menu size={24} /></button>
          {props.siteConfig.logoUrl && <img src={props.siteConfig.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />}
          <div className="flex items-center gap-2">
            <NotificationCenter
              currentUser={props.currentUser}
              chatMessages={props.chatMessages}
              tasks={props.tasks}
              users={props.users}
              onOpenAdminTab={(tab, targetId) => {
                setActiveTab(tab as AdminTab);
                if (targetId) {
                  // We need to pass this down somehow if we want to highlight
                  // For now, we just switch the tab. 
                  // In a real app, we might use a context or a more complex state.
                }
              }}
              setView={() => {}} // Already in Admin
            />
            <button onClick={props.onExit} className="p-2 text-red-500"><LogOut size={20} /></button>
          </div>
      </div>

      {/* Desktop Top Bar (New) */}
      <div className="hidden lg:flex fixed top-0 right-0 left-64 h-16 bg-black/50 backdrop-blur-md border-b border-white/5 z-30 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 italic">
              A1TOQUE <span className="text-neon">ADMIN</span> // {TABS_CONFIG.find(t => t.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <NotificationCenter
              currentUser={props.currentUser}
              chatMessages={props.chatMessages}
              tasks={props.tasks}
              users={props.users}
              onOpenAdminTab={(tab, targetId) => {
                setActiveTab(tab as AdminTab);
                // Note: initialTargetId is handled via props in AdminPanel, 
                // but here we are already mounted. 
                // We might need to manually trigger the highlight logic in tabs.
                // For now, let's just switch the tab.
              }}
              setView={() => {}}
            />
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <div className="text-right">
                <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{props.currentUser.name}</p>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{props.currentUserRole.name}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-neon/20 border border-neon/30 flex items-center justify-center text-[10px] font-black text-neon">
                {props.currentUser.name.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsSidebarOpen(false)}/>}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0a0a0a] border-r border-white/5 p-5 flex flex-col z-[110] transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:z-40`}>
        <div className="mb-10 flex justify-between items-center">
          {props.siteConfig.logoUrl && <img src={props.siteConfig.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />}
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-500"><X size={20} /></button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">{availableTabs.map(tab => (<NavButton key={tab.id} tab={tab.id as AdminTab} icon={tab.icon} label={tab.label} />))}</div>
        <div className="space-y-2 border-t border-white/10 pt-6 mt-4"><NavButton tab="profile" icon={UserIcon} label="Mi Perfil" /><button onClick={props.onExit} className="flex items-center space-x-3 w-full text-left px-3 py-3 rounded-xl transition-all text-sm font-bold text-red-400 hover:bg-red-500/10"> <LogOut size={18} /> <span>Salir del Panel</span></button></div>
      </aside>
      <main className="flex-1 p-4 md:p-8 bg-black lg:ml-64 pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'home' && (
            <HomeTab 
              currentUser={props.currentUser}
              currentUserRole={props.currentUserRole}
              siteConfig={props.siteConfig}
              tasks={props.tasks}
              chatMessages={props.chatMessages}
              users={props.users}
              onOpenTasks={() => setActiveTab('tasks')}
              onUpdateUser={props.onUpdateUser}
              onOpenAdminTab={(tab) => setActiveTab(tab as AdminTab)}
            />
          )}
          {activeTab === 'news' && (
            <ContentTab 
              {...props} 
              onOpenEditor={handleOpenArticleEditor} 
              onOpenSocialCreator={handleOpenSocialCreator} 
              onViewArticle={props.onViewArticle}
              generationQueue={generationQueue}
              onGenerateFromUrl={handleGenerateFromUrl}
              onGenerateFromTopic={handleGenerateFromTopic}
              onOpenSources={handleOpenSourcesModal}
              onLoadDraft={handleLoadDraftInEditor}
              onSaveDraft={handleSaveDraftFromTask}
              onRemoveTask={props.onDeleteAiNewsTask}
            />
          )}
          {activeTab === 'social' && <SocialMediaTab {...props} onOpenCreator={handleOpenSocialCreator} onOpenDetail={handleOpenSocialPostDetail} onOpenEditor={handleOpenSocialEditor} onDeletePost={props.onDeleteSocialPost} socialAccountMap={socialAccountMap} socialGenerationQueue={socialGenerationQueue} onGenerateSocialFromTopic={handleGenerateSocialFromTopic} onLoadSocialDraft={handleLoadSocialDraft} onRemoveSocialTask={props.onDeleteAiSocialTask} />}
          {activeTab === 'ads' && <AdsTab {...props} brandMap={brandMap} onOpenBrandEditor={handleOpenBrandEditor} onOpenSponsorshipEditor={handleOpenSponsorshipEditor} onOpenAdSlotEditor={handleOpenAdSlotEditor} />}
          {activeTab === 'users' && <UsersTab {...props} onOpenEditor={handleOpenUserEditor} rolesMap={rolesMap} />}
          {activeTab === 'metrics' && <MetricsTab {...props} brands={props.brands} brandMap={brandMap} socialAccountMap={socialAccountMap} onOpenDetail={handleOpenSocialPostDetail} />}
          {activeTab === 'config' && <ConfigTab {...props} onOpenSocialAccountEditor={handleOpenSocialAccountEditor} />}
          {activeTab === 'profile' && <ProfileTab {...props} />}
          {activeTab === 'permissions' && <PermissionsTab {...props} />}
          {activeTab === 'tasks' && (
            <TasksTab 
              tasks={props.tasks} 
              currentUser={props.currentUser} 
              currentUserRole={props.currentUserRole}
              socialAccounts={props.socialAccounts} 
              onAddTask={props.onAddTask}
              onUpdateTask={props.onUpdateTask} 
              onDeleteTask={props.onDeleteTask}
              onMarkAsViewed={props.onMarkTaskAsViewed} 
              onOpenArticleEditor={() => handleOpenArticleEditor()}
              onOpenSocialCreator={() => handleOpenSocialCreator()}
              initialTargetId={props.initialTargetId} 
            />
          )}
          {activeTab === 'admin_tasks' && <AdminTasksTab tasks={props.tasks} users={props.users} socialAccounts={props.socialAccounts} onAddTask={props.onAddTask} onUpdateTask={props.onUpdateTask} onDeleteTask={props.onDeleteTask} onUpdateUser={props.onUpdateUser} />}
          {activeTab === 'chat' && <ChatTab chatMessages={props.chatMessages} currentUser={props.currentUser} users={props.users} onAddChatMessage={props.onAddChatMessage} onMarkAsRead={props.onMarkChatAsRead} initialTargetId={props.initialTargetId} />}
        </div>
      </main>
      {isArticleEditorOpen && ( <ArticleEditor article={editingArticle} users={props.users} currentUser={props.currentUser} categories={props.categories} onClose={() => { setIsArticleEditorOpen(false); setNewsTaskBeingEdited(null); }} onSave={handleSaveArticleFromEditor}/>)}
      {isSocialPostCreatorOpen && ( <SocialPostCreator key={editingSocialPost?.id || articleForSocial?.id || 'new'} article={articleForSocial} accountId={selectedAccountIdForCreator} preGeneratedContent={preGeneratedSocialContent} skipGeneration={!!preGeneratedSocialContent} draftPost={editingSocialPost} currentUser={props.currentUser} brands={props.brands} socialAccounts={props.socialAccounts} aiSystemPrompt={props.aiSystemPrompt} siteConfig={props.siteConfig} onClose={() => { setIsSocialPostCreatorOpen(false); setArticleForSocial(null); setSelectedAccountIdForCreator(undefined); setPreGeneratedSocialContent(null); setEditingSocialPost(null); setSocialTaskBeingEdited(null); }} onAddSocialPost={async (post) => { await props.onAddSocialPost(post); if (socialTaskBeingEdited) await props.onDeleteAiSocialTask(socialTaskBeingEdited); }} onUpdateSocialPost={async (post) => { await props.onUpdateSocialPost(post); if (socialTaskBeingEdited) await props.onDeleteAiSocialTask(socialTaskBeingEdited); }} users={props.users} articles={props.articles}/>)}
      {isGeneratingSocial && (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center">
            <div className="text-white text-center">
                <Loader2 size={48} className="animate-spin mx-auto mb-4" />
                <p>Generando copy...</p>
            </div>
        </div>
      )}
      {isUserEditorOpen && ( <UserEditorModal user={editingUser} roles={props.roles} socialAccounts={props.socialAccounts} onClose={() => setIsUserEditorOpen(false)} onSave={editingUser ? props.onUpdateUser : props.onAddUser}/>)}
      {isBrandEditorOpen && ( <BrandEditorModal brand={editingBrand} onClose={() => setIsBrandEditorOpen(false)} onSave={editingBrand ? props.onUpdateBrand : props.onAddBrand}/>)}
      {isSponsorshipEditorOpen && ( <SponsorshipEditorModal sponsorship={editingSponsorship} brands={props.brands} adSlots={props.adSlots} onClose={() => setIsSponsorshipEditorOpen(false)} onSave={editingSponsorship?.id ? props.onUpdateSponsorship as any : props.onAddSponsorship as any}/>)}
      {isSocialAccountEditorOpen && ( <SocialAccountEditorModal account={editingSocialAccount} onClose={() => setIsSocialAccountEditorOpen(false)} onSave={editingSocialAccount ? props.onUpdateSocialAccount : props.onAddSocialAccount}/>)}
      {isSourcesModalOpen && ( <SourcesModal sources={sourcesToShow} onClose={() => setIsSourcesModalOpen(false)}/>)}
      {isSocialPostDetailOpen && selectedSocialPost && ( <SocialPostDetailModal post={selectedSocialPost} onClose={() => setIsSocialPostDetailOpen(false)} socialAccountMap={socialAccountMap} brandMap={brandMap}/>)}
      {editingAdSlot && <AdSlotEditorModal slot={editingAdSlot} onClose={() => setEditingAdSlot(null)} onSave={props.onUpdateAdSlot} />}
    </div>
  );
};