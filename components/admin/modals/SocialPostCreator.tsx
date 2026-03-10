
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Article, User, Brand, SocialAccount, SocialPost, Source, SiteConfig } from '../../../types';
import { generateSocialMediaContent, generateSocialMediaContentFromTopic, improveSocialMediaCopy, refineSocialMediaContent } from '../../../services/geminiService';
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
  siteConfig?: SiteConfig;
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
  siteConfig,
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
  const [lastGeneratedTitle, setLastGeneratedTitle] = useState('');
  const [lastGeneratedCopy, setLastGeneratedCopy] = useState('');
  const [lastGeneratedSponsors, setLastGeneratedSponsors] = useState<string[]>([]);
  const [lastGeneratedAccounts, setLastGeneratedAccounts] = useState<string[]>([]);
  const [lastGeneratedBaseImage, setLastGeneratedBaseImage] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isRefinementVisible, setIsRefinementVisible] = useState(false);
  const [generationQuery, setGenerationQuery] = useState('');
  const [refinementQuery, setRefinementQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showConfirmPublish, setShowConfirmPublish] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  
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
          setLastGeneratedTitle(draftPost.titleOverlay || '');
          setCopy(draftPost.copy || '');
          setLastGeneratedCopy(draftPost.copy || '');
          setImageUrl(draftPost.imageUrl || '');
          setLastGeneratedBaseImage(draftPost.imageUrl || '');
          setSelectedAccounts(draftPost.postedToAccounts || []);
          setLastGeneratedAccounts(draftPost.postedToAccounts || []);
          setSelectedSponsors(draftPost.associatedSponsors || []);
          setLastGeneratedSponsors(draftPost.associatedSponsors || []);
          
          // Asegurar que las fuentes incluyan el artículo original si existe
          const originalArticle = articles.find(a => a.id === draftPost.originalArticleId);
          const draftSources = [...(draftPost.sources || [])];
          if (originalArticle && !draftSources.find(s => s.uri.includes(originalArticle.id))) {
            draftSources.unshift({ 
              uri: `https://a1toque.com/news/${originalArticle.id}`, 
              title: `Artículo: ${originalArticle.title}` 
            });
          }
          setSources(draftSources);
          
          if (draftPost.imageUrl) {
              setGeneratedImageUrl(draftPost.imageUrl);
              setStatus('preview');
          } else {
              setStatus('idle');
          }
          isInitialized.current = true;
        } else if (article) {
          setImageUrl(article.imageUrl);
          setLastGeneratedBaseImage(article.imageUrl);
          setStatus('generating');

        const targetAccount = socialAccounts.find(acc => acc.name.toLowerCase().includes((article.category || '').toLowerCase()));
        const systemPromptForAI = targetAccount?.systemPrompt || aiSystemPrompt;
        const copyPromptForAI = targetAccount?.copyPrompt || DEFAULT_SOCIAL_COPY_PROMPT;

        try {
          const content = await generateSocialMediaContent(article.title, article.excerpt, systemPromptForAI, copyPromptForAI);
          setShortTitle(content.shortTitle || '');
          setLastGeneratedTitle(content.shortTitle || '');
          setCopy(content.copy || '');
          
          const articleSource = { 
            uri: `https://a1toque.com/news/${article.id}`, 
            title: `Artículo: ${article.title}` 
          };
          
          const combinedSources = [articleSource];
          if (article.sources) {
            article.sources.forEach(s => {
              if (!combinedSources.find(cs => cs.uri === s.uri)) combinedSources.push(s);
            });
          }
          if (content.sources) {
            content.sources.forEach((s: Source) => {
              if (!combinedSources.find(cs => cs.uri === s.uri)) combinedSources.push(s);
            });
          }
          setSources(combinedSources);
          
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
      setGeneratedImageUrl('');
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
        // Intentamos usar un proxy más robusto para imágenes
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            // Fallback a corsproxy.io si el primero falla
            const fallbackUrl = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
            const fallbackResponse = await fetch(fallbackUrl);
            if (!fallbackResponse.ok) throw new Error('No se pudo acceder a la imagen externa');
            
            const blob = await fallbackResponse.blob();
            await uploadAndSetImage(blob);
        } else {
            const blob = await response.blob();
            await uploadAndSetImage(blob);
        }
    } catch (error) {
        console.error("Error al procesar URL de imagen externa:", error);
        setUrlError("Error de carga externa. Intenta subirla manualmente.");
    } finally {
        setIsProcessingUrl(false);
    }
  };

  const uploadAndSetImage = async (blob: Blob) => {
    if (!blob.type.startsWith('image/')) {
        throw new Error('El archivo no es una imagen válida.');
    }

    const storageRef = ref(storage, `social_images/imported-${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);

    setImageUrl(downloadURL);
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
      setShortTitle(content.shortTitle || '');
      setCopy(content.copy || '');
      
      const topicSources = [...(content.sources || [])];
      if (generationQuery.trim().startsWith('http')) {
        if (!topicSources.find(s => s.uri === generationQuery.trim())) {
          topicSources.unshift({ uri: generationQuery.trim(), title: 'Fuente original' });
        }
      }
      setSources(topicSources);
      
      setGenerationQuery('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleRefine = async () => {
    if (!refinementQuery || !copy) return;
    setIsRefining(true);
    
    const primaryAccount = selectedAccounts.length > 0 ? socialAccounts.find(acc => acc.id === selectedAccounts[0]) : null;
    const systemPromptForAI = primaryAccount?.systemPrompt || aiSystemPrompt;
    const copyPromptForAI = primaryAccount?.copyPrompt || DEFAULT_SOCIAL_COPY_PROMPT;

    try {
      const content = await refineSocialMediaContent(shortTitle, copy, refinementQuery, systemPromptForAI, copyPromptForAI);
      setShortTitle(content.shortTitle || '');
      setCopy(content.copy || '');
      if (content.sources && content.sources.length > 0) {
        setSources(prev => {
          const newSources = [...prev];
          content.sources.forEach((s: Source) => {
            if (!newSources.find(ns => ns.uri === s.uri)) {
              newSources.push(s);
            }
          });
          return newSources;
        });
      }
      setRefinementQuery('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefining(false);
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
        setGeneratedImageUrl('');
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

  const hasChangesSinceLastGeneration = () => {
    if (shortTitle !== lastGeneratedTitle) return true;
    if (copy !== lastGeneratedCopy) return true;
    if (imageUrl !== lastGeneratedBaseImage) return true;
    
    // Compare arrays
    if (selectedSponsors.length !== lastGeneratedSponsors.length) return true;
    if (!selectedSponsors.every(id => lastGeneratedSponsors.includes(id))) return true;
    
    if (selectedAccounts.length !== lastGeneratedAccounts.length) return true;
    if (!selectedAccounts.every(id => lastGeneratedAccounts.includes(id))) return true;
    
    return false;
  };

  const handleGeneratePreview = async () => {
    if (!imageUrl) {
        alert("Por favor, carga una imagen primero.");
        return;
    }
    setStatus('creatingPreview');
    const payload = buildWebhookPayload('create');
    const webhookUrl = "https://hook.us1.make.com/k1ju5hoo957qi7tasocjdpcso23egosw";
    try {
      const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
      const newImageUrl = await response.text();
      if (!newImageUrl.startsWith('http')) throw new Error(`Invalid URL from webhook: ${newImageUrl}`);
      setGeneratedImageUrl(newImageUrl);
      setLastGeneratedTitle(shortTitle);
      setLastGeneratedCopy(copy);
      setLastGeneratedSponsors([...selectedSponsors]);
      setLastGeneratedAccounts([...selectedAccounts]);
      setLastGeneratedBaseImage(imageUrl);
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
        sources: sources,
        status: 'draft' as const,
    };

    if (draftPost && draftPost.id) {
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

      if (draftPost && draftPost.id) {
        onUpdateSocialPost({ ...postData, id: draftPost.id });
      } else {
        onAddSocialPost(postData);
      }
      setStatus('success');
      
      // Cerrar automáticamente después de un momento de éxito
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to publish:", error);
      setStatus('error');
    }
  };


  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300 font-sans selection:bg-neon selection:text-black">
       {/* MODAL DE REVISIÓN Y MEJORA (REFINEMENT) */}
       {isRefinementVisible && (
          <div className="fixed inset-0 z-[350] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300">
             <div className="max-w-4xl w-full bg-[#0A0A0A] border border-white/10 rounded-[40px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neon/20 rounded-lg flex items-center justify-center text-neon">
                         <Sparkles size={16} />
                      </div>
                      <h2 className="text-xl font-oswald font-black italic uppercase text-white tracking-tighter">REVISAR Y MEJORAR</h2>
                   </div>
                   <button onClick={() => setIsRefinementVisible(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white transition-all">
                      <X size={18} />
                   </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left: Sources & Context */}
                      <div className="space-y-6">
                         <div>
                            <h3 className="text-[10px] font-black text-neon uppercase tracking-[0.4em] mb-4">FUENTES DE INFORMACIÓN</h3>
                            {sources.length > 0 ? (
                               <div className="space-y-2">
                                  {sources.map((source, idx) => (
                                     <a 
                                        key={idx} 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/5 hover:border-neon/30 transition-all group"
                                     >
                                        <div className="flex items-center justify-between">
                                           <span className="text-[11px] text-gray-400 font-medium truncate max-w-[250px] group-hover:text-white">{source.title || 'Fuente externa'}</span>
                                           <ArrowRight size={12} className="text-gray-600 group-hover:text-neon group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <span className="text-[9px] text-gray-600 truncate block mt-1">{source.uri}</span>
                                     </a>
                                  ))}
                               </div>
                            ) : (
                               <div className="p-10 border border-dashed border-white/5 rounded-2xl text-center">
                                  <AlertCircle size={24} className="mx-auto text-gray-800 mb-3" />
                                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">No se encontraron fuentes adicionales</p>
                                </div>
                            )}
                         </div>

                         <div className="p-6 bg-neon/5 border border-neon/10 rounded-2xl">
                            <h4 className="text-[9px] font-black text-neon uppercase tracking-widest mb-2 flex items-center gap-2">
                               <Sparkles size={12} /> CONSEJO DE IA
                            </h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed italic">
                               "Puedes pedirme que cambie el tono, que sea más breve, que agregue datos específicos de las fuentes o que enfoque el mensaje en un público diferente."
                            </p>
                         </div>
                      </div>

                      {/* Right: Copy Iteration */}
                      <div className="flex flex-col space-y-4">
                         <div className="flex-1 flex flex-col space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">BORRADOR ACTUAL</label>
                            <textarea 
                               value={copy} 
                               onChange={e => setCopy(e.target.value)} 
                               className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-sm text-gray-300 focus:text-white focus:border-neon/20 outline-none leading-relaxed resize-none transition-all custom-scrollbar" 
                            />
                         </div>

                         <div className="space-y-3 pt-4 border-t border-white/5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">¿QUÉ QUIERES CAMBIAR?</label>
                            <div className="flex gap-2">
                               <input 
                                  type="text" 
                                  value={refinementQuery} 
                                  onChange={e => setRefinementQuery(e.target.value)} 
                                  onKeyDown={e => e.key === 'Enter' && handleRefine()}
                                  placeholder="Ej: Hazlo más emocionante y menciona el resultado..." 
                                  className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-neon outline-none transition-all" 
                               />
                               <button 
                                  onClick={handleRefine} 
                                  disabled={isRefining || !refinementQuery}
                                  className="w-12 h-12 flex items-center justify-center bg-neon text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-[0_0_20px_rgba(0,255,157,0.2)]"
                               >
                                  {isRefining ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <footer className="h-20 border-t border-white/5 bg-black/50 flex items-center justify-end px-10 gap-4">
                   <button 
                      onClick={() => setIsRefinementVisible(false)} 
                      className="px-8 py-3 bg-neon text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,255,157,0.2)]"
                   >
                      LISTO, USAR ESTE COPY
                   </button>
                </footer>
             </div>
          </div>
       )}

       {isCropperOpen && imageUrl && (
        <ImageCropper imageUrl={imageUrl} onClose={() => setIsCropperOpen(false)} onSave={handleCropSave} />
       )}

       {/* FULL IMAGE PREVIEW MODAL */}
       {showFullImage && (generatedImageUrl || imageUrl) && (
          <div 
            className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300 cursor-zoom-out"
            onClick={() => setShowFullImage(false)}
          >
             <img 
                src={generatedImageUrl || imageUrl || ''} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
                alt="Full Preview" 
             />
             <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                <X size={32} />
             </button>
          </div>
       )}

       {/* MODAL DE CONFIRMACIÓN DE PUBLICACIÓN */}
       {showConfirmPublish && (
          <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="max-w-sm w-full bg-[#0A0A0A] border border-white/10 rounded-[32px] p-10 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-neon opacity-50" />
                <div className="w-16 h-16 bg-neon/10 border border-neon/30 rounded-full flex items-center justify-center text-neon mx-auto mb-6">
                  <AlertCircle size={32} className="animate-pulse" />
                </div>
                <h3 className="text-2xl font-oswald font-black text-white uppercase italic mb-3 tracking-tighter">¿CONFIRMAR ENVÍO?</h3>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 leading-relaxed">
                   Se enviará a todas las plataformas seleccionadas.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleFinalPublish} 
                    className="w-full py-4 bg-neon text-black font-black uppercase italic text-[11px] tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_20px_rgba(0,255,157,0.2)]"
                  >
                    SÍ, PUBLICAR AHORA
                  </button>
                  <button 
                    onClick={() => setShowConfirmPublish(false)} 
                    className="w-full py-3 bg-white/5 text-gray-500 font-black uppercase italic text-[9px] tracking-widest rounded-xl hover:text-white transition-all"
                  >
                    CANCELAR
                  </button>
                </div>
            </div>
          </div>
       )}

        {/* MODAL DE ESTADO DE PUBLICACIÓN (LOADER / ÉXITO) */}
        {(status === 'publishing' || status === 'success') && (
           <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-500">
              <div className="max-w-sm w-full text-center">
                 <div className="relative w-32 h-32 mx-auto mb-10">
                    {status === 'publishing' ? (
                       <>
                          <div className="absolute inset-0 border-4 border-neon/10 rounded-full" />
                          <div className="absolute inset-0 border-4 border-neon rounded-full border-t-transparent animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center text-neon">
                             <Send size={40} className="animate-pulse" />
                          </div>
                       </>
                    ) : (
                       <div className="absolute inset-0 bg-neon rounded-full flex items-center justify-center text-black animate-in zoom-in duration-500">
                          <Check size={60} strokeWidth={4} />
                       </div>
                    )}
                 </div>
                 
                 <h3 className="text-3xl font-oswald font-black text-white uppercase italic mb-4 tracking-tighter">
                    {status === 'publishing' ? 'PUBLICANDO...' : '¡PUBLICADO CON ÉXITO!'}
                 </h3>
                 <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] leading-relaxed max-w-[250px] mx-auto">
                    {status === 'publishing' 
                       ? 'Estamos enviando tu contenido a las redes sociales seleccionadas. Por favor, no cierres esta ventana.' 
                       : 'Tu posteo ya está en camino. Volviendo al panel de control...'}
                 </p>
              </div>
           </div>
        )}

       <div className="max-w-5xl w-full bg-[#0A0A0A] border border-white/10 rounded-[32px] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[95vh] lg:max-h-[90vh] overflow-hidden relative">
          {/* Header */}
          <header className="h-14 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 flex-shrink-0">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                   {siteConfig?.logoUrl ? (
                      <img src={siteConfig.logoUrl} className="h-6 w-auto object-contain" alt="Logo" />
                   ) : (
                      <div className="w-7 h-7 bg-neon rounded-lg flex items-center justify-center text-black">
                         <Send size={14} strokeWidth={3} />
                      </div>
                   )}
                   <h1 className="text-lg font-oswald font-black italic uppercase text-white tracking-tighter">
                      {draftPost ? 'REVISIÓN BORRADOR' : 'NUEVO POST SOCIAL'}
                   </h1>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate max-w-[300px]">
                   {article?.title || draftPost?.originalArticleTitle || 'Entrada Manual'}
                </p>
             </div>
             <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white transition-all">
                <X size={18} />
             </button>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-5 custom-scrollbar">
             <div className="grid grid-cols-12 gap-5">
                
                {/* Visual Identity (Left) */}
                <div className="col-span-12 lg:col-span-5 flex flex-col space-y-3">
                   <div className="flex items-center justify-between">
                      <h2 className="text-[9px] font-black text-neon uppercase tracking-[0.4em]">01. IDENTIDAD VISUAL</h2>
                      <div className="flex gap-2">
                         <button onClick={() => imageInputRef.current?.click()} className="p-1.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all border border-white/5">
                            <UploadCloud size={14} />
                         </button>
                         <button onClick={() => setIsCropperOpen(true)} className="p-1.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all border border-white/5">
                            <Crop size={14} />
                         </button>
                      </div>
                      <input type="file" ref={imageInputRef} onChange={handleImageUpload} hidden accept="image/*"/>
                   </div>

                   <div 
                      className="relative aspect-video w-full rounded-[20px] overflow-hidden border border-white/10 bg-black group shadow-xl flex-shrink-0 cursor-pointer"
                      onClick={() => (generatedImageUrl || imageUrl) && setShowFullImage(true)}
                   >
                      {status === 'creatingPreview' && (
                         <div className="absolute inset-0 z-20 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-neon size-8 mb-3" />
                            <p className="text-neon text-[9px] font-black uppercase tracking-[0.5em] animate-pulse">GENERANDO...</p>
                         </div>
                      )}
                      
                      {generatedImageUrl || imageUrl ? (
                         <>
                            <img src={generatedImageUrl || imageUrl || ''} alt="Preview" className="w-full h-full object-contain transition-transform duration-[20s] group-hover:scale-105" />
                            
                            {/* OVERLAY BUTTONS */}
                            {status !== 'creatingPreview' && (
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <button 
                                     onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (selectedAccounts.length > 0 && copy.trim() && shortTitle.trim()) handleGeneratePreview(); 
                                     }}
                                     disabled={selectedAccounts.length === 0 || !copy.trim() || !shortTitle.trim()}
                                     className="px-5 py-2.5 bg-neon text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-110 active:scale-95 transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                     {status === 'preview' ? 'ACTUALIZAR DISEÑO' : 'GENERAR DISEÑO'}
                                  </button>
                               </div>
                            )}
                         </>
                      ) : (
                         <div className="h-full flex flex-col items-center justify-center text-gray-900">
                            <UploadCloud size={32} className="mb-2 opacity-10" />
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-30">Esperando Imagen</p>
                         </div>
                      )}
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-gray-600 uppercase tracking-[0.4em]">Título en Imagen</label>
                      <textarea 
                        value={shortTitle} 
                        onChange={e => setShortTitle(e.target.value)} 
                        maxLength={26} 
                        rows={1}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-white text-xl font-oswald font-black uppercase italic outline-none resize-none leading-tight tracking-tighter focus:border-neon transition-all" 
                        placeholder="ESCRIBE EL TÍTULO AQUÍ..." 
                      />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-gray-600 uppercase tracking-[0.4em]">URL de Imagen</label>
                      <input 
                         type="text" 
                         value={imageUrl || ''} 
                         onChange={e => setImageUrl(e.target.value)} 
                         onBlur={handleUrlProcessing}
                         placeholder="https://..." 
                         className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-blue-400 focus:border-neon outline-none transition-all" 
                      />
                   </div>
                </div>

                {/* Narrative (Right) */}
                <div className="col-span-12 lg:col-span-7 flex flex-col space-y-3">
                   <div className="flex items-center justify-between">
                      <h2 className="text-[9px] font-black text-neon uppercase tracking-[0.4em]">02. NARRATIVA Y COPY</h2>
                      <button 
                         onClick={() => setIsRefinementVisible(true)}
                         className="flex items-center gap-2 px-4 py-1.5 bg-neon text-black text-[9px] font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(0,255,157,0.2)]"
                      >
                         <Sparkles size={10} /> REVISAR Y MEJORAR
                      </button>
                   </div>
                   
                   <div className="flex-1 relative min-h-[300px]">
                      <textarea 
                         value={copy} 
                         onChange={e => setCopy(e.target.value)} 
                         className="w-full h-full bg-white/[0.02] border border-white/5 rounded-[20px] p-5 text-sm text-gray-300 focus:text-white focus:border-neon/10 outline-none leading-relaxed resize-none transition-all custom-scrollbar" 
                         placeholder="Desarrolla el mensaje principal..."
                      />
                      <div className="absolute bottom-4 right-6 text-[8px] font-mono text-gray-600">
                         {copy.length} CARACTERES
                      </div>
                   </div>

                   {!article && !draftPost && (
                      <div className="pt-2 border-t border-white/5">
                         <div className="flex gap-2">
                            <input 
                               type="text" 
                               value={generationQuery} 
                               onChange={e => setGenerationQuery(e.target.value)} 
                               placeholder="¿Sobre qué quieres postear hoy?" 
                               className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white focus:border-neon outline-none" 
                            />
                            <button 
                               onClick={handleGenerateFromTopic} 
                               disabled={isGenerating || !generationQuery}
                               className="w-10 h-10 flex items-center justify-center bg-white/5 text-white hover:bg-neon hover:text-black rounded-xl transition-all border border-white/10 disabled:opacity-30"
                            >
                               {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                            </button>
                         </div>
                      </div>
                   )}
                </div>

                {/* Distribution Strategy (Bottom) */}
                <div className="col-span-12 pt-3 border-t border-white/5">
                   <div className="grid grid-cols-2 gap-5">
                      {/* Accounts */}
                      <div>
                         <h3 className="text-[8px] font-black text-gray-600 uppercase tracking-[0.5em] mb-2">03. DISTRIBUCIÓN</h3>
                         <div className="flex flex-wrap gap-1.5">
                            {availableSocialAccounts.map(account => (
                               <button 
                                  key={account.id} 
                                  onClick={() => setSelectedAccounts(p => p.includes(account.id) ? p.filter(id => id !== account.id) : [...p, account.id])}
                                  className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${selectedAccounts.includes(account.id) ? 'bg-neon/10 border-neon text-neon' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20'}`}
                               >
                                  <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10">
                                     {account.profileImageUrl ? <img src={account.profileImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-neutral-800" />}
                                  </div>
                                  <span className="text-[9px] font-black uppercase tracking-tight">{account.name}</span>
                                  {selectedAccounts.includes(account.id) && <Check size={10} strokeWidth={4} />}
                               </button>
                            ))}
                         </div>
                      </div>

                      {/* Sponsors */}
                      <div>
                         <h3 className="text-[8px] font-black text-gray-600 uppercase tracking-[0.5em] mb-2">04. PATROCINIOS</h3>
                         <div className="flex flex-wrap gap-1.5">
                            {brands.map(brand => (
                               <button 
                                  key={brand.id} 
                                  onClick={() => setSelectedSponsors(p => p.includes(brand.id) ? p.filter(id => id !== brand.id) : [...p, brand.id])}
                                  className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${selectedSponsors.includes(brand.id) ? 'bg-neon/10 border-neon text-neon' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20'}`}
                               >
                                  {brand.logoUrl && <img src={brand.logoUrl} className="w-3 h-3 object-contain grayscale brightness-200" />}
                                  <span className="text-[9px] font-black uppercase tracking-tight">{brand.name}</span>
                                  {selectedSponsors.includes(brand.id) && <Check size={10} strokeWidth={4} />}
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

             </div>
          </main>

          {/* Footer Actions */}
          <footer className="h-20 border-t border-white/5 bg-black/50 flex items-center justify-between px-10 flex-shrink-0">
             <button 
                onClick={onClose} 
                className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-all"
             >
                DESCARTAR
             </button>
             
             <div className="flex items-center gap-4">
                <button 
                   onClick={handleSaveDraft} 
                   className="px-6 py-3 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
                >
                   <Save size={16} /> GUARDAR BORRADOR
                </button>
                
                {status === 'preview' && !hasChangesSinceLastGeneration() ? (
                   <button 
                      onClick={() => setShowConfirmPublish(true)} 
                      disabled={!copy.trim()}
                      className="px-10 py-3 bg-neon text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.05] active:scale-95 transition-all shadow-[0_0_50px_rgba(0,255,157,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      <Send size={18} strokeWidth={3} /> PUBLICAR
                   </button>
                ) : (
                   <button 
                      onClick={handleGeneratePreview} 
                      disabled={selectedAccounts.length === 0 || status === 'creatingPreview' || !copy.trim() || !shortTitle.trim()} 
                      className="px-10 py-3 bg-neon text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.05] active:scale-95 transition-all shadow-[0_0_50px_rgba(0,255,157,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      {status === 'preview' ? 'RE-GENERAR' : 'GENERAR'} <ArrowRight size={18} strokeWidth={3} />
                   </button>
                )}
             </div>
          </footer>
       </div>
    </div>
  );
};
