import React, { useState } from 'react';
import { GenerationTask, SocialAccount, Source, SiteConfig } from '../../types';
import { Loader2, CheckCircle2, AlertTriangle, Globe, FileSignature, Save, Sparkles, Search, Zap, ArrowRight } from 'lucide-react';

interface ResearchTabProps {
  generationQueue: GenerationTask[];
  socialAccounts: SocialAccount[];
  aiSystemPrompt: string;
  siteConfig: SiteConfig;
  onGenerateFromUrl: (url: string, systemPrompt: string) => void;
  onGenerateFromTopic: (topic: string, systemPrompt: string) => void;
  onOpenSources: (sources: Source[]) => void;
  onLoadDraft: (task: GenerationTask) => void;
  onSaveDraft: (task: GenerationTask) => void;
}

export const ResearchTab: React.FC<ResearchTabProps> = ({ 
  generationQueue,
  socialAccounts,
  aiSystemPrompt,
  siteConfig,
  onGenerateFromUrl,
  onGenerateFromTopic,
  onOpenSources,
  onLoadDraft,
  onSaveDraft
}) => {
  const [generationQuery, setGenerationQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('global');

  const handleGenerate = () => {
    if (!generationQuery) return;
    
    let systemPromptToUse = aiSystemPrompt;
    if (selectedAccountId !== 'global') {
        const selectedAccount = socialAccounts.find(acc => acc.id === selectedAccountId);
        if (selectedAccount?.systemPrompt) {
            systemPromptToUse = selectedAccount.systemPrompt;
        }
    }

    if (generationQuery.startsWith('http')) {
      onGenerateFromUrl(generationQuery, systemPromptToUse);
    } else {
      onGenerateFromTopic(generationQuery, systemPromptToUse);
    }
    setGenerationQuery('');
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-oswald font-black italic uppercase text-white tracking-tighter flex items-center gap-3">
          <Zap className="text-neon" size={32} /> INVESTIGACIÓN IA
        </h2>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Motor de generación de contenido asistido</p>
      </div>

      <div className="bg-[#0f0f0f] p-6 md:p-8 rounded-[32px] border border-white/5 shadow-2xl mb-12">
        <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-neon/10 rounded-full flex items-center justify-center text-neon">
                <Sparkles size={16} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Generar Borrador</h3>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon transition-colors" size={18} />
            <input 
              type="text" 
              value={generationQuery} 
              onChange={e => setGenerationQuery(e.target.value)} 
              placeholder="Tema o URL de noticia..." 
              className="w-full bg-black border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-neon outline-none transition-all" 
              onKeyDown={(e) => e.key === 'Enter' && !!generationQuery && handleGenerate()}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex flex-col gap-2">
                <select 
                    value={selectedAccountId} 
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-gray-400 focus:border-neon focus:text-white outline-none cursor-pointer"
                >
                    <option value="global">Voz Global A1Toque</option>
                    {socialAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                        Voz: {account.name}
                    </option>
                    ))}
                </select>
                <div className="flex items-center gap-2 px-2">
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Fuentes:</span>
                    <div className="flex flex-wrap gap-1">
                        {(siteConfig.searchDomains || []).slice(0, 4).map((d, i) => (
                            <span key={i} className="text-[7px] font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-gray-500">{d}</span>
                        ))}
                        {(siteConfig.searchDomains || []).length > 4 && (
                            <span className="text-[7px] font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-gray-500">+{siteConfig.searchDomains!.length - 4}</span>
                        )}
                    </div>
                </div>
            </div>
            <button 
                onClick={handleGenerate} 
                disabled={!generationQuery}
                className="w-full md:w-48 h-[48px] bg-neon text-black text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-30 flex items-center justify-center gap-2"
            >
                {generationQuery.startsWith('http') ? 'REVERSIONAR' : 'INVESTIGAR'} <ArrowRight size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-oswald font-black italic uppercase text-white mb-6 px-2">Tareas en Curso</h3>
        <div className="grid grid-cols-1 gap-4">
          {generationQueue.length === 0 ? (
             <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                <Loader2 className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-20" />
                <p className="text-gray-500 font-black uppercase italic text-sm tracking-widest">Cola vacía</p>
            </div>
          ) : (
            generationQueue.map(task => (
                <div key={task.id} className={`bg-white/[0.02] p-5 md:p-6 rounded-3xl border transition-all ${task.status === 'completed' ? 'border-neon/20' : task.status === 'failed' ? 'border-red-500/20' : 'border-white/5 animate-pulse'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${task.status === 'completed' ? 'bg-neon text-black' : task.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                {task.status === 'researching' && <Loader2 size={16} className="animate-spin" />}
                                {task.status === 'completed' && <CheckCircle2 size={16} strokeWidth={3} />}
                                {task.status === 'failed' && <AlertTriangle size={16} />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-white font-bold text-sm truncate md:max-w-md">{task.prompt}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400">{task.status}</span>
                                    {task.result?.sources && (
                                        <button onClick={() => onOpenSources(task.result?.sources || [])} className="text-[9px] text-gray-500 hover:text-neon font-black uppercase flex items-center gap-1 transition-colors">
                                            <Globe size={10} /> {task.result.sources.length} FUENTES
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {task.status === 'completed' && task.result && (
                            <div className="flex gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                                <button onClick={() => onSaveDraft(task)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white/5 text-gray-300 text-[9px] font-black uppercase italic tracking-widest rounded-xl hover:bg-white/10 transition-all"><Save size={14} /> GUARDAR</button>
                                <button onClick={() => onLoadDraft(task)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-neon text-black text-[9px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition-all"><FileSignature size={14} strokeWidth={3} /> EDITAR</button>
                            </div>
                        )}
                    </div>
                </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};