import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, Timestamp, where } from 'firebase/firestore';
import { User, ChatMessage } from '../types';
import { format } from 'date-fns';

interface GroupChatProps {
  currentUser: User;
  allUsers: User[];
  isFloating?: boolean;
  onNewMessages?: (count: number) => void;
}

export const GroupChat: React.FC<GroupChatProps> = ({ 
  currentUser, 
  allUsers, 
  isFloating = true,
  onNewMessages 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'group_messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
      
      // Track unread messages
      if (onNewMessages) {
        const lastView = localStorage.getItem(`lastGroupChatView_${currentUser.id}`);
        const unreadCount = msgs.filter(m => !lastView || m.timestamp > lastView).length;
        onNewMessages(unreadCount);
      }

      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [currentUser.id, onNewMessages]);

  // Update last view when expanded or in tab
  useEffect(() => {
    if (!isMinimized || !isFloating) {
      localStorage.setItem(`lastGroupChatView_${currentUser.id}`, new Date().toISOString());
      if (onNewMessages) onNewMessages(0);
    }
  }, [isMinimized, isFloating, currentUser.id, onNewMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'group_messages'), {
        senderId: currentUser.id,
        receiverId: 'group',
        text: newMessage,
        timestamp: new Date().toISOString(),
        isRead: false
      });
      setNewMessage('');
      localStorage.setItem(`lastGroupChatView_${currentUser.id}`, new Date().toISOString());
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getUserById = (id: string) => {
    return allUsers.find(u => u.id === id);
  };

  if (isFloating && isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 bg-neon text-black p-4 rounded-full shadow-[0_0_20px_rgba(180,255,0,0.5)] hover:scale-110 transition-all z-[200] flex items-center gap-2 font-black uppercase italic text-[10px]"
      >
        <MessageSquare size={20} />
        <span>Chat Grupal</span>
      </button>
    );
  }

  const containerClasses = isFloating 
    ? `fixed bottom-6 right-6 z-[200] transition-all duration-500 ${isExpanded ? 'w-[400px] h-[600px]' : 'w-[320px] h-[450px]'}`
    : `w-full h-full flex flex-col`;

  return (
    <div className={containerClasses}>
      <div className={`w-full h-full bg-black border border-white/10 ${isFloating ? 'rounded-3xl shadow-2xl' : 'rounded-[40px]'} flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neon/20 flex items-center justify-center border border-neon/30">
              <Users size={16} className="text-neon" />
            </div>
            <div>
              <h3 className="text-white font-oswald font-black italic uppercase text-xs tracking-tighter">Chat del Equipo</h3>
              <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">{allUsers.length} Miembros</p>
            </div>
          </div>
          {isFloating && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-gray-500 hover:text-white transition-colors"
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-gray-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
        >
          {messages.map((msg, idx) => {
            const sender = getUserById(msg.senderId);
            const isMe = msg.senderId === currentUser.id;
            const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && showAvatar && (
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 ml-1">
                    {sender?.name || 'Usuario'}
                  </span>
                )}
                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && showAvatar && (
                    <img 
                      src={sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.name || 'U')}&background=0D0D0D&color=fff`} 
                      alt={sender?.name}
                      className="w-6 h-6 rounded-full border border-white/10 object-cover mb-1"
                    />
                  )}
                  {!isMe && !showAvatar && <div className="w-6" />}
                  
                  <div className={`p-3 rounded-2xl text-[11px] leading-relaxed ${
                    isMe 
                      ? 'bg-neon text-black font-medium rounded-tr-none' 
                      : 'bg-white/5 text-white border border-white/5 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
                <span className="text-[7px] text-gray-600 font-black uppercase tracking-widest mt-1 px-1">
                  {format(new Date(msg.timestamp), 'HH:mm')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/[0.01]">
          <div className="relative">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-4 pr-12 text-[11px] text-white placeholder:text-gray-600 outline-none focus:border-neon transition-colors"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon disabled:text-gray-700 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
