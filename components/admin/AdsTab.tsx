import React, { useMemo, useState } from 'react';
import { Brand, Sponsorship, SponsorshipPosition, AdSlotConfig } from '../../types';
import { Edit3, Plus, ShoppingBag, Star, Trash2, LayoutGrid, ImageOff, Layers, Settings } from 'lucide-react';

interface AdsTabProps {
  brands: Brand[];
  sponsorships: Sponsorship[];
  adSlots: AdSlotConfig[];
  brandMap: Map<string, Brand>;
  onOpenBrandEditor: (brand?: Brand) => void;
  onOpenSponsorshipEditor: (sponsorship?: Partial<Sponsorship>) => void;
  onOpenAdSlotEditor: (slot: AdSlotConfig) => void;
  onDeleteBrand: (id: string) => void;
  onDeleteSponsorship: (id: string) => void;
  onToggleSponsorshipStatus: (id: string) => void;
}

const SponsorshipCard: React.FC<{ 
  s: Sponsorship; 
  brandMap: Map<string, Brand>; 
  onOpenSponsorshipEditor: (s: Sponsorship) => void; 
  onDeleteSponsorship: (id: string) => void; 
  onToggleSponsorshipStatus: (id: string) => void; 
}> = ({ s, brandMap, onOpenSponsorshipEditor, onDeleteSponsorship, onToggleSponsorshipStatus }) => {
    const brand = brandMap.get(s.brandId);
    return (
        <div className="bg-black/40 p-3 rounded-xl flex items-center justify-between border border-white/5 hover:border-neon/20 transition-all gap-4 group">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-12 rounded-lg overflow-hidden border border-white/10 bg-neutral-900 flex-shrink-0">
                    {s.imageUrl && <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />}
                </div>
                <div className="min-w-0">
                    <h3 className="text-white font-bold text-xs uppercase truncate mb-1" title={s.name}>{s.name}</h3>
                    <div className="flex items-center gap-2">
                        {brand?.logoUrl && <img src={brand.logoUrl} className="w-3 h-3 object-contain opacity-50" alt="" />}
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest truncate">{brand?.name || 'Marca Desconocida'}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => onToggleSponsorshipStatus(s.id)} 
                  className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all ${s.active ? 'bg-neon/10 text-neon border border-neon/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                >
                    {s.active ? 'Activo' : 'Pausa'}
                </button>
                <button onClick={() => onOpenSponsorshipEditor(s)} className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-gray-400"><Edit3 size={12} /></button>
                <button onClick={() => onDeleteSponsorship(s.id)} className="w-7 h-7 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-400 rounded-lg"><Trash2 size={12} /></button>
            </div>
        </div>
    );
};

const EmptySlotCard: React.FC<{ width: number, height: number, onAdd: () => void }> = ({ width, height, onAdd }) => (
    <button 
      onClick={onAdd} 
      className="w-full bg-white/[0.02] p-4 rounded-xl border-2 border-dashed border-white/5 hover:border-neon/30 hover:bg-neon/[0.02] transition-all group flex flex-col items-center justify-center text-center gap-2"
    >
        <div className="flex items-center gap-2 text-gray-600 group-hover:text-neon transition-colors">
            <ImageOff size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Espacio Disponible</span>
        </div>
        <div className="text-[8px] font-mono text-gray-700 bg-white/5 px-2 py-0.5 rounded border border-white/5">
            {width} x {height} px
        </div>
    </button>
);

const SectionColumn: React.FC<{ 
    title: string;
    icon: React.ElementType;
    positions: (AdSlotConfig & { banners: Sponsorship[] })[];
    brandMap: Map<string, Brand>;
    onOpenSponsorshipEditor: (s?: Partial<Sponsorship>) => void;
    onOpenAdSlotEditor: (slot: AdSlotConfig) => void;
    onDeleteSponsorship: (id: string) => void;
    onToggleSponsorshipStatus: (id: string) => void;
}> = ({ title, icon: Icon, positions, brandMap, onOpenSponsorshipEditor, onOpenAdSlotEditor, onDeleteSponsorship, onToggleSponsorshipStatus }) => (
    <div className="bg-[#0c0c0c] border border-white/5 rounded-[32px] p-6 space-y-8 flex flex-col h-full shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
            <div className="w-10 h-10 bg-neon/10 rounded-xl flex items-center justify-center text-neon">
                <Icon size={20} />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">{title}</h4>
        </div>
        
        <div className="space-y-12 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {positions.map(pos => (
                <div key={pos.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] font-black text-neon bg-neon/10 border border-neon/30 px-3 py-2 rounded-lg uppercase italic tracking-widest self-start shadow-[0_0_15px_rgba(0,255,157,0.1)]">
                              {pos.name}
                            </span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase pl-1 tracking-widest">
                                MEDIDA REQUERIDA: <span className="text-white font-black">{pos.width} x {pos.height} PX</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={() => onOpenAdSlotEditor(pos)}
                             className="w-10 h-10 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 transition-all flex items-center justify-center border border-white/5"
                             title="Configurar espacio"
                           >
                               <Settings size={18} />
                           </button>
                           <button 
                             onClick={() => onOpenSponsorshipEditor({ position: pos.id })}
                             className="w-10 h-10 rounded-full bg-neon/10 text-neon hover:bg-neon hover:text-black transition-all flex items-center justify-center border border-neon/20 shadow-lg"
                             title="Añadir banner a esta posición"
                           >
                               <Plus size={20} />
                           </button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        {pos.banners.length > 0 ? (
                            pos.banners.map(s => (
                                <SponsorshipCard 
                                  key={s.id} 
                                  s={s} 
                                  brandMap={brandMap} 
                                  onOpenSponsorshipEditor={onOpenSponsorshipEditor as any} 
                                  onDeleteSponsorship={onDeleteSponsorship} 
                                  onToggleSponsorshipStatus={onToggleSponsorshipStatus} 
                                />
                            ))
                        ) : (
                            <EmptySlotCard width={pos.width} height={pos.height} onAdd={() => onOpenSponsorshipEditor({ position: pos.id })} />
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const AdsTab: React.FC<AdsTabProps> = (props) => {
  const { adSlots, sponsorships, onOpenSponsorshipEditor, brandMap, brands, onOpenBrandEditor, onDeleteBrand, onDeleteSponsorship, onToggleSponsorshipStatus, onOpenAdSlotEditor } = props;

  const homePositions = useMemo(() => 
    adSlots
        .filter(slot => slot.group === 'HOME' && slot.visible)
        .sort((a,b) => a.order - b.order)
        .map(slot => ({
            ...slot,
            banners: sponsorships.filter(s => s.position === slot.id)
        })), 
  [adSlots, sponsorships]);

  const internalPositions = useMemo(() => 
    adSlots
        .filter(slot => (slot.group === 'NEWS' || slot.group === 'LANDING') && slot.visible)
        .sort((a,b) => a.order - b.order)
        .map(slot => ({
            ...slot,
            banners: sponsorships.filter(s => s.position === slot.id)
        })), 
  [adSlots, sponsorships]);

  return (
    <div className="pb-32">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
            <h2 className="text-4xl font-oswald font-black italic uppercase text-white tracking-tighter leading-none">GESTIÓN PUBLICITARIA</h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Control estricto de dimensiones e inventario</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => onOpenBrandEditor()} 
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:bg-white/10 transition-all"
          >
            <Star size={16} /> NUEVA MARCA
          </button>
          <button 
            onClick={() => onOpenSponsorshipEditor()} 
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-neon text-black text-[11px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_10px_40px_rgba(0,255,157,0.3)]"
          >
            <Plus size={18} strokeWidth={3} /> NUEVO BANNER
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <SectionColumn 
              title="ESPACIOS EN HOME" 
              icon={LayoutGrid} 
              positions={homePositions} 
              brandMap={brandMap}
              onOpenSponsorshipEditor={onOpenSponsorshipEditor}
              onOpenAdSlotEditor={onOpenAdSlotEditor}
              onDeleteSponsorship={onDeleteSponsorship}
              onToggleSponsorshipStatus={onToggleSponsorshipStatus}
            />
            <SectionColumn 
              title="ESPACIOS INTERNOS" 
              icon={Layers} 
              positions={internalPositions} 
              brandMap={brandMap}
              onOpenSponsorshipEditor={onOpenSponsorshipEditor}
              onOpenAdSlotEditor={onOpenAdSlotEditor}
              onDeleteSponsorship={onDeleteSponsorship}
              onToggleSponsorshipStatus={onToggleSponsorshipStatus}
            />
        </div>

        {/* Sidebar de Marcas */}
        <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neon flex items-center gap-2">
                    <ShoppingBag size={14} /> MARCAS REGISTRADAS
                </h3>
                <span className="text-[10px] font-black text-gray-700 bg-white/5 px-2 py-0.5 rounded">{brands.length}</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
                {brands.map(brand => (
                    <div key={brand.id} className="bg-white/[0.03] p-5 rounded-2xl flex items-center gap-5 relative group border border-white/5 hover:border-white/20 transition-all">
                        <div className="h-14 w-14 flex items-center justify-center bg-black rounded-xl overflow-hidden border border-white/10 flex-shrink-0 group-hover:border-neon/30 transition-colors">
                            {brand.logoUrl && <img src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain p-2" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-white font-bold uppercase truncate tracking-tight">{brand.name}</p>
                            <p className="text-[9px] text-neon font-black uppercase tracking-wider mt-1 opacity-60 group-hover:opacity-100">{brand.socialHandle || 'Sin handle'}</p>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <button onClick={() => onOpenBrandEditor(brand)} className="w-8 h-8 flex items-center justify-center bg-black/80 hover:bg-white hover:text-black rounded-lg text-gray-400 transition-all border border-white/10"><Edit3 size={14} /></button>
                            <button onClick={() => onDeleteBrand(brand.id)} className="w-8 h-8 flex items-center justify-center bg-black/80 hover:bg-red-500 hover:text-white rounded-lg text-gray-400 transition-all border border-white/10"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};