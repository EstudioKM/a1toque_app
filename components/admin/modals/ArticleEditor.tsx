import React, { useState, useRef, useEffect } from 'react';
import { Article, Category, User, ContentBlock, BlockType, Source, CategoryConfig, Role } from '../../../types';
import { Save, X, UploadCloud, Edit3, Loader2, Plus, Type, Heading2, ImageIcon, Quote, Youtube, Instagram, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { storage } from '../../../services/firebase';
import { ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';

interface ArticleEditorProps {
  article: Article | null;
  users: User[];
  roles: Role[];
  currentUser: User;
  categories: CategoryConfig[];
  onClose: () => void;
  onSave: (data: Article | Omit<Article, 'id'>) => void;
}

export const ArticleEditor: React.FC<ArticleEditorProps> = ({ article, users, roles, currentUser, categories, onClose, onSave }) => {
  const [metaData, setMetaData] = useState<Partial<Article>>({ title: '', excerpt: '', category: '', author: '', imageUrl: '', isPremium: false, isPublished: false, isPublinota: false });
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [editingSources, setEditingSources] = useState<Source[] | undefined>(undefined);
  const [errors, setErrors] = useState<string[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isAddBlockMenuOpen, setIsAddBlockMenuOpen] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    
    if (article) {
      const { content, sources, ...meta } = article;
      setMetaData(meta);
      setBlocks(Array.isArray(content) ? content : [{ id: 'text-0', type: 'text', content: content }]);
      setEditingSources(sources);
    } else {
      setMetaData({ 
        title: '', 
        excerpt: '', 
        category: '', 
        imageUrl: '', 
        author: currentUser.id, 
        isPremium: false, 
        isPublished: false, 
        isPublinota: false 
      });
      setBlocks([{ id: `text-${Date.now()}`, type: 'text', content: '' }]);
      setEditingSources(undefined);
    }
    setErrors([]);
    isInitialized.current = true;
  }, [article, currentUser]);

  const handleSaveArticle = () => {
    const newErrors: string[] = [];
    
    // Validaciones de Meta Data
    if (!metaData.title?.trim()) newErrors.push("El titular principal es obligatorio.");
    if (!metaData.excerpt?.trim()) newErrors.push("La bajada o resumen es obligatorio.");
    if (!metaData.category) newErrors.push("Debes seleccionar una categoría.");
    if (!metaData.author) newErrors.push("El autor responsable es obligatorio.");
    if (!metaData.imageUrl?.trim()) newErrors.push("La noticia debe tener una imagen de portada.");

    // Validaciones de Contenido (Cuerpo)
    const hasContent = blocks.some(b => b.content?.trim().length > 0);
    if (blocks.length === 0 || !hasContent) {
        newErrors.push("El cuerpo de la noticia no puede estar vacío.");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      // Hacer scroll al inicio para ver los errores
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const articleData: any = {
      ...metaData,
      content: blocks,
      date: metaData.date || new Date().toISOString().split('T')[0],
      author: metaData.author || currentUser.id,
      sources: editingSources,
    };
    
    // Remove undefined fields to prevent Firestore errors
    Object.keys(articleData).forEach(key => {
      if (articleData[key] === undefined) {
        delete articleData[key];
      }
    });
    
    if (article?.id && !article.id.startsWith('draft-')) {
      onSave({ id: article.id, ...articleData } as Article);
    } else {
      const { id, ...articleWithoutId } = articleData as Article;
      onSave(articleWithoutId);
    }
    onClose();
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      
      const storageRef = ref(storage, `images/${Date.now()}-${file.name}`);
      const snapshot = await uploadString(storageRef, base64, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);
      setMetaData(p => ({ ...p, imageUrl: downloadURL }));
      setErrors(prev => prev.filter(e => e !== "La noticia debe tener una imagen de portada."));
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlProcessing = async () => {
    const url = metaData.imageUrl;
    if (!url || !url.startsWith('http') || url.includes('firebasestorage.googleapis.com')) {
        setUrlError(null);
        return;
    }

    setIsProcessingUrl(true);
    setUrlError(null);
    
    try {
        let response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`).catch(() => null);
        
        if (!response || !response.ok) {
            response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`).catch(() => null);
        }

        if (!response || !response.ok) {
            // Si ambos proxies fallan, usar la URL original directamente
            setMetaData(p => ({ ...p, imageUrl: url }));
            setErrors(prev => prev.filter(e => e !== "La noticia debe tener una imagen de portada."));
            setIsProcessingUrl(false);
            return;
        }
        
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
            throw new Error('El archivo obtenido no es una imagen válida.');
        }

        const storageRef = ref(storage, `images/imported-${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(snapshot.ref);

        setMetaData(p => ({ ...p, imageUrl: downloadURL }));
        setErrors(prev => prev.filter(e => e !== "La noticia debe tener una imagen de portada."));
    } catch (error) {
        console.error("Error al procesar URL de imagen externa:", error);
        // Fallback final: usar la URL original
        setMetaData(p => ({ ...p, imageUrl: url }));
        setErrors(prev => prev.filter(e => e !== "La noticia debe tener una imagen de portada."));
    } finally {
        setIsProcessingUrl(false);
    }
  };

  const handleUpdateBlock = (id: string, newContent: Partial<ContentBlock>) => setBlocks(blocks.map(b => b.id === id ? { ...b, ...newContent } : b));
  
  const handleAddBlock = (type: BlockType) => {
    const newBlock: ContentBlock = { id: `${type}-${Date.now()}`, type, content: '' };
    setBlocks(prev => [...prev, newBlock]);
    setIsAddBlockMenuOpen(false);
  };

  const handleDeleteBlock = (id: string) => setBlocks(blocks.filter(b => b.id !== id));
  
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    const newBlocks = [...blocks];
    const dragItemIndex = newBlocks.findIndex(b => b.id === dragItem.current);
    const dragOverItemIndex = newBlocks.findIndex(b => b.id === dragOverItem.current);
    const [removed] = newBlocks.splice(dragItemIndex, 1);
    newBlocks.splice(dragOverItemIndex, 0, removed);
    dragItem.current = null;
    dragOverItem.current = null;
    setBlocks(newBlocks);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-4 lg:p-6 overflow-hidden">
      <div className="w-full max-w-6xl h-[95vh] flex flex-col bg-[#080808] md:rounded-2xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header - Fixed Height */}
        <div className="h-16 px-6 md:px-8 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-black/50 backdrop-blur-md">
            <div>
                <h2 className="text-lg md:text-2xl font-oswald font-black italic uppercase text-white tracking-tighter leading-none">
                    {article && !article.id.startsWith('draft-') ? 'EDITAR NOTICIA' : 'NUEVA NOTICIA'}
                </h2>
                <p className="text-[9px] text-neon font-black uppercase tracking-[0.3em] mt-1 opacity-60">Redacción A1TOQUE v5</p>
            </div>
            <div className="flex items-center gap-4">
                {errors.length > 0 && (
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                    <AlertCircle size={14} /> Faltan campos obligatorios
                  </div>
                )}
                <button 
                    onClick={onClose} 
                    className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-full transition-all border border-white/5"
                >
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Content Area - Scrollable */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto px-6 md:px-8 py-6">
            {errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-2">
                    <p className="text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                        <AlertCircle size={14} /> Corregir para continuar:
                    </p>
                    {errors.map((err, i) => (
                        <p key={i} className="text-red-300/70 text-[10px] font-bold uppercase tracking-wide">• {err}</p>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Columna Principal - Redacción */}
              <div className="lg:col-span-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neon uppercase tracking-[0.4em] block pl-1">TITULAR PRINCIPAL *</label>
                  <input 
                    type="text" 
                    value={metaData.title || ''} 
                    onChange={e => setMetaData(p => ({ ...p, title: e.target.value }))} 
                    className={`w-full bg-white/[0.03] border-2 rounded-xl p-4 text-xl md:text-2xl font-oswald font-bold text-white focus:border-neon focus:bg-black outline-none transition-all placeholder:text-gray-700 ${!metaData.title?.trim() && errors.length > 0 ? 'border-red-500/50' : 'border-white/10'}`} 
                    placeholder="Escribe el título aquí..." 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neon uppercase tracking-[0.4em] block pl-1">BAJADA / RESUMEN *</label>
                  <textarea 
                    value={metaData.excerpt || ''} 
                    onChange={e => setMetaData(p => ({ ...p, excerpt: e.target.value }))} 
                    rows={2} 
                    className={`w-full bg-white/[0.03] border-2 rounded-xl p-4 text-sm text-gray-300 focus:border-neon focus:bg-black outline-none leading-relaxed transition-all placeholder:text-gray-700 ${!metaData.excerpt?.trim() && errors.length > 0 ? 'border-red-500/50' : 'border-white/10'}`} 
                    placeholder="Un breve resumen que enganche al lector..." 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neon uppercase tracking-[0.4em] block pl-1">CUERPO EDITORIAL *</label>
                  <div className={`bg-white/[0.02] p-4 rounded-2xl border-2 space-y-4 transition-colors ${errors.some(e => e.includes("cuerpo")) ? 'border-red-500/30' : 'border-white/5'}`}>
                    {blocks.map((block) => (
                      <div 
                        key={block.id} 
                        draggable 
                        onDragStart={() => dragItem.current = block.id} 
                        onDragEnter={() => dragOverItem.current = block.id} 
                        onDragEnd={handleDragEnd} 
                        onDragOver={e => e.preventDefault()} 
                        className="group relative bg-black/40 p-4 rounded-xl border border-transparent hover:border-white/10 transition-all"
                      >
                        <div className="absolute top-1/2 -left-6 -translate-y-1/2 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing hidden md:block">
                          <GripVertical size={20} className="text-gray-500" />
                        </div>
                        
                        {block.type === 'text' && (
                          <textarea 
                            value={block.content || ''} 
                            onChange={e => handleUpdateBlock(block.id, { content: e.target.value })} 
                            rows={3} 
                            className="w-full bg-transparent p-0 text-gray-300 focus:text-white outline-none leading-relaxed text-sm placeholder:text-gray-800" 
                            placeholder="Escribe el párrafo aquí..." 
                          />
                        )}
                        
                        {block.type === 'heading' && (
                          <input 
                            type="text" 
                            value={block.content || ''} 
                            onChange={e => handleUpdateBlock(block.id, { content: e.target.value })} 
                            className="w-full bg-transparent p-0 text-white font-oswald font-black text-xl md:text-2xl uppercase italic outline-none placeholder:text-gray-800" 
                            placeholder="SUBTÍTULO..." 
                          />
                        )}
                        
                        {block.type === 'quote' && (
                          <div className="border-l-4 border-neon pl-4 py-2 bg-neon/5 rounded-r-xl">
                            <textarea 
                              value={block.content || ''} 
                              onChange={e => handleUpdateBlock(block.id, { content: e.target.value })} 
                              rows={2} 
                              className="w-full bg-transparent p-0 text-white font-oswald italic text-lg outline-none placeholder:text-gray-800" 
                              placeholder="La frase destacada..." 
                            />
                            <input 
                              type="text" 
                              value={block.caption || ''} 
                              onChange={e => handleUpdateBlock(block.id, { caption: e.target.value })} 
                              className="w-full bg-transparent p-0 text-neon text-[9px] font-black uppercase tracking-widest mt-1 outline-none placeholder:text-neon/30" 
                              placeholder="— Autor de la cita" 
                            />
                          </div>
                        )}
                        
                        {block.type === 'image' && (
                          <div className="space-y-4">
                            <input 
                              type="text" 
                              value={block.content || ''} 
                              onChange={e => handleUpdateBlock(block.id, { content: e.target.value })} 
                              className="w-full bg-black/60 p-4 rounded-xl text-blue-400 text-xs border border-white/5 outline-none" 
                              placeholder="Pegar URL de la imagen..." 
                            />
                            <input 
                              type="text" 
                              value={block.caption || ''} 
                              onChange={e => handleUpdateBlock(block.id, { caption: e.target.value })} 
                              className="w-full bg-transparent px-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest outline-none" 
                              placeholder="Epígrafe o pie de foto..." 
                            />
                          </div>
                        )}
                        
                        {block.type === 'youtube' && (
                          <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                            <input 
                              type="text" 
                              value={block.content || ''} 
                              onChange={e => handleUpdateBlock(block.id, { content: e.target.value })} 
                              className="w-full bg-black/60 p-4 rounded-xl text-red-400 text-xs outline-none border border-red-500/10" 
                              placeholder="Pegar URL de video de YouTube..." 
                            />
                          </div>
                        )}
                        
                        {block.type === 'instagram' && (
                          <div className="bg-pink-500/5 p-4 rounded-xl border border-pink-500/20">
                            <input 
                              type="text" 
                              value={block.content || ''} 
                              onChange={e => handleUpdateBlock(block.id, { content: e.target.value })} 
                              className="w-full bg-black/60 p-4 rounded-xl text-pink-400 text-xs outline-none border border-pink-500/10" 
                              placeholder="Pegar URL de post de Instagram..." 
                            />
                          </div>
                        )}

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDeleteBlock(block.id)} 
                            className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Selector de Bloques */}
                    <div className="relative pt-4">
                      <button 
                        onClick={() => setIsAddBlockMenuOpen(!isAddBlockMenuOpen)} 
                        className="w-full border-2 border-dashed border-white/10 hover:border-neon/50 hover:bg-neon/5 rounded-2xl py-4 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 hover:text-neon transition-all flex items-center justify-center gap-3 group"
                      >
                          <Plus size={16} className={`transition-transform duration-500 ${isAddBlockMenuOpen ? 'rotate-45' : ''}`} />
                          {isAddBlockMenuOpen ? 'CANCELAR' : 'AÑADIR SECCIÓN'}
                      </button>
                      
                      {isAddBlockMenuOpen && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex flex-wrap justify-center gap-2 p-3 bg-[#111] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-50 ring-1 ring-white/5 w-max">
                              {[
                                  { type: 'text', icon: Type, label: 'Párrafo', color: 'hover:text-blue-400' },
                                  { type: 'heading', icon: Heading2, label: 'Subtítulo', color: 'hover:text-neon' },
                                  { type: 'image', icon: ImageIcon, label: 'Imagen', color: 'hover:text-emerald-400' },
                                  { type: 'quote', icon: Quote, label: 'Cita', color: 'hover:text-amber-400' },
                                  { type: 'youtube', icon: Youtube, label: 'YouTube', color: 'hover:text-red-500' },
                                  { type: 'instagram', icon: Instagram, label: 'Instagram', color: 'hover:text-pink-500' }
                              ].map(item => (
                                  <button 
                                    key={item.type} 
                                    onClick={() => handleAddBlock(item.type as BlockType)} 
                                    className={`flex flex-col items-center gap-2 p-2 hover:bg-white/5 rounded-xl text-gray-500 transition-all group ${item.color}`}
                                  >
                                      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                        <item.icon size={18} />
                                      </div>
                                      <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                                  </button>
                              ))}
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Lateral - Configuración */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Portada */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neon uppercase tracking-[0.4em] block pl-1">PORTADA DE NOTICIA *</label>
                  <div className={`w-full aspect-[16/10] bg-black rounded-2xl border-2 border-dashed flex items-center justify-center flex-col overflow-hidden relative group shadow-xl ring-1 ring-white/5 transition-colors ${!metaData.imageUrl && errors.length > 0 ? 'border-red-500/50' : 'border-white/10'}`}>
                    {metaData.imageUrl ? (
                      <img src={metaData.imageUrl} alt="preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="text-center text-gray-600">
                        <UploadCloud size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Haz click para cargar imagen</p>
                      </div>
                    )}
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                    >
                        {isUploading ? <Loader2 className="animate-spin" size={24} /> : (
                            <>
                                <Edit3 size={24} className="mb-2 text-neon" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Cambiar Imagen</span>
                            </>
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden accept="image/*" />
                  </div>
                  <div className="relative">
                    <input 
                        type="text" 
                        value={metaData.imageUrl || ''} 
                        onChange={e => setMetaData(p => ({ ...p, imageUrl: e.target.value }))} 
                        onBlur={handleUrlProcessing} 
                        disabled={isProcessingUrl} 
                        placeholder="Pegar URL de imagen externa..." 
                        className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-[9px] font-bold text-blue-400 focus:border-neon outline-none transition-all ${!metaData.imageUrl && errors.length > 0 ? 'border-red-500/50' : 'border-white/10'}`} 
                    />
                    {isProcessingUrl && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-gray-500" />}
                  </div>
                  {urlError && <p className="text-[8px] text-red-400 font-bold uppercase tracking-widest px-2">{urlError}</p>}
                </div>

                {/* Meta Settings */}
                <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10 space-y-6 shadow-xl">
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] block">CATEGORÍA *</label>
                      <div className="relative group">
                          <select 
                            value={metaData.category || ''} 
                            onChange={e => setMetaData(p => ({ ...p, category: e.target.value as string }))} 
                            className={`w-full bg-black/50 border-2 rounded-xl p-3 text-xs font-bold text-white focus:border-neon outline-none appearance-none cursor-pointer hover:border-white/40 transition-colors ${!metaData.category && errors.length > 0 ? 'border-red-500/50' : 'border-white/20'}`}
                          >
                              <option value="" disabled className="text-gray-600 italic">-- Seleccionar Categoría --</option>
                              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neon/40 group-hover:text-neon transition-colors">▼</div>
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] block">AUTOR RESPONSABLE *</label>
                      <div className="relative group">
                          <select 
                            value={metaData.author || ''} 
                            onChange={e => setMetaData(p => ({ ...p, author: e.target.value }))} 
                            className={`w-full bg-black/50 border-2 rounded-xl p-3 text-xs font-bold text-white focus:border-neon outline-none appearance-none cursor-pointer hover:border-white/40 transition-colors ${!metaData.author && errors.length > 0 ? 'border-red-500/50' : 'border-white/20'}`}
                          >
                              <option value="" disabled className="text-gray-600 italic">-- Seleccionar Autor --</option>
                              {users.filter(u => {
                                const role = roles.find(r => r.id === u.roleId);
                                return role && role.permissions.includes('news');
                              }).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neon/40 group-hover:text-neon transition-colors">▼</div>
                      </div>
                  </div>
                </div>

                {/* Fuentes IA */}
                {editingSources && editingSources.length > 0 && (
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-neon uppercase tracking-[0.4em] block pl-1">FUENTES DE LA IA</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                          {editingSources.map((source, i) => (
                              <a 
                                key={i} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="block p-3 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-neon/10 hover:border-neon/30 transition-all group"
                              >
                                  <p className="text-blue-400 text-[9px] font-black uppercase truncate group-hover:text-neon transition-colors">{source.title}</p>
                                  <p className="text-[8px] text-gray-600 truncate mt-1">{source.uri}</p>
                              </a>
                          ))}
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Sticky Bottom */}
        <div className="h-20 px-6 md:px-8 border-t border-white/10 bg-black/80 backdrop-blur-2xl flex items-center justify-between flex-shrink-0 z-50">
            <button 
                onClick={onClose} 
                className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-white/5 text-gray-400 hover:text-white text-[10px] font-black uppercase italic tracking-widest rounded-xl hover:bg-white/10 transition-all border border-white/5"
            >
                DESCARTAR
            </button>
            <div className="flex flex-1 md:flex-none items-center gap-4 w-full md:w-auto">
                <button 
                  onClick={handleSaveArticle} 
                  className="flex-1 md:flex-none px-8 py-3.5 bg-neon text-black text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(0,255,157,0.3)] flex items-center justify-center gap-2"
                >
                    <Save size={16} strokeWidth={3} /> GUARDAR COMO BORRADOR
                </button>
            </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #00ff9d;
        }
      `}</style>
    </div>
  );
};