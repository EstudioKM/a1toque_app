import React, { useState } from 'react';
import { SocialPost, SocialAccount, Brand } from '../../../types';
import { X, Trash2 } from 'lucide-react';

interface SocialPostDetailModalProps {
  post: SocialPost;
  onClose: () => void;
  onDelete?: (id: string) => void;
  socialAccountMap: Map<string, SocialAccount>;
  brandMap: Map<string, Brand>;
}

export const SocialPostDetailModal: React.FC<SocialPostDetailModalProps> = ({ post, onClose, onDelete, socialAccountMap, brandMap }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0">
      <div className="bg-[#0D0D0D] w-full h-full overflow-y-auto custom-scrollbar relative flex flex-col">
        <div className="max-w-5xl mx-auto w-full p-8 md:p-12">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-6">
              <h3 className="text-3xl md:text-4xl font-oswald font-black italic text-neon uppercase tracking-tighter">Detalle de la Publicación</h3>
              {onDelete && (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-3 px-6 py-3 bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} /> Eliminar
                </button>
              )}
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-full transition-all border border-white/5">
              <X size={32} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 pl-2">Imagen & Preview</h4>
              {post.imageUrl && (
                <div className="rounded-[40px] overflow-hidden border border-white/10 shadow-2xl bg-black aspect-square flex items-center justify-center">
                  <img src={post.imageUrl} alt={post.titleOverlay} className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            <div className="space-y-12">
              <div className="space-y-10">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 block pl-2">Título de la Placa</label>
                  <p className="text-4xl md:text-5xl font-oswald font-black text-white italic uppercase tracking-tighter leading-none">{post.titleOverlay}</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 block pl-2">Copy / Descripción</label>
                  <div className="w-full bg-black/50 border border-white/10 rounded-3xl p-8 text-lg text-gray-300 leading-relaxed font-medium whitespace-pre-wrap min-h-[200px]">
                    {post.copy || 'Sin descripción'}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 block pl-2">Publicado en Cuentas</label>
                  <div className="flex flex-wrap gap-4">
                    {post.postedToAccounts.map(id => {
                      const account = socialAccountMap.get(id);
                      return account ? (
                        <div key={id} className="flex items-center gap-4 bg-white/5 p-4 pr-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                          {account.profileImageUrl && <img src={account.profileImageUrl} className="w-10 h-10 rounded-full border-2 border-neon/20" alt={account.name} />}
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-white uppercase tracking-tight">{account.name}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{account.platform}</span>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {post.associatedSponsors.length > 0 && (
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 block pl-2">Sponsors Asociados</label>
                    <div className="flex flex-wrap gap-4">
                      {post.associatedSponsors.map(id => {
                        const brand = brandMap.get(id);
                        return brand ? (
                          <div key={id} className="flex items-center gap-4 bg-white/5 p-4 pr-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                            {brand.logoUrl && <img src={brand.logoUrl} className="w-10 h-10 object-contain rounded-full bg-neutral-800 p-1 border border-white/10" alt={brand.name} />}
                            <span className="text-sm font-black text-white uppercase tracking-tight">{brand.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {(post.instagramId || post.facebookId || post.placidId) && (
                  <div className="pt-12 border-t border-white/5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 block pl-2">Metadatos & IDs de Plataforma</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {post.instagramId && (
                        <div className="flex flex-col gap-1 bg-black/50 p-6 rounded-2xl border border-white/5">
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Instagram ID</span>
                          <span className="text-xs text-neon font-mono break-all">{post.instagramId}</span>
                        </div>
                      )}
                      {post.facebookId && (
                        <div className="flex flex-col gap-1 bg-black/50 p-6 rounded-2xl border border-white/5">
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Facebook ID</span>
                          <span className="text-xs text-blue-400 font-mono break-all">{post.facebookId}</span>
                        </div>
                      )}
                      {post.placidId && (
                        <div className="flex flex-col gap-1 bg-black/50 p-6 rounded-2xl border border-white/5">
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Placid ID</span>
                          <span className="text-xs text-purple-400 font-mono break-all">{post.placidId}</span>
                        </div>
                      )}
                      {post.imageCount !== undefined && (
                        <div className="flex flex-col gap-1 bg-black/50 p-6 rounded-2xl border border-white/5">
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Imágenes en Carrusel</span>
                          <span className="text-xl font-oswald font-black text-white">{post.imageCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-12">
                <button onClick={onClose} className="w-full py-6 bg-white/5 text-gray-400 text-xs font-black uppercase italic tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                  CERRAR DETALLE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-8">
            <div className="max-w-xl w-full text-center">
              <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-10 border border-red-500/30">
                <Trash2 className="text-red-500 size-16" />
              </div>
              <h3 className="text-4xl md:text-5xl font-oswald font-black italic uppercase text-white mb-6 tracking-tighter">¿Eliminar posteo?</h3>
              <p className="text-gray-400 text-xl mb-12 leading-relaxed">
                Esta acción es irreversible. La publicación será eliminada permanentemente de la base de datos local.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-6 bg-white/5 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/10"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={() => {
                    if (onDelete) {
                      onDelete(post.id);
                      onClose();
                    }
                  }}
                  className="flex-1 py-6 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-[0_10px_40px_rgba(239,68,68,0.3)]"
                >
                  SÍ, ELIMINAR AHORA
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};