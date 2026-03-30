import React, { useState, useEffect, useRef } from 'react';
import { SocialAccount, SocialPlatform } from '../../../types';
import { X, Sparkles, MessageSquare, Info, AtSign, UploadCloud, Loader2 } from 'lucide-react';
import { storage } from '../../../services/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

interface SocialAccountEditorModalProps {
  account: SocialAccount | null;
  onClose: () => void;
  onSave: (data: SocialAccount | Omit<SocialAccount, 'id'>) => void;
}

export const SocialAccountEditorModal: React.FC<SocialAccountEditorModalProps> = ({ account, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<SocialAccount, 'id'>>({ 
    name: '', 
    handle: '', 
    platform: 'instagram', 
    profileImageUrl: '', 
    instagramId: '',
    facebookId: '',
    placidId: '',
    primaryColor: '',
    secondaryColor: '',
    systemPrompt: '', 
    copyPrompt: '' 
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    
    if (account) {
      setFormData({ 
        name: account.name, 
        handle: account.handle, 
        platform: account.platform, 
        profileImageUrl: account.profileImageUrl,
        instagramId: account.instagramId || (account as any).accountId || (account as any).instagramAccountId || '',
        facebookId: account.facebookId || (account as any).facebookAccountId || '',
        placidId: account.placidId || (account as any).placidTemplateId || '',
        primaryColor: account.primaryColor || '#000000',
        secondaryColor: account.secondaryColor || '#000000',
        systemPrompt: account.systemPrompt || '',
        copyPrompt: account.copyPrompt || '',
      });
    } else {
      setFormData({ 
        name: '', 
        handle: '', 
        platform: 'instagram', 
        profileImageUrl: '', 
        instagramId: '',
        facebookId: '',
        placidId: '', 
        primaryColor: '#000000', 
        secondaryColor: '#000000', 
        systemPrompt: '', 
        copyPrompt: '' 
      });
    }
    setProfileImageFile(null);
    isInitialized.current = true;
  }, [account]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(p => ({ ...p, profileImageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    let profileImageUrl = formData.profileImageUrl;
    if (profileImageFile) {
        setIsUploading(true);
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(profileImageFile);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
            const storageRef = ref(storage, `accounts/${formData.name || 'new'}-${Date.now()}.png`);
            const snapshot = await uploadString(storageRef, base64, 'data_url');
            profileImageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Image upload error:", error);
            setIsUploading(false);
            return;
        } finally {
            setIsUploading(false);
        }
    }
    
    const dataToSave = { ...formData, profileImageUrl };
    if (account?.id) {
      onSave({ ...dataToSave, id: account.id });
    } else {
      onSave(dataToSave);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0 md:p-6">
      <div className="bg-[#0a0a0a] border border-white/10 md:rounded-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div>
            <h3 className="text-2xl font-oswald font-black italic text-white uppercase tracking-tighter">
                {account ? 'CONFIGURAR CUENTA & IA' : 'REGISTRAR NUEVA CUENTA'}
            </h3>
            <p className="text-neon text-[10px] font-black uppercase tracking-[0.3em] mt-1 opacity-70">Personalización de voz social</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-full transition-all border border-white/5">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Columna de Datos Básicos */}
            <div className="lg:col-span-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Nombre Público</label>
                        <input 
                            type="text" 
                            placeholder="Ej. Unión A1Toque" 
                            value={formData.name || ''} 
                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} 
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-neon outline-none" 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Handle / Usuario</label>
                        <input 
                            type="text" 
                            placeholder="@handle" 
                            value={formData.handle || ''} 
                            onChange={e => setFormData(p => ({ ...p, handle: e.target.value }))} 
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-blue-400 font-bold focus:border-neon outline-none" 
                        />
                    </div>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-neon uppercase tracking-[0.2em]">IDs de Integración</label>
                        <div className="px-2 py-0.5 bg-neon/10 rounded text-[8px] font-bold text-neon uppercase tracking-tighter">Webhook Ready</div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-bold text-gray-500 uppercase ml-1">ID Instagram</label>
                            <input 
                                type="text" 
                                placeholder="ID Numérico" 
                                value={formData.instagramId || ''} 
                                onChange={e => setFormData(p => ({ ...p, instagramId: e.target.value }))} 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[11px] text-white focus:border-neon outline-none" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-bold text-gray-500 uppercase ml-1">ID Facebook</label>
                            <input 
                                type="text" 
                                placeholder="ID Numérico" 
                                value={formData.facebookId || ''} 
                                onChange={e => setFormData(p => ({ ...p, facebookId: e.target.value }))} 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[11px] text-white focus:border-neon outline-none" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-bold text-gray-500 uppercase ml-1">ID Placid</label>
                            <input 
                                type="text" 
                                placeholder="Template ID" 
                                value={formData.placidId || ''} 
                                onChange={e => setFormData(p => ({ ...p, placidId: e.target.value }))} 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[11px] text-white focus:border-neon outline-none" 
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Plataforma</label>
                        <select 
                            value={formData.platform || 'instagram'} 
                            onChange={e => setFormData(p => ({ ...p, platform: e.target.value as SocialPlatform }))} 
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-neon outline-none appearance-none cursor-pointer"
                        >
                            <option value="instagram">📸 Instagram</option>
                            <option value="twitter">𝕏 Twitter / X</option>
                            <option value="facebook">👥 Facebook</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1 space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase pl-1">Colores</label>
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    value={formData.primaryColor || '#000000'} 
                                    onChange={e => setFormData(p => ({ ...p, primaryColor: e.target.value }))} 
                                    className="w-full h-10 bg-white/[0.03] border border-white/10 rounded-xl p-1 cursor-pointer" 
                                />
                                <input 
                                    type="color" 
                                    value={formData.secondaryColor || '#000000'} 
                                    onChange={e => setFormData(p => ({ ...p, secondaryColor: e.target.value }))} 
                                    className="w-full h-10 bg-white/[0.03] border border-white/10 rounded-xl p-1 cursor-pointer" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Imagen de Perfil</label>
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-black border border-white/10 rounded-xl overflow-hidden shadow-xl flex-shrink-0 relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                            {formData.profileImageUrl ? (
                                <img src={formData.profileImageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-800"><AtSign size={24} /></div>
                            )}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <UploadCloud size={20} className="text-neon" />
                            </div>
                        </div>
                        <input 
                            type="file"
                            ref={avatarInputRef}
                            onChange={handleFileUpload}
                            hidden
                            accept="image/*"
                        />
                        <input 
                            type="text" 
                            placeholder="URL de la imagen..." 
                            value={formData.profileImageUrl || ''} 
                            onChange={e => setFormData(p => ({ ...p, profileImageUrl: e.target.value }))} 
                            className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-3 text-[10px] text-gray-400 focus:border-neon outline-none" 
                        />
                    </div>
                </div>

                <div className="p-3 bg-neon/5 border border-neon/10 rounded-xl">
                    <div className="flex gap-2 text-neon mb-1"><Info size={14} /> <span className="text-[8px] font-black uppercase tracking-widest">Diferenciador</span></div>
                    <p className="text-[10px] text-gray-500 leading-tight font-medium">Los prompts configurados aquí tendrán prioridad sobre el prompt global cuando se genere contenido para esta cuenta.</p>
                </div>
            </div>

            {/* Columna de Inteligencia Artificial */}
            <div className="lg:col-span-7 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={18} className="text-neon" />
                        <label className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Personalidad de la IA (System Prompt)</label>
                    </div>
                    <div className="relative">
                        <textarea 
                            placeholder="Ej: Actúa como el hincha más apasionado de Rosario Central. Usa modismos rosarinos y enfócate en el orgullo de Arroyito..." 
                            value={formData.systemPrompt || ''} 
                            onChange={e => setFormData(p => ({...p, systemPrompt: e.target.value}))} 
                            rows={6} 
                            className="w-full bg-black border border-white/10 rounded-3xl p-6 pr-12 text-sm text-gray-300 font-mono focus:border-neon outline-none shadow-inner leading-relaxed custom-scrollbar" 
                        />
                        {formData.systemPrompt && (
                            <button 
                                onClick={() => setFormData(p => ({...p, systemPrompt: ''}))}
                                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-full transition-colors"
                                title="Borrar texto"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest pl-2">Define QUIÉN es la IA para esta red.</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={18} className="text-neon" />
                        <label className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Instrucciones de Redacción (Copy Prompt)</label>
                    </div>
                    <div className="relative">
                        <textarea 
                            placeholder="Ej: No uses más de 20 palabras. Termina siempre con #VamosTate. Usa emojis de león 🦁. Evita las exclamaciones excesivas..." 
                            value={formData.copyPrompt || ''} 
                            onChange={e => setFormData(p => ({...p, copyPrompt: e.target.value}))} 
                            rows={6} 
                            className="w-full bg-black border border-white/10 rounded-3xl p-6 pr-12 text-sm text-gray-300 font-mono focus:border-neon outline-none shadow-inner leading-relaxed custom-scrollbar" 
                        />
                        {formData.copyPrompt && (
                            <button 
                                onClick={() => setFormData(p => ({...p, copyPrompt: ''}))}
                                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-full transition-colors"
                                title="Borrar texto"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest pl-2">Define CÓMO escribe el texto final.</p>
                </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/5 bg-black/80 backdrop-blur-md flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="px-8 py-4 bg-white/5 text-gray-400 text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:bg-white/10 transition-all"
          >
            CANCELAR
          </button>
          <button 
            onClick={handleSave} 
            disabled={isUploading}
            className="px-10 py-4 bg-neon text-black text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,255,157,0.3)] disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="animate-spin" size={16} /> : (account ? 'GUARDAR CAMBIOS' : 'CREAR CUENTA SOCIAL')}
          </button>
        </div>
      </div>
    </div>
  );
};