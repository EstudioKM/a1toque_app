
import React, { useState, useRef, useEffect } from 'react';
import { Send, Heart, ThumbsUp, Flame, MessageCircle } from 'lucide-react';
import { Comment } from '../types';

export const ArticleChat: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([
    { id: '1', user: 'Juani_Tatengue', text: '¡Qué locura lo que jugaron hoy! 🔥', timestamp: 'Hace 2m' },
    { id: '2', user: 'Sabalero_89', text: 'Esperemos mantener el ritmo el domingo.', timestamp: 'Hace 5m' },
    { id: '3', user: 'A1Toque Admin', text: 'Bienvenidos al chat en vivo de la nota.', timestamp: 'Hace 10m', isAdmin: true }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [reactions, setReactions] = useState({ like: 124, fire: 89, love: 45 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: 'Usuario_Invitado', // En un sistema real vendría del auth
      text: newMessage,
      timestamp: 'Ahora'
    };

    setComments([...comments, comment]);
    setNewMessage('');
  };

  const handleReaction = (type: 'like' | 'fire' | 'love') => {
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[500px]">
      {/* Header del Chat */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-neon rounded-full animate-pulse"></div>
          <span className="text-xs font-black uppercase tracking-widest text-white">Live Chat</span>
        </div>
        <div className="flex text-[10px] text-gray-500 font-bold gap-3">
            <span className="flex items-center gap-1"><ThumbsUp size={10} /> {reactions.like}</span>
            <span className="flex items-center gap-1"><Flame size={10} /> {reactions.fire}</span>
        </div>
      </div>

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/40">
        {comments.map((comment) => (
          <div key={comment.id} className={`flex gap-3 ${comment.isAdmin ? 'bg-neon/5 -mx-2 p-2 rounded' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${comment.isAdmin ? 'bg-neon text-black' : 'bg-white/10 text-gray-300'}`}>
              {comment.user.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-black uppercase ${comment.isAdmin ? 'text-neon' : 'text-gray-400'}`}>
                  {comment.user}
                </span>
                <span className="text-[9px] text-gray-600">{comment.timestamp}</span>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed font-medium">
                {comment.text}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reacciones Flotantes */}
      <div className="px-4 py-2 bg-[#111] border-t border-white/5 flex justify-center gap-4">
        <button 
            onClick={() => handleReaction('like')}
            className="p-2 rounded-full bg-white/5 hover:bg-neon/20 hover:text-neon text-gray-400 transition-all hover:scale-110"
        >
            <ThumbsUp size={16} />
        </button>
        <button 
            onClick={() => handleReaction('fire')}
            className="p-2 rounded-full bg-white/5 hover:bg-orange-500/20 hover:text-orange-500 text-gray-400 transition-all hover:scale-110"
        >
            <Flame size={16} />
        </button>
        <button 
            onClick={() => handleReaction('love')}
            className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-gray-400 transition-all hover:scale-110"
        >
            <Heart size={16} />
        </button>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white/5 border-t border-white/10">
        <div className="relative">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un comentario..." 
            className="w-full bg-black border border-white/10 rounded-xl pl-4 pr-10 py-3 text-xs text-white focus:border-neon outline-none placeholder:text-gray-600"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neon hover:bg-neon/10 rounded-lg transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
};
