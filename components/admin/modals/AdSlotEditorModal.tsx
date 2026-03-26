import React, { useState, useEffect } from 'react';
import { AdSlotConfig, AdSlotBehavior } from '../../../types';
import { X, Save, Settings, RotateCw, Layers, ArrowDownUp } from 'lucide-react';

interface AdSlotEditorModalProps {
  slot: AdSlotConfig;
  onClose: () => void;
  onSave: (slot: AdSlotConfig) => void;
}

export const AdSlotEditorModal: React.FC<AdSlotEditorModalProps> = ({ slot, onClose, onSave }) => {
  const [formData, setFormData] = useState<AdSlotConfig>(slot);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    setFormData(slot);
    isInitialized.current = true;
  }, [slot]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };
  
  const handleNumericChange = (field: keyof AdSlotConfig, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
        setFormData(prev => ({ ...prev, [field]: numValue }));
    } else if (value === '') {
        setFormData(prev => ({ ...prev, [field]: 0 }));
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-oswald font-black italic text-neon uppercase tracking-tighter">Configurar Espacio Publicitario</h3>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">{slot.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
        </div>
        
        <div className="space-y-8">
          {/* Dimensiones */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Dimensiones Fijas (Píxeles)</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Ancho (px)</label>
                <input 
                  type="number" 
                  value={formData.width || 0} 
                  onChange={e => handleNumericChange('width', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white font-bold focus:border-neon outline-none" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Alto (px)</label>
                <input 
                  type="number" 
                  value={formData.height || 0} 
                  onChange={e => handleNumericChange('height', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white font-bold focus:border-neon outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Comportamiento */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Comportamiento (Múltiples Banners)</h4>
            <div className="grid grid-cols-3 gap-3">
              {(['rotate', 'stack', 'inject'] as AdSlotBehavior[]).map(behavior => (
                <button 
                  key={behavior}
                  onClick={() => setFormData(p => ({...p, behavior}))}
                  className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 ${formData.behavior === behavior ? 'bg-neon/10 border-neon' : 'bg-white/[0.03] border-transparent hover:border-white/10'}`}
                >
                  <div className={`mb-3 ${formData.behavior === behavior ? 'text-neon' : 'text-gray-500'}`}>
                    {behavior === 'rotate' && <RotateCw />}
                    {behavior === 'stack' && <Layers />}
                    {behavior === 'inject' && <ArrowDownUp />}
                  </div>
                  <p className={`text-xs font-black uppercase tracking-widest ${formData.behavior === behavior ? 'text-white' : 'text-gray-400'}`}>
                    {behavior === 'rotate' ? 'Rotar' : behavior === 'stack' ? 'Apilar' : 'Inyectar'}
                  </p>
                </button>
              ))}
            </div>
            {formData.behavior === 'inject' && (
              <div className="mt-4 p-4 bg-neon/5 border border-neon/10 rounded-xl">
                <label className="text-xs font-bold text-neon mb-2 block">Inyectar banner cada...</label>
                 <div className="flex items-center gap-3">
                    <input 
                        type="number" 
                        value={formData.injectInterval || 4} 
                        onChange={e => handleNumericChange('injectInterval', e.target.value)}
                        className="w-24 bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white font-bold text-center focus:border-neon outline-none" 
                    />
                    <span className="text-sm font-bold text-gray-400">noticias en el feed.</span>
                 </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-white/10">
          <button onClick={onClose} className="px-8 py-4 bg-white/5 text-gray-400 text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:bg-white/10 transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-10 py-4 bg-neon text-black text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,255,157,0.3)] flex items-center gap-3">
            <Save size={16} /> Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};