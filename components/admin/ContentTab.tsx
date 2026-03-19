import React, { useState } from 'react';
import { Article, User, CategoryConfig, GenerationTask, Source, SiteConfig, SocialAccount } from '../../types';
import { NewsTab } from './NewsTab';
import { ResearchTab } from './ResearchTab';
import { FileText, BrainCircuit, Edit3, Archive } from 'lucide-react';

interface ContentTabProps {
  articles: Article[];
  users: User[];
  categories: CategoryConfig[];
  onOpenEditor: (article?: Article) => void;
  onOpenSocialCreator: (article: Article, accountId: string) => void;
  onDeleteArticle: (id: string) => void;
  onToggleArticleStatus: (id: string) => void;
  onViewArticle: (id: string) => void;
  
  generationQueue: GenerationTask[];
  socialAccounts: SocialAccount[];
  aiSystemPrompt: string;
  siteConfig: SiteConfig;
  onGenerateFromUrl: (url: string, systemPrompt: string) => void;
  onGenerateFromTopic: (topic: string, systemPrompt: string) => void;
  onOpenSources: (sources: Source[]) => void;
  onLoadDraft: (task: GenerationTask) => void;
  onSaveDraft: (task: GenerationTask) => void;
  onRemoveTask: (id: string) => void;
}

export const ContentTab: React.FC<ContentTabProps> = (props) => {
  const [activeSubTab, setActiveSubTab] = useState<'published' | 'drafts' | 'write'>('published');

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 md:px-0">
      {/* Header Superior */}
      <div className="sticky top-16 lg:top-16 z-40 bg-black pt-4 pb-6 mb-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-oswald font-black italic uppercase text-white tracking-tighter flex items-center gap-3">
            {activeSubTab === 'published' && <><FileText className="text-neon" size={32} /> NOTICIAS</>}
            {activeSubTab === 'drafts' && <><Archive className="text-neon" size={32} /> BORRADORES</>}
            {activeSubTab === 'write' && <><Edit3 className="text-neon" size={32} /> REDACTAR NOTICIA</>}
          </h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            {activeSubTab === 'published' && 'Control editorial y distribución'}
            {activeSubTab === 'drafts' && 'Noticias en proceso o archivadas'}
            {activeSubTab === 'write' && 'Motor de generación de contenido asistido y redacción manual'}
          </p>
        </div>
        
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 self-stretch md:self-auto overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveSubTab('published')}
            className={`flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all ${activeSubTab === 'published' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
          >
            <FileText size={14} /> NOTICIAS
          </button>
          <button 
            onClick={() => setActiveSubTab('drafts')}
            className={`flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all ${activeSubTab === 'drafts' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
          >
            <Archive size={14} /> BORRADORES
          </button>
          <button 
            onClick={() => setActiveSubTab('write')}
            className={`flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all ${activeSubTab === 'write' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
          >
            <Edit3 size={14} /> REDACTAR NOTICIA
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeSubTab === 'published' && (
          <NewsTab 
            {...props}
            forcedFilterStatus="Published"
            hideHeader={true}
          />
        )}
        {activeSubTab === 'drafts' && (
          <NewsTab 
            {...props}
            forcedFilterStatus="Draft"
            hideHeader={true}
          />
        )}
        {activeSubTab === 'write' && (
          <ResearchTab 
            generationQueue={props.generationQueue}
            socialAccounts={props.socialAccounts}
            aiSystemPrompt={props.aiSystemPrompt}
            siteConfig={props.siteConfig}
            onGenerateFromUrl={props.onGenerateFromUrl}
            onGenerateFromTopic={props.onGenerateFromTopic}
            onOpenSources={props.onOpenSources}
            onLoadDraft={props.onLoadDraft}
            onSaveDraft={props.onSaveDraft}
            onRemoveTask={props.onRemoveTask}
            onOpenEditor={props.onOpenEditor}
          />
        )}
      </div>
    </div>
  );
};
