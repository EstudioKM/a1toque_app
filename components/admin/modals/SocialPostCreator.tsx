
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Article, User, Brand, SocialAccount, SocialPost, Source, SiteConfig } from '../../../types';
import { generateSocialMediaContentFast, generateSocialMediaContentFromTopic, improveSocialMediaCopy, refineSocialMediaContent } from '../../../services/geminiService';
import { X, ArrowRight, Loader2, AlertTriangle, CheckCircle2, UploadCloud, Sparkles, AtSign, Building, Check, Crop, Send, Save, Edit2, AlertCircle, Calendar, ChevronLeft, ChevronRight, Clock, Trash2, Plus, RotateCcw, Globe } from 'lucide-react';
import { storage } from '../../../services/firebase';
import { ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import { ImageCropper } from './ImageCropper';
import { DEFAULT_SOCIAL_COPY_PROMPT } from '../../../constants';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

type PublicationStatus = 'idle' | 'generating' | 'creatingPreview' | 'preview' | 'publishing' | 'success' | 'error';

interface SocialPostCreatorProps {
  article: Article | null;
  accountId?: string;
  preGeneratedContent?: any;
  skipGeneration?: boolean;
  draftPost?: SocialPost | null;
  currentUser: User;
  brands: Brand[];
  socialAccounts: SocialAccount[];
  aiSystemPrompt: string;
  siteConfig?: SiteConfig;
  onClose: () => void;
  onAddSocialPost: (post: Omit<SocialPost, 'id'>) => void;
  onUpdateSocialPost: (post: SocialPost) => void;
  onDeleteSocialPost?: (id: string) => void;
  users: User[];
  articles: Article[];
}

export const SocialPostCreator: React.FC<SocialPostCreatorProps> = ({
  article,
  accountId,
  preGeneratedContent,
  skipGeneration,
  draftPost,
  currentUser,
  brands,
  socialAccounts,
  aiSystemPrompt,
  siteConfig,
  onClose,
  onAddSocialPost,
  onUpdateSocialPost,
  onDeleteSocialPost,
  users,
  articles,
}) => {
  const [status, setStatus] = useState<PublicationStatus>(skipGeneration ? 'idle' : 'generating');
  const [shortTitle, setShortTitle] = useState('');
  const [copy, setCopy] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [lastGeneratedTitle, setLastGeneratedTitle] = useState('');
  const [lastGeneratedCopy, setLastGeneratedCopy] = useState('');
  const [lastGeneratedSponsors, setLastGeneratedSponsors] = useState<string[]>([]);
  const [lastGeneratedAccounts, setLastGeneratedAccounts] = useState<string[]>([]);
  const [lastGeneratedBaseImage, setLastGeneratedBaseImage] = useState<string | null>(null);

  const [postType, setPostType] = useState<'post' | 'carousel' | 'reel'>('post');
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [pendingPostType, setPendingPostType] = useState<'post' | 'carousel' | 'reel' | null>(null);
  
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>(
    `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`
  );

  const unifiedInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);
  // FIX: Added useMemo to prevent re-creating the map on every render.
  const brandMap = useMemo(() => new Map<string, Brand>(brands.map(b => [b.id, b])), [brands]);

  const availableSocialAccounts = currentUser.roleId === 'admin' 
    ? socialAccounts 
    : socialAccounts.filter(acc => currentUser.managedSocialAccountIds?.includes(acc.id));


  useEffect(() => {
    if (isInitialized.current) return;

    if (skipGeneration && preGeneratedContent) {
        setShortTitle(preGeneratedContent.shortTitle || '');
        setLastGeneratedTitle(preGeneratedContent.shortTitle || '');
        setCopy(preGeneratedContent.copy || '');
        setLastGeneratedCopy(preGeneratedContent.copy || '');
        
        if (accountId) {
            setSelectedAccounts([accountId]);
            setLastGeneratedAccounts([accountId]);
        }
        
        const articleSource = { 
            uri: `https://a1toque.com/news/${article?.id}`, 
            title: `Artículo: ${article?.title}` 
        };
        
        const combinedSources = [articleSource];
        if (preGeneratedContent.sources) {
            preGeneratedContent.sources.forEach((s: Source) => {
              if (!combinedSources.find(cs => cs.uri === s.uri)) combinedSources.push(s);
            });
        }
        setSources(combinedSources);
        
        setStatus('idle');
        isInitialized.current = true;
        return;
    }

    const initialize = async () => {
        if (draftPost) {
          setShortTitle(draftPost.titleOverlay || '');
          setLastGeneratedTitle(draftPost.titleOverlay || '');
          setCopy(draftPost.copy || '');
          setLastGeneratedCopy(draftPost.copy || '');
          
          const initialImages = draftPost.imageUrls && draftPost.imageUrls.length > 0 
            ? draftPost.imageUrls 
            : (draftPost.imageUrl ? [draftPost.imageUrl] : []);
          
          setImageUrls(initialImages);
          setLastGeneratedBaseImage(draftPost.originalImageUrl || draftPost.imageUrl || '');
          setSelectedAccounts(draftPost.postedToAccounts || []);
          setLastGeneratedAccounts(draftPost.postedToAccounts || []);
          setSelectedSponsors(draftPost.associatedSponsors || []);
          setLastGeneratedSponsors(draftPost.associatedSponsors || []);
          
          if (draftPost.scheduledAt) {
            setScheduledAt(draftPost.scheduledAt);
            setIsScheduling(true);
            
            // Update selectedDate and selectedTime to match the draft
            const draftDate = new Date(draftPost.scheduledAt);
            setSelectedDate(draftDate);
            setSelectedTime(`${draftDate.getHours().toString().padStart(2, '0')}:${draftDate.getMinutes().toString().padStart(2, '0')}`);
          }

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
          
          if (draftPost.imageUrl && draftPost.imageUrl !== draftPost.originalImageUrl) {
              setGeneratedImageUrl(draftPost.imageUrl);
              setStatus('preview');
          } else {
              setStatus('idle');
          }
          isInitialized.current = true;
        } else if (article) {
          setImageUrls(article.imageUrl ? [article.imageUrl] : []);
          setLastGeneratedBaseImage(article.imageUrl);
          setStatus('generating');

        const targetAccount = accountId 
            ? socialAccounts.find(acc => acc.id === accountId)
            : socialAccounts.find(acc => acc.name.toLowerCase().includes((article.category || '').toLowerCase()));
        const systemPromptForAI = targetAccount?.systemPrompt || aiSystemPrompt;
        const copyPromptForAI = targetAccount?.copyPrompt || DEFAULT_SOCIAL_COPY_PROMPT;

        if (targetAccount) {
          setSelectedAccounts([targetAccount.id]);
          setLastGeneratedAccounts([targetAccount.id]);
        }

        try {
          const content = await generateSocialMediaContentFast(article.title, article.excerpt, systemPromptForAI, copyPromptForAI);
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
  }, [article, accountId, draftPost, aiSystemPrompt, socialAccounts, skipGeneration, preGeneratedContent]);
  
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


  const handleLoadArticleImages = () => {
    if (!article) return;
    
    const articleImages: string[] = [];
    
    // Imagen principal
    if (article.imageUrl) articleImages.push(article.imageUrl);
    
    // Imágenes de los bloques de contenido
    if (Array.isArray(article.content)) {
      article.content.forEach(block => {
        if (block.type === 'image' && block.content) {
          articleImages.push(block.content);
        }
      });
    }
    
    if (articleImages.length > 0) {
      // Filtrar duplicados
      const uniqueImages = articleImages.filter((img, idx) => articleImages.indexOf(img) === idx);
      
      // Solo agregar las que no están ya en imageUrls
      const newImages = uniqueImages.filter(img => !imageUrls.includes(img));
      
      if (newImages.length > 0) {
        setImageUrls(prev => {
          const updatedUrls = [...prev, ...newImages];
          if (updatedUrls.length > 1 && postType !== 'reel') {
            setPostType('carousel');
          }
          return updatedUrls;
        });
      }
    }
  };

  const handlePostTypeChange = (type: 'post' | 'carousel' | 'reel') => {
    if (type === postType) return;
    
    if (videoUrl && (type === 'post' || type === 'carousel')) {
      setPendingPostType(type);
    } else if (imageUrls.length > 0 && type === 'reel') {
      setPendingPostType(type);
    } else {
      setPostType(type);
    }
  };

  const handleUnifiedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      let newVideoUrl: string | null = null;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (postType === 'reel' && !file.type.startsWith('video/')) continue;
        if (postType !== 'reel' && file.type.startsWith('video/')) continue;

        const folder = file.type.startsWith('video/') ? 'videos' : 'social_media';
        const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        if (file.type.startsWith('video/')) {
          newVideoUrl = downloadURL;
        } else {
          newUrls.push(downloadURL);
        }
      }
      
      if (newVideoUrl) {
        setVideoUrl(newVideoUrl);
        setImageUrls([]);
      } else {
        setImageUrls(prev => {
          const updatedUrls = [...prev, ...newUrls];
          if (updatedUrls.length > 1 && postType !== 'reel') {
            setPostType('carousel');
          }
          return updatedUrls;
        });
        setVideoUrl(null);
      }
      
      if (imageUrls.length === 0 && newUrls.length > 0) {
        setCurrentImageIndex(0);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
    const handleUrlProcessing = async () => {
    const currentUrl = imageUrls[currentImageIndex];
    if (!currentUrl || !currentUrl.startsWith('http') || currentUrl.includes('firebasestorage.googleapis.com')) {
        setUrlError(null);
        return;
    }

    setIsProcessingUrl(true);
    setUrlError(null);
    
    try {
        // Intentamos usar un proxy más robusto para imágenes
        let response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(currentUrl)}`).catch(() => null);
        
        if (!response || !response.ok) {
            // Fallback a corsproxy.io si el primero falla
            response = await fetch(`https://corsproxy.io/?${encodeURIComponent(currentUrl)}`).catch(() => null);
        }

        if (!response || !response.ok) {
            // Si ambos fallan, usar la URL original
            setImageUrls(prev => {
                const newUrls = [...prev];
                newUrls[currentImageIndex] = currentUrl;
                return newUrls;
            });
            setIsProcessingUrl(false);
            return;
        }
        
        const blob = await response.blob();
        await uploadAndSetImage(blob);
    } catch (error) {
        console.error("Error al procesar URL de imagen externa:", error);
        // Fallback final: usar la URL original
        setImageUrls(prev => {
            const newUrls = [...prev];
            newUrls[currentImageIndex] = currentUrl;
            return newUrls;
        });
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

    // Si estamos editando la primera imagen, invalidamos la generada
    if (currentImageIndex === 0) {
      setGeneratedImageUrl('');
    }

    setImageUrls(prev => {
      const next = [...prev];
      next[currentImageIndex] = downloadURL;
      return next;
    });
  };
  
  const handleImproveCopy = async () => {
    if (!copy) return;
    setIsImproving(true);
    
    const primaryAccount = selectedAccounts.length > 0 ? socialAccounts.find(acc => acc.id === selectedAccounts[0]) : null;
    const systemPromptForAI = primaryAccount?.systemPrompt || aiSystemPrompt;
    const copyPromptForAI = primaryAccount?.copyPrompt || DEFAULT_SOCIAL_COPY_PROMPT;

    try {
      const result = await improveSocialMediaCopy(copy, systemPromptForAI, copyPromptForAI);
      if (result) {
        setCopy(result.copy || '');
      }
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
      const content = await generateSocialMediaContentFromTopic(generationQuery, aiSystemPrompt, DEFAULT_SOCIAL_COPY_PROMPT, siteConfig?.searchDomains || []);
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
      const content = await refineSocialMediaContent(shortTitle, copy, refinementQuery, systemPromptForAI, copyPromptForAI, siteConfig?.searchDomains || []);
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
        setImageUrls(prev => {
          const next = [...prev];
          next[currentImageIndex] = downloadURL;
          return next;
        });
        setGeneratedImageUrl('');
    } catch (error) {
        console.error("Cropped image upload error:", error);
    } finally {
        setIsUploading(false);
    }
  };

  const buildWebhookPayload = (state: 'create' | 'approved' | 'scheduled') => {
      const selectedAccountDetails = selectedAccounts
          .map(id => socialAccounts.find(acc => acc.id === id))
          .filter((acc): acc is SocialAccount => !!acc)
          .map(acc => ({ 
            name: acc.name, 
            handle: acc.handle, 
            platform: acc.platform, 
            instagramId: acc.instagramId,
            facebookId: acc.facebookId,
            placidId: acc.placidId, 
            primaryColor: acc.primaryColor, 
            secondaryColor: acc.secondaryColor 
          }));

      const sponsorPayload: { [key: string]: { name: string; logoUrl: string } | null } = { sponsor_1: null, sponsor_2: null, sponsor_3: null, sponsor_4: null };
      
      selectedSponsors
        .map(id => brands.find(b => b.id === id))
        .filter((b): b is Brand => !!b)
        .slice(0, 4)
        .forEach((sponsor, index) => { sponsorPayload[`sponsor_${index + 1}`] = { name: sponsor.name, logoUrl: sponsor.logoUrl }; });
      
      const authorUser = article ? users.find(u => u.id === article.author) : null;
      const authorName = authorUser ? authorUser.name : 'Redacción';
      
      const getFinalImageUrls = () => {
        if (state === 'approved' || state === 'scheduled') {
          if (generatedImageUrl) {
            // Si hay una imagen generada, reemplaza la primera de la lista pero mantiene las demás
            return [generatedImageUrl, ...imageUrls.slice(1)];
          }
          return imageUrls;
        }
        return imageUrls;
      };

      const firstAccount = selectedAccountDetails[0] || {};

      // Determine category from account name to override article category in Make.com
      let category = article?.category || 'A1Toque';
      if (firstAccount.name) {
        const nameLower = firstAccount.name.toLowerCase();
        if (nameLower.includes('unión') || nameLower.includes('union')) category = 'Unión';
        else if (nameLower.includes('colón') || nameLower.includes('colon')) category = 'Colón';
        else if (nameLower.includes('central')) category = 'Central';
        else if (nameLower.includes('newell')) category = "Newell's";
        else category = 'A1Toque';
      }

      return {
        state,
        accounts: selectedAccountDetails,
        // Add account details to root level for webhook compatibility
        placidId: firstAccount.placidId,
        primaryColor: firstAccount.primaryColor,
        secondaryColor: firstAccount.secondaryColor,
        instagramId: firstAccount.instagramId,
        facebookId: firstAccount.facebookId,
        accountName: firstAccount.name,
        category: category,
        club: category,
        author: authorName,
        publisher: currentUser.name,
        imageUrl: ((state === 'approved' || state === 'scheduled') && generatedImageUrl) ? generatedImageUrl : (imageUrls[0] || ''),
        imageUrls: getFinalImageUrls(),
        videoUrl: videoUrl,
        postType: postType,
        imageCount: imageUrls.length,
        hasImages: imageUrls.length > 0,
        title: shortTitle,
        copy: copy,
        sponsorCount: selectedSponsors.length,
        ...sponsorPayload,
        articleUrl: article ? `https://a1toque.com/news/${article.id}` : undefined,
        ...(state === 'scheduled' && scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      };
  };

  const hasChangesSinceLastGeneration = () => {
    if (postType !== 'reel' && shortTitle !== lastGeneratedTitle) return true;
    if (copy !== lastGeneratedCopy) return true;
    if ((imageUrls[0] || '') !== (lastGeneratedBaseImage || '')) return true;
    
    // Compare arrays
    if (selectedSponsors.length !== lastGeneratedSponsors.length) return true;
    if (!selectedSponsors.every(id => lastGeneratedSponsors.includes(id))) return true;
    
    if (selectedAccounts.length !== lastGeneratedAccounts.length) return true;
    if (!selectedAccounts.every(id => lastGeneratedAccounts.includes(id))) return true;
    
    return false;
  };

  const handleGeneratePreview = async () => {
    if (postType === 'reel') {
        if (!videoUrl) {
            alert("Por favor, carga un video primero.");
            return;
        }
        setLastGeneratedTitle(shortTitle);
        setLastGeneratedCopy(copy);
        setLastGeneratedSponsors([...selectedSponsors]);
        setLastGeneratedAccounts([...selectedAccounts]);
        setLastGeneratedBaseImage(imageUrls[0] || '');
        setStatus('preview');
        return;
    }

    if (imageUrls.length === 0) {
        alert("Por favor, carga una imagen primero.");
        return;
    }
    setStatus('creatingPreview');
    const payload = buildWebhookPayload('create');
    const webhookUrl = "/api/publish";
    try {
      const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Webhook failed: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.details) errorMessage += ` - ${errorJson.details}`;
          else if (errorJson.error) errorMessage += ` - ${errorJson.error}`;
        } catch (e) {
          if (errorText) errorMessage += ` - ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      let newImageUrl = responseText.trim();
      
      // Try to parse as JSON if it doesn't look like a direct URL
      if (!newImageUrl.startsWith('http')) {
        try {
          const json = JSON.parse(responseText);
          
          // Helper function to find the first URL in an object
          const findUrl = (obj: any): string | null => {
            if (typeof obj === 'string' && obj.startsWith('http')) return obj;
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                const result = findUrl(obj[key]);
                if (result) return result;
              }
            }
            return null;
          };

          const foundUrl = findUrl(json);
          if (foundUrl) {
            newImageUrl = foundUrl;
          } else {
            // Fallback to common patterns
            newImageUrl = json.url || json.imageUrl || json.image || json.data || responseText;
          }
        } catch (e) {
          // Not JSON, keep as is
        }
      }

      // Remove quotes if any
      newImageUrl = newImageUrl.replace(/^"|"$/g, '');

      if (!newImageUrl.startsWith('http')) {
        if (newImageUrl === 'Accepted') {
           throw new Error(`El webhook de Make.com devolvió "Accepted". Debes agregar un módulo "Webhook Response" al final de tu escenario en Make.com que devuelva la URL de la imagen generada.`);
        }
        throw new Error(`Respuesta inválida del webhook. Se esperaba una URL, pero se recibió: ${newImageUrl.substring(0, 100)}`);
      }
      
      setGeneratedImageUrl(newImageUrl);
      setLastGeneratedTitle(shortTitle);
      setLastGeneratedCopy(copy);
      setLastGeneratedSponsors([...selectedSponsors]);
      setLastGeneratedAccounts([...selectedAccounts]);
      setLastGeneratedBaseImage(imageUrls[0]);
      setStatus('preview');
    } catch (error) {
      console.error("Failed to generate preview:", error);
      alert(error instanceof Error ? error.message : "Error al generar la portada");
      setStatus('error');
    }
  };
  
  const getPlatformIds = () => {
    const selectedAccs = socialAccounts.filter(acc => selectedAccounts.includes(acc.id));
    return {
      instagramId: selectedAccs.find(acc => acc.instagramId)?.instagramId,
      facebookId: selectedAccs.find(acc => acc.facebookId)?.facebookId,
      placidId: selectedAccs.find(acc => acc.placidId)?.placidId,
    };
  };

  const handleSaveDraft = async () => {
    const platformIds = getPlatformIds();
    const postData = {
        originalArticleId: article?.id || draftPost?.originalArticleId || 'standalone',
        originalArticleTitle: article?.title || draftPost?.originalArticleTitle || shortTitle,
        postedAt: draftPost?.id ? (draftPost.postedAt || new Date().toISOString()) : new Date().toISOString(),
        postedBy: draftPost?.id ? (draftPost.postedBy || currentUser.id) : currentUser.id,
        imageUrl: generatedImageUrl || imageUrls[0] || '',
        imageUrls: imageUrls,
        videoUrl: videoUrl,
        postType: postType,
        originalImageUrl: imageUrls[0] || '',
        titleOverlay: shortTitle,
        copy: copy,
        postedToAccounts: selectedAccounts,
        ...platformIds,
        imageCount: imageUrls.length,
        associatedSponsors: selectedSponsors,
        sources: sources,
        status: 'draft' as const,
        ...(isScheduling && scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
    };

    try {
        if (draftPost && draftPost.id) {
            await onUpdateSocialPost({ ...postData, id: draftPost.id });
        } else {
            await onAddSocialPost(postData);
        }
        onClose();
    } catch (error) {
        console.error("Error saving draft:", error);
        alert("Error al guardar el borrador.");
    }
  };
  
  const handleFinalPublish = async () => {
    setStatus('publishing');
    setShowConfirmPublish(false);
    
    const isScheduled = isScheduling && scheduledAt;
    const payload = buildWebhookPayload(isScheduled ? 'scheduled' : 'approved');
    const webhookUrl = "/api/publish";
    
    try {
      console.log(`[Publish] Sending payload to webhook: ${webhookUrl}`, payload);
      const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Publish] Webhook error response: ${response.status}`, errorText);
        let errorMessage = `Webhook failed: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.details) errorMessage += ` - ${errorJson.details}`;
          else if (errorJson.error) errorMessage += ` - ${errorJson.error}`;
        } catch (e) {
          if (errorText) errorMessage += ` - ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }
      
      console.log("[Publish] Webhook success");
      
      const platformIds = getPlatformIds();
      const postData = {
        originalArticleId: article?.id || draftPost?.originalArticleId || 'standalone',
        originalArticleTitle: article?.title || draftPost?.originalArticleTitle || shortTitle,
        postedAt: new Date().toISOString(),
        postedBy: draftPost?.id ? (draftPost.postedBy || currentUser.id) : currentUser.id,
        imageUrl: generatedImageUrl || imageUrls[0] || '',
        imageUrls: imageUrls,
        videoUrl: videoUrl,
        postType: postType,
        originalImageUrl: imageUrls[0] || '',
        titleOverlay: shortTitle,
        copy: copy,
        postedToAccounts: selectedAccounts,
        ...platformIds,
        imageCount: imageUrls.length,
        associatedSponsors: selectedSponsors,
        sources: sources,
        status: isScheduled ? 'scheduled' as const : 'success' as const,
        ...(isScheduled ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      };

      if (draftPost && draftPost.id) {
        await onUpdateSocialPost({ ...postData, id: draftPost.id });
      } else {
        await onAddSocialPost(postData);
      }
      setStatus('success');
      
      // Cerrar automáticamente después de un momento de éxito
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to publish/schedule:", error);
      setStatus('error');
    }
  };


  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300 font-sans selection:bg-neon selection:text-black">
       {/* MODAL DE REVISIÓN Y MEJORA (REFINEMENT) */}
       {isRefinementVisible && (
          <div className="fixed inset-0 z-[350] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300">
             <div className="max-w-4xl w-full bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
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

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                               <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center">
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

       {isCropperOpen && imageUrls[currentImageIndex] && (
        <ImageCropper imageUrl={imageUrls[currentImageIndex]} onClose={() => setIsCropperOpen(false)} onSave={handleCropSave} />
       )}

       {/* FULL IMAGE PREVIEW MODAL */}
       {showFullImage && (generatedImageUrl || imageUrls[currentImageIndex]) && (
          <div 
            className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300 cursor-zoom-out"
            onClick={() => setShowFullImage(false)}
          >
             <img 
                src={generatedImageUrl || imageUrls[currentImageIndex] || ''} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
                alt="Full Preview" 
             />
             <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                <X size={32} />
             </button>
          </div>
       )}

       {/* MODAL DE PROGRAMACIÓN */}
       {showScheduleModal && (
          <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="max-w-md w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 opacity-50" />
                
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center text-blue-500">
                    <Calendar size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-oswald font-black text-white uppercase italic tracking-tighter">PROGRAMAR POSTEO</h3>
                    <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">
                       SELECCIONA LA FECHA Y HORA DE PUBLICACIÓN
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-6">
                  {/* Calendar Header */}
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-white font-bold uppercase tracking-wider text-sm">
                      {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </span>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 mb-2">
                    {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(day => (
                      <div key={day} className="text-center text-[10px] font-bold text-gray-500 uppercase">{day}</div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {(() => {
                      const monthStart = startOfMonth(currentMonth);
                      const monthEnd = endOfMonth(monthStart);
                      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

                      const rows = [];
                      let days = [];
                      let day = startDate;
                      let formattedDate = '';

                      while (day <= endDate) {
                        for (let i = 0; i < 7; i++) {
                          formattedDate = format(day, 'd');
                          const cloneDay = day;
                          const isSelected = isSameDay(day, selectedDate);
                          const isCurrentMonth = isSameMonth(day, monthStart);
                          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                          days.push(
                            <button
                              key={day.toString()}
                              onClick={() => !isPast && setSelectedDate(cloneDay)}
                              disabled={isPast}
                              className={`p-2 w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs transition-all ${
                                !isCurrentMonth ? 'text-gray-700' : 
                                isPast ? 'text-gray-700 cursor-not-allowed opacity-50' :
                                isSelected ? 'bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 
                                'text-gray-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {formattedDate}
                            </button>
                          );
                          day = addDays(day, 1);
                        }
                        rows.push(
                          <div className="grid grid-cols-7 gap-1" key={day.toString()}>
                            {days}
                          </div>
                        );
                        days = [];
                      }
                      return rows;
                    })()}
                  </div>
                </div>

                {/* Time Selector */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-400">
                    <Clock size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Hora de publicación</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-black border border-white/10 hover:border-blue-500/50 focus-within:border-blue-500 rounded-xl px-4 py-2 transition-all shadow-inner">
                    <select 
                      value={selectedTime.split(':')[0]} 
                      onChange={(e) => setSelectedTime(`${e.target.value}:${selectedTime.split(':')[1]}`)}
                      className="bg-transparent text-white font-mono text-lg outline-none cursor-pointer appearance-none text-center hover:text-blue-400 transition-colors"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const h = i.toString().padStart(2, '0');
                        return <option key={`h-${h}`} value={h} className="bg-[#111] text-white">{h}</option>;
                      })}
                    </select>
                    <span className="text-blue-500 font-mono text-lg font-bold animate-pulse">:</span>
                    <select 
                      value={selectedTime.split(':')[1]} 
                      onChange={(e) => setSelectedTime(`${selectedTime.split(':')[0]}:${e.target.value}`)}
                      className="bg-transparent text-white font-mono text-lg outline-none cursor-pointer appearance-none text-center hover:text-blue-400 transition-colors"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                    >
                      {Array.from({ length: 12 }).map((_, i) => {
                        const m = (i * 5).toString().padStart(2, '0');
                        return <option key={`m-${m}`} value={m} className="bg-[#111] text-white">{m}</option>;
                      })}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                  <button 
                    onClick={() => {
                       const [hours, minutes] = selectedTime.split(':').map(Number);
                       const scheduledDateTime = new Date(selectedDate);
                       scheduledDateTime.setHours(hours, minutes, 0, 0);
                       
                       setScheduledAt(scheduledDateTime.toISOString());
                       setIsScheduling(true);
                       setShowScheduleModal(false);
                       setShowConfirmPublish(true);
                    }} 
                    className="w-full py-4 bg-blue-500 text-white font-black uppercase italic text-[11px] tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_20px_rgba(59,130,246,0.2)]"
                  >
                    CONFIRMAR FECHA Y HORA
                  </button>
                  <button 
                    onClick={() => setShowScheduleModal(false)} 
                    className="w-full py-3 bg-white/5 text-gray-500 font-black uppercase italic text-[9px] tracking-widest rounded-xl hover:text-white transition-all"
                  >
                    CANCELAR
                  </button>
                </div>
            </div>
          </div>
       )}

       {/* MODAL DE CONFIRMACIÓN DE PUBLICACIÓN */}
       {showConfirmPublish && (
          <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="max-w-sm w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 opacity-50 ${isScheduling ? 'bg-blue-500' : 'bg-neon'}`} />
                <div className={`w-16 h-16 border rounded-full flex items-center justify-center mx-auto mb-6 ${isScheduling ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-neon/10 border-neon/30 text-neon'}`}>
                  {isScheduling ? <Calendar size={32} className="animate-pulse" /> : <AlertCircle size={32} className="animate-pulse" />}
                </div>
                <h3 className="text-2xl font-oswald font-black text-white uppercase italic mb-3 tracking-tighter">
                   {isScheduling ? '¿CONFIRMAR PROGRAMACIÓN?' : '¿CONFIRMAR ENVÍO?'}
                </h3>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 leading-relaxed">
                   {isScheduling 
                      ? `El posteo quedará programado para el ${new Date(scheduledAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}.` 
                      : 'Se enviará a todas las plataformas seleccionadas.'}
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleFinalPublish} 
                    className={`w-full py-4 font-black uppercase italic text-[11px] tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all ${isScheduling ? 'bg-blue-500 text-white shadow-[0_10px_20px_rgba(59,130,246,0.2)]' : 'bg-neon text-black shadow-[0_10px_20px_rgba(0,255,157,0.2)]'}`}
                  >
                    {isScheduling ? 'SÍ, PROGRAMAR POSTEO' : 'SÍ, PUBLICAR AHORA'}
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
                          <div className={`absolute inset-0 border-4 rounded-full ${isScheduling ? 'border-blue-500/10' : 'border-neon/10'}`} />
                          <div className={`absolute inset-0 border-4 rounded-full border-t-transparent animate-spin ${isScheduling ? 'border-blue-500' : 'border-neon'}`} />
                          <div className={`absolute inset-0 flex items-center justify-center ${isScheduling ? 'text-blue-500' : 'text-neon'}`}>
                             {isScheduling ? <Calendar size={40} className="animate-pulse" /> : <Send size={40} className="animate-pulse" />}
                          </div>
                       </>
                    ) : (
                       <div className={`absolute inset-0 rounded-full flex items-center justify-center text-black animate-in zoom-in duration-500 ${isScheduling ? 'bg-blue-500' : 'bg-neon'}`}>
                          <Check size={60} strokeWidth={4} />
                       </div>
                    )}
                 </div>
                 
                 <h3 className="text-3xl font-oswald font-black text-white uppercase italic mb-4 tracking-tighter">
                    {status === 'publishing' 
                       ? (isScheduling ? 'PROGRAMANDO...' : 'PUBLICANDO...') 
                       : (isScheduling ? '¡PROGRAMADO CON ÉXITO!' : '¡PUBLICADO CON ÉXITO!')}
                 </h3>
                 <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] leading-relaxed max-w-[250px] mx-auto">
                    {status === 'publishing' 
                       ? (isScheduling ? 'Estamos guardando la programación de tu posteo. Por favor, no cierres esta ventana.' : 'Estamos enviando tu contenido a las redes sociales seleccionadas. Por favor, no cierres esta ventana.') 
                       : (isScheduling ? 'Tu posteo ha sido programado correctamente. Volviendo al panel de control...' : 'Tu posteo ya está en camino. Volviendo al panel de control...')}
                 </p>
              </div>
           </div>
        )}

       <div className="max-w-4xl w-full bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col h-[90vh] lg:h-[85vh] overflow-hidden relative">
          {/* Header */}
          <header className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-black/50 flex-shrink-0">
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
                      {draftPost?.id ? 'REVISIÓN BORRADOR' : 'NUEVO POST SOCIAL'}
                   </h1>
                </div>
                {article?.title || draftPost?.originalArticleTitle ? (
                    <>
                        <div className="h-4 w-px bg-white/10" />
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate max-w-[300px]">
                        {article?.title || draftPost?.originalArticleTitle}
                        </p>
                    </>
                ) : null}
             </div>
             
             <div className="flex items-center gap-4">
                {/* Account Dropdown */}
                <div className="relative">
                   <button 
                      onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                   >
                      <div className="flex -space-x-2">
                         {selectedAccounts.length > 0 ? (
                            selectedAccounts.slice(0, 1).map(id => {
                               const acc = availableSocialAccounts.find(a => a.id === id);
                               if (!acc) return null;
                               return (
                                  <div key={id} className="w-5 h-5 rounded-full border border-black overflow-hidden bg-neutral-800">
                                     {acc.profileImageUrl ? <img src={acc.profileImageUrl} className="w-full h-full object-cover" /> : null}
                                  </div>
                               );
                            })
                         ) : (
                            <div className="w-5 h-5 rounded-full border border-black overflow-hidden bg-neutral-800 flex items-center justify-center">
                               <AtSign size={10} className="text-gray-500" />
                            </div>
                         )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                         {selectedAccounts.length === 0 ? 'SELECCIONAR CUENTA' : availableSocialAccounts.find(a => a.id === selectedAccounts[0])?.name || ''}
                      </span>
                   </button>

                   {showAccountDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                         <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-2 py-1 mb-1">PERSONALIDAD</div>
                         <div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                            {availableSocialAccounts.map(account => (
                               <button 
                                  key={account.id} 
                                  onClick={() => {
                                      setSelectedAccounts([account.id]);
                                      setShowAccountDropdown(false);
                                  }}
                                  className={`flex items-center justify-between px-2 py-2 rounded-lg transition-all ${selectedAccounts.includes(account.id) ? 'bg-neon/10 text-neon' : 'hover:bg-white/5 text-gray-300'}`}
                               >
                                  <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 bg-neutral-800">
                                        {account.profileImageUrl && <img src={account.profileImageUrl} className="w-full h-full object-cover" />}
                                     </div>
                                     <span className="text-xs font-bold uppercase tracking-tight">{account.name}</span>
                                  </div>
                                  {selectedAccounts.includes(account.id) && <Check size={14} strokeWidth={3} />}
                               </button>
                            ))}
                         </div>
                      </div>
                   )}
                </div>

                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white transition-all">
                   <X size={18} />
                </button>
             </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden p-4">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
                {/* Visual Identity (Left) */}
                <div className="col-span-1 lg:col-span-5 flex flex-col space-y-4 h-full overflow-y-auto custom-scrollbar pr-2 pb-4">
                   <div className="flex items-center justify-between">
                      <h2 className="text-[10px] font-black text-neon uppercase tracking-[0.4em]">01. TIPO DE POSTEO</h2>
                      {article && (
                        <button 
                          onClick={handleLoadArticleImages}
                          className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-gray-400 hover:text-white transition-all"
                        >
                          <Plus size={12} />
                          CARGAR IMÁGENES DE LA NOTA
                        </button>
                      )}
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Tipo de Posteo</label>
                      <div className="flex gap-2">
                        {(['post', 'carousel', 'reel'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => handlePostTypeChange(type)}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                              postType === type 
                                ? 'bg-neon text-black border-neon' 
                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {type.toUpperCase()}
                          </button>
                        ))}
                      </div>
                   </div>

                   {postType !== 'reel' && (
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Título en Imagen</label>
                        <textarea 
                          value={shortTitle} 
                          onChange={e => setShortTitle(e.target.value)} 
                          maxLength={26} 
                          rows={1}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-oswald font-black uppercase italic outline-none resize-none leading-tight tracking-tighter focus:border-neon transition-all" 
                          placeholder="ESCRIBE EL TÍTULO AQUÍ..." 
                        />
                     </div>
                   )}
                   
                   <div 
                      className="relative flex-1 min-h-[150px] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#050505] group shadow-2xl flex flex-col"
                   >
                      {/* Image Controls Overlay */}
                      <div className="absolute top-3 right-3 z-30 flex gap-2 opacity-70 hover:opacity-100 transition-opacity duration-200">
                         <button 
                            onClick={(e) => { e.stopPropagation(); unifiedInputRef.current?.click(); }} 
                            className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg text-white transition-all border border-white/10 shadow-lg" 
                            title="Subir Archivo"
                            disabled={isUploading}
                          >
                             {isUploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                         </button>
                         {imageUrls.length > 0 && (
                           <>
                            <button onClick={(e) => { e.stopPropagation(); setIsCropperOpen(true); }} className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg text-white transition-all border border-white/10 shadow-lg" title="Recortar">
                               <Crop size={16} />
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (imageUrls.length > 1) {
                                  setImageUrls(prev => prev.filter((_, i) => i !== currentImageIndex));
                                  setCurrentImageIndex(prev => Math.max(0, prev - 1));
                                  if (currentImageIndex === 0) setGeneratedImageUrl('');
                                } else {
                                  setImageUrls([]);
                                  setGeneratedImageUrl('');
                                }
                              }} 
                              className="p-2 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md rounded-lg text-red-500 transition-all border border-red-500/20 shadow-lg" 
                              title="Eliminar Imagen"
                            >
                               <Trash2 size={16} />
                            </button>
                           </>
                         )}
                      </div>
                      <input type="file" ref={unifiedInputRef} onChange={handleUnifiedUpload} hidden accept={postType === 'reel' ? 'video/*' : 'image/*'} multiple />

                      {isUploading && (
                         <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                            <Loader2 className="animate-spin text-neon size-12 mb-4" />
                            <p className="text-neon text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">SUBIENDO ARCHIVO...</p>
                         </div>
                      )}

                      {status === 'creatingPreview' && (
                         <div className="absolute inset-0 z-20 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-neon size-8 mb-3" />
                            <p className="text-neon text-[9px] font-black uppercase tracking-[0.5em] animate-pulse">GENERANDO...</p>
                         </div>
                      )}
                      
                      {generatedImageUrl || imageUrls.length > 0 || (postType === 'reel' && videoUrl) ? (
                         <div className="w-full h-full flex items-center justify-center bg-[#050505] cursor-zoom-in relative" onClick={() => !(postType === 'reel' && videoUrl) && setShowFullImage(true)}>
                            {postType === 'reel' && videoUrl ? (
                               <video src={videoUrl} controls className="max-w-full max-h-full" />
                            ) : (
                               <img 
                                 src={(currentImageIndex === 0 && generatedImageUrl) ? generatedImageUrl : (imageUrls[currentImageIndex] || '')} 
                                 alt="Preview" 
                                 className="max-w-full max-h-full object-contain transition-transform duration-[20s] group-hover:scale-105" 
                               />
                            )}
                             
                             {/* Carousel Controls */}
                             {!(postType === 'reel' && videoUrl) && imageUrls.length > 1 && (
                               <>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : imageUrls.length - 1)); }}
                                   className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all z-40"
                                 >
                                   <ChevronLeft size={20} />
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev < imageUrls.length - 1 ? prev + 1 : 0)); }}
                                   className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all z-40"
                                 >
                                   <ChevronRight size={20} />
                                 </button>
                                 <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1 z-40">
                                   {imageUrls.map((_, idx) => (
                                     <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentImageIndex ? 'bg-neon' : 'bg-white/20'}`} />
                                   ))}
                                 </div>
                               </>
                             )}
                            
                            {/* OVERLAY BUTTONS */}
                            {status !== 'creatingPreview' && currentImageIndex === 0 && postType !== 'reel' && (
                               <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 pointer-events-none z-30">
                                  <button 
                                     onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (selectedAccounts.length > 0 && copy.trim()) handleGeneratePreview(); 
                                     }}
                                     disabled={selectedAccounts.length === 0 || !copy.trim()}
                                     className="pointer-events-auto px-4 py-2.5 bg-black/60 backdrop-blur-md border border-neon/30 text-neon text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-neon/20 hover:border-neon hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                  >
                                     <Sparkles size={14} />
                                     {generatedImageUrl ? 'RE-GENERAR PORTADA' : 'GENERAR PORTADA'}
                                  </button>
                                  {generatedImageUrl && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setGeneratedImageUrl(''); }}
                                      className="pointer-events-auto px-4 py-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2 w-fit"
                                    >
                                      <RotateCcw size={14} />
                                      VER ORIGINAL
                                    </button>
                                  )}
                               </div>
                            )}
                         </div>
                      ) : (
                         <div className="h-full flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:text-white transition-colors border-2 border-dashed border-white/10 hover:border-neon/50 rounded-2xl m-4" onClick={() => unifiedInputRef.current?.click()}>
                            <UploadCloud size={48} className="mb-4 text-neon/50" />
                            <p className="text-xs font-black uppercase tracking-widest text-white">Subir {postType === 'reel' ? 'Video' : 'Imágenes'}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-2">Click para seleccionar archivos</p>
                         </div>
                      )}
                   </div>

                   {/* Thumbnail Strip for Carousel */}
                   {postType === 'carousel' && imageUrls.length > 0 && (
                     <div className="flex gap-2 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                       {imageUrls.map((url, idx) => (
                         <button
                           key={idx}
                           onClick={() => setCurrentImageIndex(idx)}
                           className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                             idx === currentImageIndex ? 'border-neon' : 'border-transparent opacity-50 hover:opacity-100'
                           }`}
                         >
                           <img src={(idx === 0 && generatedImageUrl) ? generatedImageUrl : url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                         </button>
                       ))}
                       <button
                         onClick={() => unifiedInputRef.current?.click()}
                         className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-white/10 hover:border-neon/50 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                       >
                         <Plus size={20} />
                       </button>
                     </div>
                   )}

                   {/* URL Input */}
                   {postType !== 'reel' && (
                     <div className="w-full">
                       <input 
                          type="text" 
                          value={imageUrls[currentImageIndex] || ''} 
                          onChange={e => {
                            const val = e.target.value;
                            setImageUrls(prev => {
                              const next = [...prev];
                              next[currentImageIndex] = val;
                              return next;
                            });
                          }} 
                          onBlur={handleUrlProcessing}
                          placeholder="Pegar URL de imagen..." 
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white focus:border-neon outline-none transition-all shadow-lg placeholder:text-gray-500" 
                       />
                     </div>
                   )}

                   {/* Patrocinios */}
                   <div className="pt-4 border-t border-white/5">
                      <div className="flex flex-col gap-3">
                         <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-neon uppercase tracking-[0.4em]">03. PATROCINIOS</h3>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{selectedSponsors.length} SELECCIONADOS</span>
                         </div>
                         
                         <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {brands.map(brand => (
                               <button 
                                  key={brand.id} 
                                  onClick={() => setSelectedSponsors(p => p.includes(brand.id) ? p.filter(id => id !== brand.id) : [...p, brand.id])}
                                  className={`relative group flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all overflow-hidden ${
                                     selectedSponsors.includes(brand.id) 
                                        ? 'bg-neon/5 border-neon shadow-[0_0_20px_rgba(0,255,157,0.1)]' 
                                        : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                                  }`}
                               >
                                  {selectedSponsors.includes(brand.id) && (
                                     <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-neon flex items-center justify-center text-black shadow-[0_0_10px_rgba(0,255,157,0.5)]">
                                        <Check size={6} strokeWidth={4} />
                                     </div>
                                  )}
                                  
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${selectedSponsors.includes(brand.id) ? 'bg-white/10' : 'bg-black/50 group-hover:bg-white/5'}`}>
                                     {brand.logoUrl ? (
                                        <img src={brand.logoUrl} className={`w-4 h-4 object-contain transition-all ${selectedSponsors.includes(brand.id) ? 'scale-110' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`} alt={brand.name} />
                                     ) : (
                                        <Building size={12} className={selectedSponsors.includes(brand.id) ? 'text-neon' : 'text-gray-600'} />
                                     )}
                                  </div>
                                  
                                  <span className={`text-[7px] font-black uppercase tracking-wider text-center line-clamp-1 w-full transition-colors ${selectedSponsors.includes(brand.id) ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                     {brand.name}
                                  </span>
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>

                </div>

                {/* Narrative (Right) */}
                <div className="col-span-1 lg:col-span-7 flex flex-col space-y-4 h-full overflow-y-auto custom-scrollbar pr-2 pb-4">
                   <div className="flex items-center justify-between">
                      <h2 className="text-[10px] font-black text-neon uppercase tracking-[0.4em]">02. NARRATIVA Y COPY</h2>
                      <div className="flex items-center gap-2">
                         {sources.length > 0 && (
                            <button
                               onClick={() => setIsRefinementVisible(true)}
                               className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-400 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-white/10 transition-all border border-white/10"
                            >
                               <Globe size={12} /> {sources.length} FUENTES
                            </button>
                         )}
                         <button 
                            onClick={() => setIsRefinementVisible(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-neon text-black text-[9px] font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(0,255,157,0.2)]"
                         >
                            <Sparkles size={12} /> REVISAR Y MEJORAR
                         </button>
                      </div>
                   </div>
                   
                   <div className="flex-1 relative min-h-[150px] flex flex-col">
                      <textarea 
                         value={copy} 
                         onChange={e => setCopy(e.target.value)} 
                         className="flex-1 w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-sm text-gray-300 focus:text-white focus:border-neon/20 outline-none leading-relaxed resize-none transition-all custom-scrollbar" 
                         placeholder="Desarrolla el mensaje principal..."
                      />
                       <div className="absolute bottom-3 right-5 text-[9px] font-mono text-gray-500 font-bold">
                          {copy.length} CARACTERES
                       </div>
                    </div>

                    {!article && !draftPost && (
                       <div className="pt-4 border-t border-white/5">
                         <div className="flex gap-3">
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

             </div>
          </main>

          {/* Footer Actions */}
          <footer className="h-16 border-t border-white/5 bg-black/50 flex items-center justify-between px-6 flex-shrink-0">
             <div className="flex items-center gap-4">
                <button 
                   onClick={onClose} 
                   className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-all"
                >
                   DESCARTAR
                </button>
                
                {draftPost?.id && onDeleteSocialPost && (
                   <button 
                      onClick={() => setShowDeleteConfirm(true)} 
                      className="text-red-500/50 text-[10px] font-black uppercase tracking-[0.3em] hover:text-red-500 transition-all flex items-center gap-2"
                   >
                      <Trash2 size={14} /> ELIMINAR
                   </button>
                )}
             </div>
             
             <div className="flex items-center gap-4">
                <button 
                   onClick={handleSaveDraft} 
                   className="px-4 py-2 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
                >
                   <Save size={16} /> GUARDAR BORRADOR
                </button>
                
                {(status === 'preview' && !hasChangesSinceLastGeneration()) || postType === 'reel' ? (
                   <div className="flex items-center gap-3">
                      <button 
                         onClick={() => setShowScheduleModal(true)} 
                         disabled={postType === 'reel' ? (!copy.trim() || !videoUrl || selectedAccounts.length === 0) : (!copy.trim() || !shortTitle.trim() || selectedAccounts.length === 0)}
                         className="px-6 py-2 bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.05] active:scale-95 transition-all shadow-[0_0_50px_rgba(59,130,246,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         <Calendar size={16} strokeWidth={3} /> PROGRAMAR
                      </button>
                      <button 
                         onClick={() => {
                            setIsScheduling(false);
                            setShowConfirmPublish(true);
                         }} 
                         disabled={postType === 'reel' ? (!copy.trim() || !videoUrl || selectedAccounts.length === 0) : (!copy.trim() || !shortTitle.trim() || selectedAccounts.length === 0)}
                         className="px-8 py-2 bg-neon text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.05] active:scale-95 transition-all shadow-[0_0_50px_rgba(0,255,157,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         <Send size={16} strokeWidth={3} /> PUBLICAR
                      </button>
                   </div>
                ) : (
                   <button 
                      onClick={handleGeneratePreview} 
                      disabled={selectedAccounts.length === 0 || status === 'creatingPreview' || !copy.trim() || !shortTitle.trim() || imageUrls.length === 0} 
                      className="px-8 py-2 bg-neon text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.05] active:scale-95 transition-all shadow-[0_0_50px_rgba(0,255,157,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      {status === 'preview' ? 'RE-GENERAR PORTADA' : 'GENERAR PORTADA'} <ArrowRight size={16} strokeWidth={3} />
                   </button>
                )}
             </div>
          </footer>
       </div>
       
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="max-w-md w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-red-500 size-8" />
              </div>
              <h3 className="text-xl font-oswald font-black italic uppercase text-white mb-2">¿Eliminar posteo?</h3>
              <p className="text-gray-400 text-sm mb-8">
                Esta acción no se puede deshacer. El borrador será eliminado permanentemente.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-white/5 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (draftPost?.id && onDeleteSocialPost) {
                      onDeleteSocialPost(draftPost.id);
                      onClose();
                    }
                  }}
                  className="flex-1 py-3 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Type Change Confirmation Modal */}
        {pendingPostType && (
          <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="max-w-md w-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-red-500 size-8" />
              </div>
              <h3 className="text-xl font-oswald font-black italic uppercase text-white mb-2">¿Descartar cambios?</h3>
              <p className="text-gray-400 text-sm mb-8">
                Cambiar a {pendingPostType.toUpperCase()} descartará {pendingPostType === 'reel' ? 'las imágenes actuales' : 'el video actual'}. ¿Deseas continuar?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPendingPostType(null)}
                  className="flex-1 py-3 bg-white/5 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (pendingPostType === 'reel') {
                      setImageUrls([]);
                      setGeneratedImageUrl('');
                    } else {
                      setVideoUrl(null);
                    }
                    setPostType(pendingPostType);
                    setPendingPostType(null);
                  }}
                  className="flex-1 py-3 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all"
                >
                  Descartar
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
