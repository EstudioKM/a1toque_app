import React, { useState, useRef, useEffect } from 'react';
import { Save, RotateCcw, CheckCircle2, Plus, Edit3, Trash2, Twitter, Instagram, Facebook, Eye, EyeOff, GripVertical, Image as ImageIcon, UploadCloud, Loader2, AtSign, Sparkles, MessageSquare, ShoppingBag, Settings, MonitorPlay } from 'lucide-react';
import { DEFAULT_AI_PROMPT } from '../../constants';
import { SocialAccount, CategoryConfig, SiteConfig } from '../../types';
import { storage } from '../../services/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

interface ConfigTabProps {
  aiSystemPrompt: string;
  onUpdateAiSystemPrompt: (prompt: string) => void;
  socialAccounts: SocialAccount[];
  onOpenSocialAccountEditor: (account?: SocialAccount) => void;
  onDeleteSocialAccount: (id: string) => void;
  categories: CategoryConfig[];
  onAddCategory: (category: Omit<CategoryConfig, 'id' | 'order'>) => void;
  onUpdateCategory: (category: CategoryConfig) => void;
  onUpdateCategoriesOrder: (categories: CategoryConfig[]) => void;
  onDeleteCategory: (id: string) => void;
  siteConfig: SiteConfig;
  onUpdateSiteConfig: (config: SiteConfig) => void;
}

