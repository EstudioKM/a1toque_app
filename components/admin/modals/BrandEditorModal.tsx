import React, { useState, useRef, useEffect } from 'react';
import { Brand } from '../../../types';
import { Loader2, ImageIcon, UploadCloud, X, Save } from 'lucide-react';
import { storage } from '../../../services/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

interface BrandEditorModalProps {
  brand: Brand | null;
  onClose: () => void;
  onSave: (data: Brand | Omit<Brand, 'id'>) => void;
}

export const BrandEditorModal: React.FC<BrandEditorModalProps> = ({ brand, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<Brand, 'id'>>({ name: '', logoUrl: '', socialHandle: '' });
  const [isUploading, setIsUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    
    if (brand) {
      setFormData({ name: brand.name, logoUrl: brand.logoUrl, socialHandle: brand.socialHandle || '' });
    } else {
      setFormData({ name: '', logoUrl: '', socialHandle: '' });
    }
    isInitialized.current = true;
  }, [brand]);
  
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
      
      const storageRef = ref(storage, `logos/${Date.now()}-${file.name}`);
      const snapshot = await uploadString(storageRef, base64, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);
      setFormData(p => ({ ...p, logoUrl: downloadURL }));
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (brand?.id) {
      onSave({ ...formData, id: brand.id });
    } else {
      onSave(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0">
      <div className="bg-[#0D0D0D] w-full h-full overflow-y-auto custom-scrollbar relative flex flex-col">
        <div className="max-w-4xl mx-auto w-full p-8 md:p-12">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-3xl md:text-4xl font-oswald font-black italic uppercase text-neon tracking-tighter">
              {brand ? 'Editar Marca' : 'Nueva Marca'}
            </h3>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-full transition-all border border-white/5">
              <X size={32} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Columna Izquierda: Logo */}
            <div className="space-y-8">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 pl-2">Logo de la Marca</h4>
              <div className="space-y-6">
                <div className="w-full aspect-square bg-black/50 rounded-[40px] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden relative group shadow-2xl transition-all hover:border-neon/50">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-neon" size={48} />
                      <span className="text-[10px] font-black text-neon uppercase tracking-widest">Subiendo...</span>
                    </div>
                  ) : formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="logo preview" className="w-full h-full object-contain p-12 transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="text-center text-gray-700">
                      <ImageIcon size={64} className="mx-auto mb-6 opacity-20" />
                      <p className="text-xs font-black uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">CARGA EL LOGO DE LA MARCA</p>
                    </div>
                  )}

                  <button 
                    onClick={() => logoInputRef.current?.click()} 
                    className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                  >
                    <UploadCloud size={48} className="mb-4 text-neon" />
                    <span className="text-xs font-black uppercase tracking-widest">Subir Archivo</span>
                  </button>
                  <input type="file" ref={logoInputRef} onChange={handleFileUpload} hidden accept="image/png, image/jpeg, image/webp, image/svg+xml" />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">URL del Logo (Opcional)</label>
                  <input 
                    type="text" 
                    value={formData.logoUrl || ''} 
                    onChange={e => setFormData({ ...formData, logoUrl: e.target.value })} 
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-xs text-blue-400 font-mono focus:border-neon outline-none transition-all" 
                    placeholder="https://ejemplo.com/logo.png" 
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Datos */}
            <div className="space-y-10">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 pl-2">Información General</h4>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Nombre de la Marca</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Nike, Adidas, etc."
                    value={formData.name || ''} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-xl text-white font-black focus:border-neon outline-none transition-all" 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Handle Social (Instagram/Twitter)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neon font-black text-xl">@</span>
                    <input 
                      type="text" 
                      value={formData.socialHandle || ''} 
                      onChange={e => setFormData({ ...formData, socialHandle: e.target.value.replace('@', '') })} 
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 pl-12 text-xl text-white font-black focus:border-neon outline-none transition-all" 
                      placeholder="usuario" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 pt-12">
                <button onClick={onClose} className="flex-1 py-6 bg-white/5 text-gray-400 text-xs font-black uppercase italic tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                  CANCELAR
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={!formData.name || !formData.logoUrl}
                  className="flex-[2] py-6 bg-neon text-black text-xs font-black uppercase italic tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_40px_rgba(0,255,157,0.3)] flex items-center justify-center gap-3 disabled:opacity-30 disabled:hover:scale-100"
                >
                  <Save size={20} /> GUARDAR MARCA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
