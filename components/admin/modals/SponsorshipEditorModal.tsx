import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sponsorship, Brand, SponsorshipType, AdSlotConfig } from '../../../types';
import { ImageIcon, UploadCloud, Loader2, Link, Building, Layers, LayoutGrid, Save, X } from 'lucide-react';
import { storage } from '../../../services/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

interface SponsorshipEditorModalProps {
  sponsorship: Partial<Sponsorship> | null;
  brands: Brand[];
  adSlots: AdSlotConfig[];
  onClose: () => void;
  onSave: (data: Sponsorship | Omit<Sponsorship, 'id' | 'impressions' | 'clicks' | 'active'>) => void;
}

const defaultFormData: Omit<Sponsorship, 'id' | 'active' | 'impressions' | 'clicks'> = { 
  name: '', 
  imageUrl: '', 
  link: '#', 
  position: '' as any, // Forzar a que esté vacío al inicio
  brandId: '', 
  type: SponsorshipType.ROTATING 
};

export const SponsorshipEditorModal: React.FC<SponsorshipEditorModalProps> = ({ sponsorship, brands, adSlots, onClose, onSave }) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sponsorship) {
      const initialData = { ...defaultFormData, ...sponsorship };
      const { id, active, impressions, clicks, ...dataToSet } = initialData as Sponsorship;
      setFormData(dataToSet);
    } else {
      setFormData(defaultFormData);
    }
  }, [sponsorship]);

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
      
      const storageRef = ref(storage, `sponsorships/${Date.now()}-${file.name}`);
      const snapshot = await uploadString(storageRef, base64, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);
      setFormData(p => ({ ...p, imageUrl: downloadURL }));
    } catch (error) {
      console.error("Sponsorship image upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (sponsorship?.id) {
      onSave({ ...formData, id: sponsorship.id, active: sponsorship.active ?? true, impressions: sponsorship.impressions ?? 0, clicks: sponsorship.clicks ?? 0 } as Sponsorship);
    } else {
      onSave(formData);
    }
    onClose();
  };
  
  const selectedSlot = useMemo(() => adSlots.find(s => s.id === formData.position), [formData.position, adSlots]);

  const groupedSlots = useMemo(() => {
      return adSlots.reduce((acc, slot) => {
          if (!acc[slot.group]) acc[slot.group] = [];
          acc[slot.group].push(slot);
          return acc;
      }, {} as Record<string, AdSlotConfig[]>);
  }, [adSlots]);

  return (
    <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-[32px] p-8 max-w-4xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-oswald font-black italic text-neon uppercase tracking-tighter">
            {sponsorship?.id ? 'Editar Auspicio' : 'Nuevo Auspicio'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-h-[75vh] overflow-y-auto custom-scrollbar pr-4">
          {/* Columna Izquierda: Creatividad */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Creatividad</h4>
            <div 
              className={`w-full aspect-[16/10] bg-black/50 border-2 border-dashed rounded-3xl flex items-center justify-center flex-col overflow-hidden relative group shadow-inner ${selectedSlot ? 'border-white/10' : 'border-red-500/30 animate-pulse'}`}
            >
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="text-center text-gray-700">
                  <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest">{selectedSlot ? 'CARGA LA IMAGEN DEL BANNER' : 'SELECCIONA UNA POSICIÓN'}</p>
                </div>
              )}

              {selectedSlot && (
                  <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                    {isUploading ? <Loader2 className="animate-spin" size={32} /> : <><UploadCloud size={32} className="mb-2 text-neon" /><span className="text-[10px] font-black uppercase tracking-widest">Cambiar Imagen</span></>}
                  </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden accept="image/png, image/jpeg, image/webp, image/gif" />
            </div>

            {selectedSlot && (
              <div className="p-4 bg-neon/5 border border-neon/10 rounded-xl text-center">
                <label className="text-xs font-bold text-neon mb-1 block">Dimensiones Recomendadas</label>
                <p className="text-2xl font-oswald font-black text-white">{selectedSlot.width} x {selectedSlot.height} px</p>
              </div>
            )}
             
            <input 
              type="text" 
              value={formData.imageUrl} 
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-[10px] text-blue-400 focus:border-neon outline-none" 
              placeholder="O pega una URL de imagen" 
            />
          </div>

          {/* Columna Derecha: Datos */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Detalles de la Campaña</h4>
            <input 
              type="text" 
              placeholder="Nombre de la Campaña (ej. Lanzamiento Verano)" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white font-bold focus:border-neon outline-none" 
            />
            
            <div className="relative">
              <Link size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="URL de Destino (https://...)" 
                value={formData.link} 
                onChange={e => setFormData({ ...formData, link: e.target.value })} 
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pl-10 text-sm text-white focus:border-neon outline-none" 
              />
            </div>
            
            <div className="relative">
              <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <select 
                value={formData.brandId} 
                onChange={e => setFormData({ ...formData, brandId: e.target.value })} 
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pl-10 text-sm text-white focus:border-neon outline-none appearance-none"
              >
                <option value="">Seleccionar Marca Auspiciante</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            
            <div className="relative">
                <Layers size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <select 
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value as SponsorshipType })} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pl-10 text-sm text-white focus:border-neon outline-none appearance-none"
                >
                    {Object.values(SponsorshipType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            
            <div className="relative">
              <LayoutGrid size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <select 
                value={formData.position} 
                onChange={e => setFormData({ ...formData, position: e.target.value as any })} 
                className={`w-full bg-black/50 border-2 rounded-xl p-4 pl-10 text-sm font-bold focus:border-neon outline-none appearance-none ${!formData.position ? 'text-red-400 border-red-500/50' : 'text-white border-white/10'}`}
              >
                <option value="" disabled>Seleccionar Posición del Banner</option>
                {/* FIX: Explicitly type the destructured arguments from Object.entries to ensure `slots` is recognized as an array. */}
                {Object.entries(groupedSlots).map(([group, slots]: [string, AdSlotConfig[]]) => (
                    <optgroup key={group} label={`--- ${group} ---`} className="font-sans font-bold text-gray-500">
                        {slots.map(slot => (
                            <option key={slot.id} value={slot.id} className="font-sans font-semibold text-white">
                                {slot.name}
                            </option>
                        ))}
                    </optgroup>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-white/10">
          <button onClick={onClose} className="px-8 py-4 bg-white/5 text-gray-400 text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:bg-white/10 transition-all">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={!formData.name || !formData.brandId || !formData.position || !formData.imageUrl}
            className="px-10 py-4 bg-neon text-black text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,255,157,0.3)] flex items-center gap-3 disabled:opacity-30 disabled:hover:scale-100"
          >
            <Save size={16} /> {sponsorship?.id ? 'Guardar Cambios' : 'Crear Auspicio'}
          </button>
        </div>
      </div>
    </div>
  );
};