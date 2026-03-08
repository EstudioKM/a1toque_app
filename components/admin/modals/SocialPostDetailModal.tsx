import React from 'react';
import { SocialPost, SocialAccount, Brand } from '../../../types';
import { X } from 'lucide-react';

interface SocialPostDetailModalProps {
  post: SocialPost;
  onClose: () => void;
  socialAccountMap: Map<string, SocialAccount>;
  brandMap: Map<string, Brand>;
}

export const SocialPostDetailModal: React.FC<SocialPostDetailModalProps> = ({ post, onClose, socialAccountMap, brandMap }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-oswald font-black italic text-neon">Detalle de la Publicación</h3>
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
              <textarea readOnly value={post.copy} rows={8} className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-gray-300 mt-1 custom-scrollbar" />
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
          </div>
        </div>
      </div>
    </div>
  );
};