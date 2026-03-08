import React, { useMemo, useState } from 'react';
import { SocialPost, User, SocialAccount } from '../../types';
import { Plus, Edit3, Trash2, ExternalLink, Calendar, User as UserIcon, AlertCircle, X, Send, CheckCircle2, Clock } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';

interface SocialTabProps {
  socialPosts: SocialPost[];
  users: User[];
  currentUser: User;
  socialAccountMap: Map<string, SocialAccount>;
  onOpenCreator: () => void;
  onOpenDetail: (post: SocialPost) => void;
  onOpenEditor: (post: SocialPost) => void;
  onDeletePost: (id: string) => void;
}

export const SocialTab: React.FC<SocialTabProps> = ({ 
  socialPosts, 
  users,
  currentUser,
  socialAccountMap, 
  onOpenCreator, 
  onOpenDetail,
  onOpenEditor,
  onDeletePost
}) => {
  const [postToDelete, setPostToDelete] = useState<SocialPost | null>(null);

  const filteredPosts = useMemo(() => {
    if (currentUser.roleId === 'admin') {
      return socialPosts;
    }
    const managedIds = currentUser.managedSocialAccountIds || [];
    if (managedIds.length === 0) {
      return [];
    }
    return socialPosts.filter(post => 
      post.postedToAccounts.some(accountId => managedIds.includes(accountId))
    );
  }, [socialPosts, currentUser]);

  const confirmDelete = (e: React.MouseEvent, post: SocialPost) => {
    e.stopPropagation();
    setPostToDelete(post);
  };

  const executeDelete = () => {
    if (postToDelete) {
      onDeletePost(postToDelete.id);
      setPostToDelete(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 px-2 md:px-0">
      {/* Header Condensado */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-oswald font-black italic uppercase text-white tracking-tighter">PUBLICACIONES</h2>
          <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Historial y distribución social</p>
        </div>
        <button 
          onClick={() => onOpenCreator()} 
          className="flex items-center gap-2 px-5 py-3 bg-neon text-black text-[10px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_5px_20px_rgba(0,255,157,0.2)] active:scale-95"
        >
          <Plus size={16} strokeWidth={3} /> <span className="hidden sm:inline">NUEVA</span>
        </button>
      </div>

      {/* Lista de Publicaciones Condensada */}
      <div className="flex flex-col gap-3">
        {filteredPosts.length > 0 ? filteredPosts.map(post => {
          const author = users.find(u => u.id === post.postedBy);
          const isDraft = post.status === 'draft';
          
          return (
            <div 
              key={post.id} 
              onClick={!isDraft ? () => onOpenDetail(post) : undefined}
              className={`group relative rounded-xl overflow-hidden border transition-all duration-200 ${!isDraft ? 'bg-[#0f0f0f] border-white/5 hover:border-white/10 cursor-pointer' : 'bg-neon/[0.03] border-neon/20'}`}
            >
              <div className="flex items-center h-24 md:h-20">
                
                {/* 1. Imagen Miniatura */}
                <div className="w-24 md:w-20 h-full flex-shrink-0 relative overflow-hidden bg-neutral-900">
                    <OptimizedImage 
                      src={post.imageUrl} 
                      alt={post.titleOverlay} 
                      className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" 
                    />
                    {isDraft && (
                      <div className="absolute inset-0 bg-neon/10 flex items-center justify-center">
                         <Clock size={16} className="text-neon" />
                      </div>
                    )}
                </div>

                {/* 2. Información Central (Título y Meta) */}
                <div className="flex-1 px-4 min-w-0 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-1 overflow-hidden">
                      <div className="flex items-center -space-x-1.5 flex-shrink-0">
                        {post.postedToAccounts.map(accountId => {
                          const account = socialAccountMap.get(accountId);
                          return account?.profileImageUrl ? (
                            <img key={accountId} src={account.profileImageUrl} title={account.name} className="w-5 h-5 rounded-full border border-black bg-neutral-800" />
                          ) : null;
                        })}
                      </div>
                      <span className="text-gray-700 text-[10px]">•</span>
                      <div className="text-gray-500 text-[8px] font-black uppercase tracking-widest truncate">
                        {author?.name.split(' ')[0] || 'Sistema'} • {new Date(post.postedAt).toLocaleDateString('es-AR')}
                      </div>
                   </div>

                   <h3 className="text-white font-oswald font-bold text-sm md:text-base uppercase italic leading-tight truncate group-hover:text-neon transition-colors" title={post.titleOverlay}>
                    {post.titleOverlay}
                   </h3>

                   {post.originalArticleId !== 'standalone' && (
                    <div className="mt-1 flex items-center gap-1.5 text-gray-600 text-[8px] font-bold uppercase tracking-wider truncate">
                       <ExternalLink size={8} /> {post.originalArticleTitle}
                    </div>
                  )}
                </div>

                {/* 3. Acciones Compactas */}
                <div className="flex items-center pr-3 md:pr-5 gap-2 flex-shrink-0">
                   {isDraft ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onOpenEditor(post); }} 
                        className="p-2 md:px-4 md:py-1.5 bg-white/5 border border-white/10 text-white hover:text-black hover:bg-neon hover:border-neon rounded-lg text-[9px] font-black uppercase italic tracking-widest transition-all active:scale-95"
                      >
                        <Edit3 size={14} className="md:hidden" />
                        <span className="hidden md:inline">EDITAR</span>
                      </button>
                    ) : (
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${post.status === 'success' ? 'text-green-500/80 bg-green-500/5' : 'text-red-500/80 bg-red-500/5'}`}>
                         {post.status === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                         <span className="text-[8px] font-black uppercase italic tracking-widest hidden sm:inline">{post.status === 'success' ? 'LISTO' : 'ERROR'}</span>
                      </div>
                    )}
                    
                    <button 
                      onClick={(e) => confirmDelete(e, post)}
                      className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-500/10"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                </div>

              </div>
            </div>
          );
        }) : (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl">
            <Send className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-30" />
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Sin publicaciones activas</p>
          </div>
        )}
      </div>

      {/* Modal de eliminación simplificado */}
      {postToDelete && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4">
           <div className="max-w-xs w-full bg-[#111] border border-white/10 rounded-2xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-5">
                <Trash2 size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-oswald font-black text-white uppercase italic mb-2 tracking-tighter">¿BORRAR POSTEO?</h3>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-8 px-2">
                Esta acción es irreversible y eliminará el registro de tu historial.
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={executeDelete} className="w-full py-3 bg-red-600 text-white font-black uppercase italic text-[10px] tracking-widest rounded-xl hover:bg-red-500 transition-colors">ELIMINAR</button>
                <button onClick={() => setPostToDelete(null)} className="w-full py-3 bg-white/5 text-gray-400 font-black uppercase italic text-[10px] tracking-widest rounded-xl">CANCELAR</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};