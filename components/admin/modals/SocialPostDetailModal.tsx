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
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col relative">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-oswald font-black italic text-neon">Detalle de la Publicación</h3>
            {onDelete && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={12} /> Eliminar
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {post.imageUrl && <img src={post.imageUrl} alt={post.titleOverlay} className="w-full aspect-square object-contain bg-black rounded-lg border border-white/10" />}
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Título</label>
              <p className="text-2xl font-oswald font-bold text-white italic uppercase mt-1">{post.titleOverlay}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Copy</label>
              <textarea readOnly value={post.copy || ''} rows={8} className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-gray-300 mt-1 custom-scrollbar" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Publicado en</label>
              <div className="flex flex-wrap gap-3 mt-2">
                {post.postedToAccounts.map(id => {
                  const account = socialAccountMap.get(id);
                  return account ? (
                    <div key={id} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                      {account.profileImageUrl && <img src={account.profileImageUrl} className="w-6 h-6 rounded-full" alt={account.name} />}
                      <span className="text-xs font-bold text-white">{account.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            {post.associatedSponsors.length > 0 && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sponsors Asociados</label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {post.associatedSponsors.map(id => {
                    const brand = brandMap.get(id);
                    return brand ? (
                      <div key={id} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                        {brand.logoUrl && <img src={brand.logoUrl} className="w-6 h-6 object-contain rounded-full bg-neutral-800 p-0.5" alt={brand.name} />}
                        <span className="text-xs font-bold text-white">{brand.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {(post.instagramId || post.facebookId || post.placidId) && (
              <div className="pt-4 border-t border-white/5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">IDs de Plataforma</label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {post.instagramId && (
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Instagram</span>
                      <span className="text-[10px] text-white font-mono">{post.instagramId}</span>
                    </div>
                  )}
                  {post.facebookId && (
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Facebook</span>
                      <span className="text-[10px] text-white font-mono">{post.facebookId}</span>
                    </div>
                  )}
                  {post.placidId && (
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Placid</span>
                      <span className="text-[10px] text-white font-mono">{post.placidId}</span>
                    </div>
                  )}
                  {post.imageCount !== undefined && (
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Cantidad de Imágenes</span>
                      <span className="text-[10px] text-white font-mono">{post.imageCount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-[70] bg-black/95 backdrop-blur-sm flex items-center justify-center p-6 rounded-2xl">
            <div className="max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-red-500 size-8" />
              </div>
              <h3 className="text-xl font-oswald font-black italic uppercase text-white mb-2">¿Eliminar posteo?</h3>
              <p className="text-gray-400 text-sm mb-8">
                Esta acción no se puede deshacer. La publicación será eliminada permanentemente.
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
                    if (onDelete) {
                      onDelete(post.id);
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
      </div>
    </div>
  );
};