export const ConfigTab: React.FC<ConfigTabProps> = ({ 
  aiSystemPrompt, 
  onUpdateAiSystemPrompt,
  socialAccounts,
  onOpenSocialAccountEditor,
  onDeleteSocialAccount,
  categories,
  onAddCategory,
  onUpdateCategory,
  onUpdateCategoriesOrder,
  onDeleteCategory,
  siteConfig,
  onUpdateSiteConfig
}) => {
  const [localAiPrompt, setLocalAiPrompt] = useState(aiSystemPrompt);
  const [promptSaved, setPromptSaved] = useState(false);
  
  const [localSiteConfig, setLocalSiteConfig] = useState<SiteConfig>(siteConfig);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'club' | 'section'>('club');

  const [localCategories, setLocalCategories] = useState(categories);
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    setLocalCategories(categories);
    setLocalSiteConfig(siteConfig);
    if (categories.length > 0 && siteConfig) {
      isInitialized.current = true;
    }
  }, [categories, siteConfig]);

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    const newCategories = [...localCategories];
    const dragItemContent = newCategories.find(c => c.id === dragItem.current);
    if (!dragItemContent) return;
    const dragItemIndex = newCategories.findIndex(c => c.id === dragItem.current);
    const dragOverItemIndex = newCategories.findIndex(c => c.id === dragOverItem.current);
    newCategories.splice(dragItemIndex, 1);
    newCategories.splice(dragOverItemIndex, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setLocalCategories(newCategories);
    onUpdateCategoriesOrder(newCategories);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() === '') return;
    onAddCategory({ name: newCategoryName, type: newCategoryType, visible: true });
    setNewCategoryName('');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setLocalSiteConfig({...localSiteConfig, logoUrl: reader.result as string});
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSiteConfig = async () => {
    let logoUrl = localSiteConfig.logoUrl;
    if (logoFile) {
        setIsUploadingLogo(true);
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(logoFile);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
            const storageRef = ref(storage, `site/logo-${Date.now()}.png`);
            const snapshot = await uploadString(storageRef, base64, 'data_url');
            logoUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Logo upload error:", error);
            setIsUploadingLogo(false);
            return;
        } finally {
            setIsUploadingLogo(false);
        }
    }
    onUpdateSiteConfig({...localSiteConfig, logoUrl});
    setLogoFile(null);
  };

  return (
    <div className="pb-24 px-4 md:px-0">
      <div className="sticky top-16 lg:top-20 z-40 bg-black/95 backdrop-blur-md pt-1 md:pt-2 pb-2 md:pb-4 mb-2 md:mb-4 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div>
          <h2 className="text-xl md:text-3xl font-oswald font-black italic uppercase text-white tracking-tighter flex items-center gap-2 md:gap-3">
            <Settings className="text-neon w-5 h-5 md:w-7 md:h-7" /> CONFIGURACIÓN
          </h2>
          <p className="hidden md:block text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">Ajustes generales y personalización del sitio</p>
        </div>

        <button 
          onClick={handleSaveSiteConfig}
          className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-neon text-black text-[10px] md:text-[11px] font-black uppercase italic tracking-widest rounded-lg md:rounded-xl hover:scale-105 transition-all shadow-[0_10px_40px_rgba(0,255,157,0.3)]"
        >
          <Save size={16} /> GUARDAR CAMBIOS
        </button>
      </div>

      <div className="pt-2 md:pt-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* 1. IDENTIDAD VISUAL */}
      <div>
        <h2 className="text-xl md:text-2xl font-oswald font-black italic uppercase text-white mb-2 md:mb-4 tracking-tighter">CONFIGURACIÓN GENERAL</h2>
        <div className="bg-white/5 p-4 md:p-6 rounded-2xl border border-white/10 max-w-5xl space-y-6 shadow-2xl">
            <h3 className="text-base md:text-lg font-oswald font-black italic uppercase text-neon flex items-center gap-3 drop-shadow-[0_0_8px_rgba(0,255,157,0.4)]">
              <ImageIcon size={18} /> Identidad de Marca
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4 flex flex-col items-center">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block text-center">Logo Principal</label>
                    <div className="w-full aspect-square max-w-[200px] bg-black border-2 border-dashed border-white/10 rounded-3xl flex items-center justify-center p-6 relative group overflow-hidden shadow-inner">
                        {isUploadingLogo ? (
                            <Loader2 className="animate-spin text-neon" />
                        ) : (
                            <>
                                {localSiteConfig.logoUrl && (
                                    <img src={localSiteConfig.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                )}
                                <button 
                                  onClick={() => logoInputRef.current?.click()}
                                  className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                >
                                    <UploadCloud size={32} className="text-neon mb-2" />
                                    <span className="text-[9px] font-black uppercase">Cambiar</span>
                                </button>
                            </>
                        )}
                    </div>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} hidden accept="image/png, image/svg+xml, image/webp" />
                </div>
                <div className="md:col-span-8 space-y-3">
                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block pl-1">Nombre de la Plataforma</label>
                        <input 
                            type="text" 
                            value={localSiteConfig.siteName || ''}
                            onChange={e => setLocalSiteConfig({...localSiteConfig, siteName: e.target.value})}
                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold focus:border-neon outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block pl-1">Resumen Footer</label>
                        <textarea 
                            rows={2}
                            value={localSiteConfig.footerText || ''}
                            onChange={e => setLocalSiteConfig({...localSiteConfig, footerText: e.target.value})}
                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-gray-300 text-xs focus:border-neon outline-none resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block pl-1">Comunicado para el Equipo (Inicio)</label>
                        <textarea 
                            rows={3}
                            value={localSiteConfig.adminMessage || ''}
                            onChange={e => setLocalSiteConfig({...localSiteConfig, adminMessage: e.target.value})}
                            placeholder="Escribe un mensaje o instrucción para que el equipo vea al iniciar sesión..."
                            className="w-full bg-black border border-white/10 rounded-2xl p-4 text-gray-300 text-sm focus:border-neon outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block pl-1">Dominios de Búsqueda IA (Fuentes de Verdad)</label>
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 p-4 bg-black border border-white/10 rounded-2xl min-h-[60px]">
                                {(localSiteConfig.searchDomains || []).map((domain, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 group">
                                        <span className="text-[10px] font-bold text-gray-300">{domain}</span>
                                        <button 
                                            onClick={() => {
                                                const domains = (localSiteConfig.searchDomains || []).filter((_, i) => i !== idx);
                                                setLocalSiteConfig({...localSiteConfig, searchDomains: domains});
                                            }}
                                            className="text-gray-600 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                {(!localSiteConfig.searchDomains || localSiteConfig.searchDomains.length === 0) && (
                                    <span className="text-[10px] text-gray-600 font-bold uppercase italic tracking-widest py-1.5">No hay dominios configurados (Búsqueda abierta)</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="ej: tycsports.com"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = (e.target as HTMLInputElement).value.trim();
                                            if (val && !(localSiteConfig.searchDomains || []).includes(val)) {
                                                setLocalSiteConfig({...localSiteConfig, searchDomains: [...(localSiteConfig.searchDomains || []), val]});
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }
                                    }}
                                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon outline-none"
                                />
                                <button 
                                    onClick={(e) => {
                                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                                        const val = input.value.trim();
                                        if (val && !(localSiteConfig.searchDomains || []).includes(val)) {
                                            setLocalSiteConfig({...localSiteConfig, searchDomains: [...(localSiteConfig.searchDomains || []), val]});
                                            input.value = '';
                                        }
                                    }}
                                    className="px-4 bg-white/5 text-gray-400 hover:text-neon rounded-xl border border-white/10 transition-all"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Configuración de Transmisión en Vivo */}
            <div className="border-t border-white/10 pt-10">
                 <h3 className="text-xl font-oswald font-black italic uppercase text-neon flex items-center gap-3 mb-6">
                    <MonitorPlay size={20} /> Transmisión en Vivo
                </h3>
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1">Estado de la Transmisión</h4>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Activa o desactiva el widget en la página principal</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={localSiteConfig.isLiveActive || false}
                                onChange={(e) => setLocalSiteConfig({...localSiteConfig, isLiveActive: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            URL del Video de YouTube (Embed o Link normal)
                        </label>
                        <input 
                            type="text" 
                            value={localSiteConfig.liveVideoUrl || ''} 
                            onChange={e => setLocalSiteConfig({...localSiteConfig, liveVideoUrl: e.target.value})} 
                            placeholder="Ej: https://www.youtube.com/watch?v=ZU8HzVNpYR0 o https://www.youtube.com/embed/ZU8HzVNpYR0" 
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon outline-none transition-colors" 
                        />
                        <p className="text-[9px] text-gray-500 mt-2">
                            Puedes pegar el link normal del video o la URL de embed. El sistema lo adaptará automáticamente.
                        </p>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10 pt-10 mt-10">
                 <h3 className="text-xl font-oswald font-black italic uppercase text-neon flex items-center gap-3 mb-6">
                    <ShoppingBag size={20} /> Configuración de Anuncios
                </h3>
                <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block pl-1">Frecuencia de Anuncios en Home</label>
                    <div className="flex items-center gap-3 bg-black border border-white/10 rounded-2xl p-4">
                        <span className="text-sm text-gray-400 font-bold">Mostrar banner intermedio cada</span>
                        <input 
                            type="number" 
                            min="1"
                            value={localSiteConfig.homeAdInterval || 4}
                            onChange={e => setLocalSiteConfig({...localSiteConfig, homeAdInterval: parseInt(e.target.value, 10) || 1})}
                            className="w-20 bg-white/5 border border-white/10 rounded-lg p-2 text-white font-bold text-center focus:border-neon outline-none"
                        />
                        <span className="text-sm text-gray-400 font-bold">noticias.</span>
                    </div>
                </div>
            </div>
             <button onClick={handleSaveSiteConfig} className="w-full py-5 bg-neon text-black font-black uppercase italic text-xs tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,255,157,0.2)] flex items-center justify-center gap-3">
                <Save size={18}/> GUARDAR CONFIGURACIÓN GENERAL
            </button>
        </div>
      </div>

      {/* 2. PERSONALIDADES DE REDES SOCIALES (NUEVA SECCIÓN MEJORADA) */}
      <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-3xl font-oswald font-black italic uppercase text-white tracking-tighter">PERSONALIDADES POR RED</h2>
                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Configura prompts específicos para cada cuenta social</p>
            </div>
            <button 
                onClick={() => onOpenSocialAccountEditor()} 
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase italic tracking-widest rounded-xl hover:bg-neon hover:text-black transition-all"
            >
                <Plus size={16} /> AÑADIR CUENTA
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {socialAccounts.map(account => (
                <div key={account.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 group hover:border-neon/30 transition-all duration-500">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            {account.profileImageUrl && (
                                <img src={account.profileImageUrl} alt={account.name} className="w-14 h-14 rounded-2xl border border-white/10 shadow-xl" />
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-black p-1 rounded-lg border border-white/10">
                                {account.platform === 'instagram' && <Instagram size={12} className="text-pink-500" />}
                                {account.platform === 'twitter' && <Twitter size={12} className="text-blue-400" />}
                                {account.platform === 'facebook' && <Facebook size={12} className="text-blue-600" />}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-white font-black uppercase text-sm truncate tracking-tight">{account.name}</h4>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{account.handle}</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                <Sparkles size={14} className={account.systemPrompt ? 'text-neon' : 'text-gray-700'} />
                                Personalidad IA
                            </div>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded ${account.systemPrompt ? 'bg-neon/10 text-neon' : 'bg-gray-800 text-gray-600'}`}>
                                {account.systemPrompt ? 'DEFINIDA' : 'POR DEFECTO'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                <MessageSquare size={14} className={account.copyPrompt ? 'text-neon' : 'text-gray-700'} />
                                Estilo de Copy
                            </div>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded ${account.copyPrompt ? 'bg-neon/10 text-neon' : 'bg-gray-800 text-gray-600'}`}>
                                {account.copyPrompt ? 'CUSTOM' : 'ESTÁNDAR'}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => onOpenSocialAccountEditor(account)} 
                            className="flex-1 py-3 bg-white/5 border border-white/5 text-gray-300 text-[10px] font-black uppercase italic tracking-widest rounded-xl hover:bg-white/10 hover:text-white transition-all"
                        >
                            CONFIGURAR CUENTA
                        </button>
                        <button 
                            onClick={() => onDeleteSocialAccount(account.id)} 
                            className="w-11 flex items-center justify-center bg-red-500/5 text-red-500/30 hover:bg-red-500 hover:text-white transition-all rounded-xl border border-red-500/10"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 3. PROMPT CENTRAL */}
        <div className="lg:col-span-7 bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col shadow-2xl">
          <h3 className="text-xl font-oswald font-black italic uppercase text-neon mb-4 flex items-center gap-3">
             <AtSign size={20} /> Redacción IA Central
          </h3>
          <p className="text-[10px] text-gray-400 mb-8 font-black uppercase tracking-widest leading-relaxed">
            Instrucción base de periodismo para todos los borradores del portal.
          </p>
          <textarea
            value={localAiPrompt || ''}
            onChange={(e) => { setLocalAiPrompt(e.target.value); setPromptSaved(false); }}
            rows={12}
            className="w-full flex-1 bg-black border border-white/10 rounded-2xl p-6 text-xs text-gray-300 font-mono focus:border-neon outline-none leading-relaxed shadow-inner"
          />
          <div className="mt-8 flex justify-end items-center gap-4">
            {promptSaved && <span className="text-[10px] text-green-400 font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={16} /> Guardado</span>}
            <button
              onClick={() => { onUpdateAiSystemPrompt(localAiPrompt); setPromptSaved(true); }}
              className="px-8 py-4 bg-neon text-black text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition shadow-lg flex items-center gap-2"
              disabled={localAiPrompt === aiSystemPrompt}
            >
              <Save size={18} /> ACTUALIZAR PROMPT GLOBAL
            </button>
            <button
              onClick={() => setLocalAiPrompt(DEFAULT_AI_PROMPT)}
              className="px-5 py-4 bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 hover:text-white transition"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* 4. ARQUITECTURA DE CONTENIDOS */}
        <div className="lg:col-span-5 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-2xl">
          <h3 className="text-xl font-oswald font-black italic uppercase text-neon mb-4 flex items-center gap-3">
              <GripVertical size={20} /> Arquitectura
          </h3>
          <p className="text-[10px] text-gray-400 mb-8 font-black uppercase tracking-widest">
            Orden y visibilidad de secciones en el menú.
          </p>
          <div className="space-y-3 max-h-[550px] overflow-y-auto custom-scrollbar pr-4">
              {localCategories.map(category => (
                  <div 
                      key={category.id} 
                      className="bg-black/40 p-4 rounded-2xl flex items-center justify-between group border border-white/5 hover:border-white/10 transition-colors"
                      draggable
                      onDragStart={() => dragItem.current = category.id}
                      onDragEnter={() => dragOverItem.current = category.id}
                      onDragEnd={handleDragEnd}
                      onDragOver={e => e.preventDefault()}
                  >
                      <div className="flex items-center gap-4 min-w-0">
                          <GripVertical size={16} className="text-gray-700 cursor-grab active:cursor-grabbing flex-shrink-0" />
                          <span className={`px-2 py-0.5 text-[7px] font-black rounded-sm uppercase flex-shrink-0 ${category.type === 'club' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>{category.type}</span>
                          <input 
                              type="text"
                              value={category.name || ''}
                              onChange={(e) => {
                                  const cat = categories.find(c => c.id === category.id);
                                  if(cat) onUpdateCategory({...cat, name: e.target.value});
                              }}
                              className="bg-transparent text-white font-bold text-sm focus:text-neon outline-none truncate"
                          />
                      </div>
                      <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => onUpdateCategory({ ...category, visible: !category.visible })} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-gray-400">
                           {category.visible ? <Eye size={14} /> : <EyeOff size={14}/>}
                         </button>
                         <button onClick={() => onDeleteCategory(category.id)} className="w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400">
                             <Trash2 size={14} />
                         </button>
                      </div>
                  </div>
              ))}
              <div className="p-5 bg-neon/5 border border-dashed border-neon/30 rounded-2xl flex flex-col gap-3 mt-6">
                  <div className="flex gap-2">
                    <input 
                        type="text"
                        value={newCategoryName || ''}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="Nombre..."
                        className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-neon"
                    />
                    <select value={newCategoryType} onChange={e => setNewCategoryType(e.target.value as 'club' | 'section')} className="bg-black text-white text-[9px] font-black uppercase px-2 border border-white/10 rounded-xl">
                        <option value="club">Club</option>
                        <option value="section">Sección</option>
                    </select>
                  </div>
                  <button onClick={handleAddCategory} className="w-full py-3 bg-neon text-black text-[10px] font-black uppercase italic tracking-widest rounded-xl shadow-lg">
                      AÑADIR SECCIÓN
                  </button>
              </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
