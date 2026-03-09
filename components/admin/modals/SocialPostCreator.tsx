


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Article, User, Brand, SocialAccount, SocialPost } from '../../../types';
import { generateSocialMediaContent, generateSocialMediaContentFromTopic, improveSocialMediaCopy } from '../../../services/geminiService';
import { X, ArrowRight, Loader2, AlertTriangle, CheckCircle2, UploadCloud, Sparkles, AtSign, Building, Check, Crop, Send, Save, Edit2, AlertCircle } from 'lucide-react';
import { storage } from '../../../services/firebase';
import { ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import { ImageCropper } from './ImageCropper';
import { DEFAULT_SOCIAL_COPY_PROMPT } from '../../../constants';

type PublicationStatus = 'idle' | 'generating' | 'creatingPreview' | 'preview' | 'publishing' | 'success' | 'error';

interface SocialPostCreatorProps {
  article: Article | null;
  draftPost?: SocialPost | null;
  currentUser: User;
  brands: Brand[];
  socialAccounts: SocialAccount[];
  aiSystemPrompt: string;
  onClose: () => void;
  onAddSocialPost: (post: Omit<SocialPost, 'id'>) => void;
  onUpdateSocialPost: (post: SocialPost) => void;
  users: User[];
  articles: Article[];
}

export const SocialPostCreator: React.FC<SocialPostCreatorProps> = ({
  article,
  draftPost,
  currentUser,
  brands,
  socialAccounts,
  aiSystemPrompt,
  onClose,
  onAddSocialPost,
  onUpdateSocialPost,
  users,
  articles,
}) => {
  const [status, setStatus] = useState<PublicationStatus>('idle');
  const [shortTitle, setShortTitle] = useState('');
  const [copy, setCopy] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [generationQuery, setGenerationQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showConfirmPublish, setShowConfirmPublish] = useState(false);
  
  const isInitialized = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // FIX: Added useMemo to prevent re-creating the map on every render.
  const brandMap = useMemo(() => new Map<string, Brand>(brands.map(b => [b.id, b])), [brands]);

  const availableSocialAccounts = currentUser.roleId === 'admin' 
    ? socialAccounts 
    : socialAccounts.filter(acc => currentUser.managedSocialAccountIds?.includes(acc.id));


  useEffect(() => {
    if (isInitialized.current) return;

    const initialize = async () => {
      if (draftPost) {
        setShortTitle(draftPost.titleOverlay || '');
        setCopy(draftPost.copy || '');
        setImageUrl(draftPost.imageUrl || '');
        setSelectedAccounts(draftPost.postedToAccounts || []);
        setSelectedSponsors(draftPost.associatedSponsors || []);
        
        if (draftPost.imageUrl) {
            setGeneratedImageUrl(draftPost.imageUrl);
            setStatus('preview');
        } else {
            setStatus('idle');
        }
        isInitialized.current = true;
      } else if (article) {
        setImageUrl(article.imageUrl);
        setStatus('generating');

        const targetAccount = socialAccounts.find(acc => acc.name.toLowerCase().includes((article.category || '').toLowerCase()));
        const systemPromptForAI = targetAccount?.systemPrompt || aiSystemPrompt;
        const copyPromptForAI = targetAccount?.copyPrompt || DEFAULT_SOCIAL_COPY_PROMPT;

        try {
          const content = await generateSocialMediaContent(article.title, article.excerpt, systemPromptForAI, copyPromptForAI);
          setShortTitle(content.shortTitle);
          setCopy(content.copy);
          setStatus('idle');
          isInitialized.current = true;
        } catch (error) {
          console.error(error);
          setStatus('error');
        }
      }
    };
    initialize();
  }, [article, draftPost, aiSystemPrompt, socialAccounts]);
  
  useEffect(() => {
    // Evitar que la lógica de sponsors borre el texto si estamos cargando un borrador o si ya estamos en preview
    if (status !== 'idle' || !isInitialized.current) return;

    const sponsorHandles = selectedSponsors
      .map(id => brandMap.get(id)?.socialHandle)
      .filter(Boolean as any as (x: string | undefined) => x is string)
      .join(' ');
      
    // Solo anexar si el texto actual no contiene ya la mención a los sponsors o si está vacío
    const supportPattern = "\n\nCon el apoyo de";
    if (sponsorHandles && !copy.includes(supportPattern)) {
        setCopy(prev => prev + `${supportPattern} ${sponsorHandles}.`);
    } else if (copy.includes(supportPattern)) {
        const baseCopy = copy.split(supportPattern)[0];
        const supportString = sponsorHandles ? `${supportPattern} ${sponsorHandles}.` : '';
        setCopy(baseCopy + supportString);
    }
  }, [selectedSponsors, status, copy, brandMap]);


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const storageRef = ref(storage, `social_images/${Date.now()}-${file.name}`);
      const snapshot = await uploadString(storageRef, base64, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);
      setImageUrl(downloadURL);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
    const handleUrlProcessing = async () => {
    if (!imageUrl || !imageUrl.startsWith('http') || imageUrl.includes('firebasestorage.googleapis.com')) {
        setUrlError(null);
        return;
    }

    setIsProcessingUrl(true);
    setUrlError(null);
    
    try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Respuesta de red no fue OK');
        
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
            throw new Error('El archivo no es una imagen válida.');
        }

        const storageRef = ref(storage, `social_images/imported-${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(snapshot.ref);

        setImageUrl(downloadURL);
    } catch (error) {
        console.error("Error al procesar URL de imagen externa:", error);
        setUrlError("Error de carga externa.");
    } finally {
        setIsProcessingUrl(false);
    }
  };
  
  const handleImproveCopy = async () => {
    if (!copy) return;
    setIsImproving(true);
    
    const primaryAccount = selectedAccounts.length > 0 ? socialAccounts.find(acc => acc.id === selectedAccounts[0]) : null;
    const systemPromptForAI = primaryAccount?.systemPrompt || aiSystemPrompt;
    const copyPromptForAI = primaryAccount?.copyPrompt || DEFAULT_SOCIAL_COPY_PROMPT;

    try {
      const result = await improveSocialMediaCopy(copy, systemPromptForAI, copyPromptForAI);
      setCopy(result.copy);
    } catch (error) {
      console.error(error);
    } finally {
      setIsImproving(false);
    }
  };

  const handleGenerateFromTopic = async () => {
    if (!generationQuery) return;
    setIsGenerating(true);
    
    try {
      const content = await generateSocialMediaContentFromTopic(generationQuery, aiSystemPrompt, DEFAULT_SOCIAL_COPY_PROMPT);
      setShortTitle(content.shortTitle);
      setCopy(content.copy);
      setGenerationQuery('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCropSave = async (croppedImageBase64: string) => {
    setIsUploading(true);
    setIsCropperOpen(false);
    try {
        const storageRef = ref(storage, `social_images/cropped-${Date.now()}.jpg`);
        const snapshot = await uploadString(storageRef, croppedImageBase64, 'data_url');
        const downloadURL = await getDownloadURL(snapshot.ref);
        setImageUrl(downloadURL);
    } catch (error) {
        console.error("Cropped image upload error:", error);
    } finally {
        setIsUploading(false);
    }
  };

  const buildWebhookPayload = (state: 'create' | 'approved') => {
      const selectedAccountDetails = selectedAccounts
          .map(id => socialAccounts.find(acc => acc.id === id))
          .filter((acc): acc is SocialAccount => !!acc)
          .map(acc => ({ name: acc.name, handle: acc.handle, platform: acc.platform }));

      const sponsorPayload: { [key: string]: { name: string; logoUrl: string } | null } = { sponsor_1: null, sponsor_2: null, sponsor_3: null, sponsor_4: null };
      
      selectedSponsors
        .map(id => brands.find(b => b.id === id))
        .filter((b): b is Brand => !!b)
        .slice(0, 4)
        .forEach((sponsor, index) => { sponsorPayload[`sponsor_${index + 1}`] = { name: sponsor.name, logoUrl: sponsor.logoUrl }; });
      
      const authorUser = article ? users.find(u => u.id === article.author) : null;
      const authorName = authorUser ? authorUser.name : 'Redacción';
      
      return {
        state,
        accounts: selectedAccountDetails,
        author: authorName,
        publisher: currentUser.name,
        imageUrl: state === 'approved' ? generatedImageUrl : imageUrl,
        title: shortTitle,
        copy: copy,
        ...sponsorPayload,
        articleUrl: article ? `https://a1toque.com/news/${article.id}` : undefined,
      };
  };

  const handleGeneratePreview = async () => {
    setStatus('creatingPreview');
    const payload = buildWebhookPayload('create');
    const webhookUrl = "https://hook.us1.make.com/k1ju5hoo957qi7tasocjdpcso23egosw";
    try {
      const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
      const newImageUrl = await response.text();
      if (!newImageUrl.startsWith('http')) throw new Error(`Invalid URL from webhook: ${newImageUrl}`);
      setGeneratedImageUrl(newImageUrl);
      setStatus('preview');
    } catch (error) {
      console.error("Failed to generate preview:", error);
      setStatus('error');
    }
  };
  
  const handleSaveDraft = () => {
    const postData = {
        originalArticleId: article?.id || draftPost?.originalArticleId || 'standalone',
        originalArticleTitle: article?.title || draftPost?.originalArticleTitle || shortTitle,
        postedAt: draftPost?.postedAt || new Date().toISOString(),
        postedBy: draftPost?.postedBy || currentUser.id,
        imageUrl: generatedImageUrl || imageUrl || '',
        titleOverlay: shortTitle,
        copy: copy,
        postedToAccounts: selectedAccounts,
        associatedSponsors: selectedSponsors,
        status: 'draft' as const,
    };

    if (draftPost) {
        onUpdateSocialPost({ ...postData, id: draftPost.id });
    } else {
        onAddSocialPost(postData);
    }
    onClose();
  };
  
  const handleFinalPublish = async () => {
    setStatus('publishing');
    setShowConfirmPublish(false);
    const payload = buildWebhookPayload('approved');
    const webhookUrl = "https://hook.us1.make.com/k1ju5hoo957qi7tasocjdpcso23egosw";
    try {
      const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
      
      const postData = {
        originalArticleId: article?.id || draftPost?.originalArticleId || 'standalone',
        originalArticleTitle: article?.title || draftPost?.originalArticleTitle || shortTitle,
        postedAt: new Date().toISOString(),
        postedBy: draftPost?.postedBy || currentUser.id,
        imageUrl: generatedImageUrl || imageUrl || '',
        titleOverlay: shortTitle,
        copy: copy,
        postedToAccounts: selectedAccounts,
        associatedSponsors: selectedSponsors,
        status: 'success' as const,
      };

      if (draftPost) {
        onUpdateSocialPost({ ...postData, id: draftPost.id });
      } else {
        onAddSocialPost(postData);
      }
      setStatus('success');
    } catch (error) {
      console.error("Failed to publish:", error);
      setStatus('error');
    }
  };


  return (
    <div className="fixed inset-0 z-[200] bg-[#0A0A0A] flex flex-col animate-in fade-in duration-300">
       {isCropperOpen && imageUrl && (
        <ImageCropper imageUrl={imageUrl} onClose={() => setIsCropperOpen(false)} onSave={handleCropSave} />
       )}

       {/* MODAL DE CONFIRMACIÓN DE PUBLICACIÓN */}
       {showConfirmPublish && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-[40px] p-10 text-center shadow-2xl relative">
                <div className="w-20 h-20 bg-neon/10 border-2 border-neon/20 rounded-full flex items-center justify-center text-neon mx-auto mb-8">
                  <AlertCircle size={40} className="animate-pulse" />
                </div>
                <h3 className="text-3xl font-oswald font-black text-white uppercase italic mb-4 tracking-tighter">¿PUBLICAR AHORA?</h3>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-10 leading-relaxed">
                   Esta acción enviará el contenido a todas las redes seleccionadas de forma inmediata.
                </p>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleFinalPublish} 
                    className="w-full py-5 bg-neon text-black font-black uppercase italic text-xs tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(0,255,157,0.3)]"
                  >
                    SÍ, PUBLICAR INMEDIATAMENTE
                  </button>
                  <button 
                    onClick={() => setShowConfirmPublish(false)} 
                    className="w-full py-4 bg-white/5 text-gray-500 font-black uppercase italic text-[10px] tracking-widest rounded-xl hover:text-white transition-all"
                  >
                    VOLVER A REVISAR
                  </button>
                </div>
            </div>
          </div>
       )}

       {/* Header del Creator */}
       <div className="p-4 border-b border-white/5 flex-shrink-0 bg-[#0f0f0f]/80 backdrop-blur-xl z-20">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
             <div>
                <h2 className="text-xl font-oswald font-black italic uppercase text-neon tracking-tighter">
                    {draftPost ? 'REVISAR BORRADOR' : article ? 'GENERAR POSTEO' : 'NUEVO POSTEO'}
                </h2>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest max-w-[200px] md:max-w-md truncate" title={article?.title || draftPost?.originalArticleTitle}>
                    {article?.title || draftPost?.originalArticleTitle || 'Contenido Social'}
                </p>
             </div>
             <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 text-gray-400 rounded-xl hover:text-white transition-all">
                <X size={20}/>
             </button>
          </div>
       </div>

        {/* Zona de Trabajo */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
            {['generating', 'creatingPreview', 'publishing'].includes(status) && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Loader2 className="animate-spin text-neon size-12 mb-4 opacity-50" /> 
                    <span className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">
                        {status === 'generating' ? 'IA creando el copy...' : status === 'creatingPreview' ? 'Generando gráfica final...' : 'Publicando en redes...'}
                    </span>
                </div>
            )}
            
            {status === 'error' && (
                <div className="h-full flex flex-col items-center justify-center text-red-400 font-bold text-center p-8">
                    <AlertTriangle className="mb-4 size-16" />
                    <span className="text-lg uppercase italic font-oswald font-black">Error en la Publicación</span>
                    <button onClick={() => setStatus('idle')} className="mt-6 text-xs text-white underline font-bold">Volver a intentar</button>
                </div>
            )}
            
            {status === 'success' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in zoom-in duration-500">
                    <div className="max-w-xl w-full">
                        <CheckCircle2 className="mb-6 size-20 text-neon mx-auto drop-shadow-[0_0_15px_rgba(0,255,157,0.4)]"/>
                        <h3 className="text-4xl font-oswald font-black text-white uppercase italic mb-3 tracking-tighter">¡POSTEO ENVIADO!</h3>
                        <p className="text-gray-400 text-sm mb-10 font-bold uppercase tracking-widest">El contenido ha sido procesado y está en camino.</p>
                        <button onClick={onClose} className="px-10 py-4 bg-neon text-black text-[12px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition-all">
                            VOLVER AL PANEL
                        </button>
                    </div>
                </div>
            )}

            {status === 'preview' && (
                <div className="max-w-5xl mx-auto p-4 md:p-12 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h3 className="text-3xl font-oswald font-black text-white uppercase italic mb-2 tracking-tighter">VISTA PREVIA DEL POSTEO</h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Confirma el diseño final y el copy antes de difundir.</p>
                        </div>
                        <button 
                            onClick={() => setStatus('idle')}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                        >
                            <Edit2 size={14} /> EDITAR CONTENIDO
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-neon uppercase tracking-[0.3em]">Gráfica Final</h4>
                            {generatedImageUrl ? (
                                <div className="relative group">
                                    <img src={generatedImageUrl} alt="Preview" className="w-full aspect-square object-contain bg-black rounded-3xl border border-neon/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]" />
                                    <div className="absolute top-4 right-4 bg-neon/10 backdrop-blur-md px-3 py-1 rounded-full border border-neon/30">
                                        <span className="text-neon text-[8px] font-black uppercase tracking-widest">Generado con IA</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full aspect-square bg-black rounded-3xl border-2 border-dashed border-white/5 flex items-center justify-center text-gray-700">Sin vista previa</div>
                            )}
                        </div>
                        <div className="space-y-4 flex flex-col h-full">
                            <h4 className="text-[10px] font-black text-neon uppercase tracking-[0.3em]">Copy del Posteo</h4>
                            <textarea value={copy || ''} onChange={e => setCopy(e.target.value)} rows={15} className="flex-1 w-full bg-black/50 border border-white/10 rounded-3xl p-6 text-base text-gray-300 focus:text-white focus:border-neon outline-none leading-relaxed custom-scrollbar shadow-inner"/>
                            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                                <h5 className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-3">Redes de Destino</h5>
                                <div className="flex flex-wrap gap-2">
                                    {selectedAccounts.map(id => {
                                        const acc = socialAccounts.find(a => a.id === id);
                                        return acc ? (
                                            <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-black/50 rounded-lg border border-white/5">
                                                {acc.profileImageUrl && <img src={acc.profileImageUrl} className="w-4 h-4 rounded-full" />}
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{acc.name}</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {status === 'idle' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto p-4 md:p-12 gap-12 animate-in fade-in duration-500">
                    {/* Columna Izquierda: Imagen y Título */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Configuración de Gráfica</h3>
                        <div className="relative aspect-square w-full bg-black rounded-[40px] border-2 border-dashed border-white/10 flex items-center justify-center flex-col overflow-hidden group shadow-2xl">
                            {imageUrl ? (
                                <img src={imageUrl} alt="preview" className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"/>
                            ) : (
                                <div className="text-center text-gray-700">
                                    <UploadCloud size={48} className="mx-auto mb-4 opacity-20"/>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Cargar Imagen</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                                {isUploading ? (
                                    <Loader2 className="animate-spin" size={32}/>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-3 px-8 py-3 bg-white/10 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-white/20 transition-all">
                                            <UploadCloud size={16}/> CAMBIAR IMAGEN
                                        </button>
                                        <button onClick={() => setIsCropperOpen(true)} className="flex items-center gap-3 px-8 py-3 bg-white/10 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-white/20 transition-all">
                                            <Crop size={16}/> AJUSTAR ENCUADRE
                                        </button>
                                    </div>
                                )}
                                <input type="file" ref={imageInputRef} onChange={handleImageUpload} hidden accept="image/*"/>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end justify-center p-12 pointer-events-none">
                                <textarea 
                                    value={shortTitle || ''} 
                                    onChange={e => setShortTitle(e.target.value)} 
                                    maxLength={50} 
                                    rows={2}
                                    className="w-full bg-transparent text-white text-3xl md:text-5xl font-oswald font-black uppercase italic text-center drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] outline-none pointer-events-auto resize-none" 
                                    placeholder="TITULO CORTO..." 
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <input type="text" value={imageUrl || ''} onChange={e => setImageUrl(e.target.value)} onBlur={handleUrlProcessing} disabled={isProcessingUrl} placeholder="Pega URL de imagen..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-[10px] font-bold text-blue-400 focus:border-neon outline-none transition-all" />
                            {isProcessingUrl && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-500" />}
                        </div>
                    </div>

                    {/* Columna Derecha: Configuración */}
                    <div className="flex flex-col space-y-10">
                        {!article && !draftPost && (
                            <div>
                                <h4 className="text-[10px] font-black text-neon uppercase tracking-[0.3em] mb-4">Generar con IA</h4>
                                <div className="flex gap-3">
                                    <input type="text" value={generationQuery || ''} onChange={e => setGenerationQuery(e.target.value)} placeholder="¿Sobre qué quieres postear?" className="flex-1 bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-neon outline-none" />
                                    <button onClick={handleGenerateFromTopic} disabled={isGenerating || !generationQuery} className="px-6 bg-white/5 text-white hover:bg-neon hover:text-black rounded-xl transition-all disabled:opacity-30">
                                        {isGenerating ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="text-[10px] font-black text-neon uppercase tracking-[0.3em] mb-4">Copy del Post</h4>
                            <div className="relative">
                                <textarea value={copy || ''} onChange={e => setCopy(e.target.value)} rows={article ? 8 : 6} className="w-full bg-black/50 border border-white/10 rounded-[32px] p-6 text-sm text-gray-300 focus:text-white focus:border-neon outline-none leading-relaxed" placeholder="Escribe el cuerpo del post..."/>
                                <button onClick={handleImproveCopy} disabled={isImproving || !copy} className="absolute bottom-6 right-6 px-4 py-2 bg-black/80 text-neon text-[9px] font-black uppercase tracking-widest rounded-xl border border-neon/20 hover:bg-neon hover:text-black transition-all disabled:opacity-30 flex items-center gap-2">
                                    {isImproving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} MEJORAR CON IA
                                </button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-neon uppercase tracking-[0.4em] mb-4 flex items-center gap-2"><AtSign size={14}/> Cuentas de Destino</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                {availableSocialAccounts.map(account => (
                                    <button key={account.id} onClick={() => setSelectedAccounts(p => p.includes(account.id) ? p.filter(id => id !== account.id) : [...p, account.id])} className={`p-4 rounded-[20px] border-2 transition-all duration-300 flex items-center gap-4 ${selectedAccounts.includes(account.id) ? 'bg-neon/10 border-neon shadow-[0_0_20px_rgba(0,255,157,0.1)]' : 'bg-white/[0.02] border-transparent hover:border-white/10'}`}>
                                        <div className="relative">
                                            {account.profileImageUrl ? <img src={account.profileImageUrl} alt={account.name} className="w-10 h-10 rounded-full border border-white/10" /> : <div className="w-10 h-10 rounded-full border border-white/10 bg-neutral-800" />}
                                            {selectedAccounts.includes(account.id) && <div className="absolute -top-1 -right-1 bg-neon text-black rounded-full p-0.5"><Check size={10} strokeWidth={4} /></div>}
                                        </div>
                                        <div className="min-w-0 text-left">
                                            <p className="text-xs font-black text-white uppercase truncate tracking-tight">{account.name}</p>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase">{account.platform}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-neon uppercase tracking-[0.4em] mb-4 flex items-center gap-2"><Building size={14}/> Auspicios Asociados</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                {brands.map(brand => (
                                    <button key={brand.id} onClick={() => setSelectedSponsors(p => p.includes(brand.id) ? p.filter(id => id !== brand.id) : [...p, brand.id])} className={`p-3 rounded-[20px] border-2 transition-all duration-300 flex flex-col items-center text-center gap-2 relative ${selectedSponsors.includes(brand.id) ? 'bg-neon/10 border-neon' : 'bg-white/[0.02] border-transparent hover:border-white/10'}`}>
                                        {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.name} className="h-10 w-10 object-contain p-1 filter grayscale brightness-200 group-hover:grayscale-0 transition-all" /> : <div className="h-10 w-10 bg-neutral-800 rounded-full" />}
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest truncate w-full">{brand.name}</span>
                                        {selectedSponsors.includes(brand.id) && (<div className="absolute top-1 right-1 w-4 h-4 bg-neon rounded-full flex items-center justify-center text-black"><Check size={10} strokeWidth={3} /></div>)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* BARRA DE ACCIÓN FIJA (STICKY BOTTOM) */}
        <div className="fixed md:absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-black/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <button onClick={onClose} className="hidden md:block px-8 py-3 bg-white/5 text-gray-400 text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:bg-white/10 hover:text-white transition-all">
                CANCELAR
            </button>
            <div className="flex flex-1 md:flex-none items-center gap-3 w-full md:w-auto">
                {status === 'idle' && (
                    <button 
                        onClick={handleGeneratePreview} 
                        disabled={selectedAccounts.length === 0} 
                        className="flex-1 md:flex-none px-10 py-5 bg-neon text-black text-[12px] font-black uppercase italic tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,255,157,0.3)] flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        GENERAR GRÁFICA Y CONTINUAR <ArrowRight size={18} strokeWidth={3} />
                    </button>
                )}
                {status === 'preview' && (
                    <>
                        <button onClick={handleSaveDraft} className="flex-1 md:flex-none px-8 py-5 bg-white/5 text-white text-[12px] font-black uppercase italic tracking-widest rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                            <Save size={18} className="inline mr-2" /> ACTUALIZAR BORRADOR
                        </button>
                        <button onClick={() => setShowConfirmPublish(true)} className="flex-1 md:flex-none px-12 py-5 bg-neon text-black text-[12px] font-black uppercase italic tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,255,157,0.3)] flex items-center justify-center gap-3">
                            <Send size={18} strokeWidth={3} /> PUBLICAR AHORA
                        </button>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};