import React, { useState, useRef, useEffect } from 'react';
import { Brand } from '../../../types';
import { Loader2, ImageIcon, UploadCloud } from 'lucide-react';
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

  useEffect(() => {
    if (brand) {
      setFormData({ name: brand.name, logoUrl: brand.logoUrl, socialHandle: brand.socialHandle || '' });
    } else {
      setFormData({ name: '', logoUrl: '', socialHandle: '' });
    }
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
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-lg font-oswald font-black italic text-neon mb-4">{brand ? 'Editar Marca' : 'Nueva Marca'}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block">Nombre de la Marca</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block">Handle Social (ej. @marca)</label>
            <input type="text" value={formData.socialHandle} onChange={e => setFormData({ ...formData, socialHandle: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon outline-none" placeholder="@handle" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block">Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-black rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
                {isUploading ? <Loader2 className="animate-spin text-neon" /> : formData.logoUrl ? <img src={formData.logoUrl} alt="logo preview" className="w-full h-full object-contain p-2" /> : <ImageIcon size={24} className="text-gray-600" />}
              </div>
              <div className="flex-1 space-y-2">
                <button onClick={() => logoInputRef.current?.click()} className="w-full text-center px-4 py-2 bg-white/10 text-white text-xs font-black uppercase rounded-sm hover:bg-white hover:text-black transition flex items-center justify-center gap-2">
                  <UploadCloud size={14} /> Subir Archivo
                </button>
                <input type="file" ref={logoInputRef} onChange={handleFileUpload} hidden accept="image/png, image/jpeg, image/webp, image/svg+xml" />
                <input type="text" value={formData.logoUrl} onChange={e => setFormData({ ...formData, logoUrl: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-blue-400 focus:border-neon outline-none" placeholder="O pega una URL" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-sm">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-neon text-black text-xs font-bold rounded-sm">Guardar Marca</button>
        </div>
      </div>
    </div>
  );
};
