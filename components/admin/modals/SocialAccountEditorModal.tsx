import React, { useState, useEffect } from 'react';
import { SocialAccount, SocialPlatform } from '../../../types';
import { X, Sparkles, MessageSquare, Info, AtSign } from 'lucide-react';

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
    systemPrompt: '', 
    copyPrompt: '' 
  });

  useEffect(() => {
    if (account) {
      setFormData({ 
        name: account.name, 
        handle: account.handle, 
        platform: account.platform, 
        profileImageUrl: account.profileImageUrl,
        systemPrompt: account.systemPrompt || '',
        copyPrompt: account.copyPrompt || '',
      });
    } else {
      setFormData({ name: '', handle: '', platform: 'instagram', profileImageUrl: '', systemPrompt: '', copyPrompt: '' });
    }
  }, [account]);

  const handleSave = () => {
    if (account?.id) {
      onSave({ ...formData, id: account.id });
    } else {
      onSave(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0 md:p-6">
      <div className="bg-[#0a0a0a] border border-white/10 md:rounded-[40px] w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-300">
        
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

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Columna de Datos Básicos */}
            <div className="lg:col-span-4 space-y-6">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Información Pública</label>
                    <input 
                        type="text" 
                        placeholder="Nombre (ej. Unión A1Toque)" 
                        value={formData.name} 
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-neon outline-none" 
                    />
                    <input 
                        type="text" 
                        placeholder="@handle" 
                        value={formData.handle} 
                        onChange={e => setFormData(p => ({ ...p, handle: e.target.value }))} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-blue-400 font-bold focus:border-neon outline-none" 
                    />
                    <select 
                        value={formData.platform} 
                        onChange={e => setFormData(p => ({ ...p, platform: e.target.value as SocialPlatform }))} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-neon outline-none appearance-none cursor-pointer"
                    >
                        <option value="instagram">📸 Instagram</option>
                        <option value="twitter">𝕏 Twitter / X</option>
                        <option value="facebook">👥 Facebook</option>
                    </select>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Imagen de Perfil</label>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                            {formData.profileImageUrl ? (
                                <img src={formData.profileImageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-800"><AtSign size={32} /></div>
                            )}
                        </div>
                        <input 
                            type="text" 
                            placeholder="URL de la imagen..." 
                            value={formData.profileImageUrl} 
                            onChange={e => setFormData(p => ({ ...p, profileImageUrl: e.target.value }))} 
                            className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-[10px] text-gray-400 focus:border-neon outline-none" 
                        />
                    </div>
                </div>

                <div className="p-4 bg-neon/5 border border-neon/20 rounded-2xl">
                    <div className="flex gap-3 text-neon mb-2"><Info size={16} /> <span className="text-[9px] font-black uppercase tracking-widest">Diferenciador</span></div>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Los prompts configurados aquí tendrán prioridad sobre el prompt global de redacción cuando se genere contenido para esta cuenta.</p>
                </div>
            </div>

            {/* Columna de Inteligencia Artificial */}
            <div className="lg:col-span-8 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={18} className="text-neon" />
                        <label className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Personalidad de la IA (System Prompt)</label>
                    </div>
                    <textarea 
                        placeholder="Ej: Actúa como el hincha más apasionado de Rosario Central. Usa modismos rosarinos y enfócate en el orgullo de Arroyito..." 
                        value={formData.systemPrompt} 
                        onChange={e => setFormData(p => ({...p, systemPrompt: e.target.value}))} 
                        rows={6} 
                        className="w-full bg-black border border-white/10 rounded-3xl p-6 text-sm text-gray-300 font-mono focus:border-neon outline-none shadow-inner leading-relaxed" 
                    />
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest pl-2">Define QUIÉN es la IA para esta red.</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={18} className="text-neon" />
                        <label className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Instrucciones de Redacción (Copy Prompt)</label>
                    </div>
                    <textarea 
                        placeholder="Ej: No uses más de 20 palabras. Termina siempre con #VamosTate. Usa emojis de león 🦁. Evita las exclamaciones excesivas..." 
                        value={formData.copyPrompt} 
                        onChange={e => setFormData(p => ({...p, copyPrompt: e.target.value}))} 
                        rows={6} 
                        className="w-full bg-black border border-white/10 rounded-3xl p-6 text-sm text-gray-300 font-mono focus:border-neon outline-none shadow-inner leading-relaxed" 
                    />
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
            className="px-10 py-4 bg-neon text-black text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,255,157,0.3)]"
          >
            {account ? 'GUARDAR CAMBIOS' : 'CREAR CUENTA SOCIAL'}
          </button>
        </div>
      </div>
    </div>
  );
};