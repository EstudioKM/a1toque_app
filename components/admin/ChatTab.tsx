import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User } from '../../types';
import { Send, User as UserIcon, Shield, Clock, Search, Users } from 'lucide-react';
import { GroupChat } from '../GroupChat';

interface ChatTabProps {
  chatMessages: ChatMessage[];
  currentUser: User;
  users: User[];
  onAddChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  onMarkAsRead: (senderId: string) => void;
  initialTargetId?: string;
}

export const ChatTab: React.FC<ChatTabProps> = ({ chatMessages, currentUser, users, onAddChatMessage, onMarkAsRead, initialTargetId }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | 'group' | null>(initialTargetId || null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser.roleId === 'admin';

  const filteredUsers = users.filter(u => {
    if (u.id === currentUser.id) return false;
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    // Si no es admin, solo puede ver admins
    if (!isAdmin) return u.roleId === 'admin';
    
    // Si es admin, puede ver a todos
    return true;
  });

  const currentConversation = chatMessages.filter(m => 
    (m.senderId === currentUser.id && m.receiverId === selectedUserId) ||
    (m.senderId === selectedUserId && m.receiverId === currentUser.id)
  ).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentConversation]);

  useEffect(() => {
    if (initialTargetId) {
      setSelectedUserId(initialTargetId);
    }
  }, [initialTargetId]);

  useEffect(() => {
    if (selectedUserId) {
      onMarkAsRead(selectedUserId);
    }
  }, [selectedUserId, chatMessages, onMarkAsRead]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedUserId) return;

    onAddChatMessage({
      senderId: currentUser.id,
      receiverId: selectedUserId,
      text: message.trim(),
      timestamp: new Date().toISOString(),
      isRead: false
    });

    setMessage('');
  };

  return (
    <div className="h-[calc(100vh-160px)] flex bg-white/5 rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
      {/* Sidebar: User List */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-black/20">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-oswald font-black italic uppercase text-white mb-4">Chat Interno</h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value || '')}
              className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-neon outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {/* Group Chat Option */}
          <button
            onClick={() => {
              setSelectedUserId('group');
              onMarkAsRead('group');
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all relative ${selectedUserId === 'group' ? 'bg-neon text-black shadow-lg scale-105' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${selectedUserId === 'group' ? 'bg-black/20 border-black/20' : 'bg-neon/10 border-neon/20'}`}>
              <Users size={20} className={selectedUserId === 'group' ? 'text-black' : 'text-neon'} />
            </div>
            <div className="text-left truncate flex-1">
              <p className="text-xs font-black uppercase truncate tracking-tight">Chat Grupal</p>
              <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedUserId === 'group' ? 'text-black/60' : 'text-gray-600'}`}>
                Todo el equipo
              </p>
            </div>
            {chatMessages.some(m => m.receiverId === 'group' && !m.isRead) && (
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
            )}
          </button>

          <div className="h-px bg-white/5 my-2"></div>

          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => {
                setSelectedUserId(user.id);
                onMarkAsRead(user.id);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all relative ${selectedUserId === user.id ? 'bg-neon text-black shadow-lg scale-105' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
            >
              {user.avatar ? <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-white/10" /> : <div className="w-10 h-10 rounded-full border border-white/10 bg-neutral-800" />}
              <div className="text-left truncate flex-1">
                <p className="text-xs font-black uppercase truncate tracking-tight">{user.name}</p>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedUserId === user.id ? 'text-black/60' : 'text-gray-600'}`}>
                  {user.roleId === 'admin' ? 'ADMINISTRADOR' : 'USUARIO'}
                </p>
              </div>
              {chatMessages.some(m => m.senderId === user.id && m.receiverId === currentUser.id && !m.isRead) && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-black/40">
        {selectedUserId === 'group' ? (
          <GroupChat currentUser={currentUser} allUsers={users} isFloating={false} />
        ) : selectedUserId ? (
          <>
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                {users.find(u => u.id === selectedUserId)?.avatar ? <img src={users.find(u => u.id === selectedUserId)?.avatar} className="w-10 h-10 rounded-full object-cover border border-white/10" /> : <div className="w-10 h-10 rounded-full border border-white/10 bg-neutral-800" />}
                <div>
                  <h4 className="text-white font-black uppercase text-sm tracking-tight">{users.find(u => u.id === selectedUserId)?.name}</h4>
                  <p className="text-[9px] text-neon font-black uppercase tracking-widest">En línea</p>
                </div>
              </div>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
              {currentConversation.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-3xl ${msg.senderId === currentUser.id ? 'bg-neon text-black rounded-tr-none' : 'bg-white/5 text-white border border-white/10 rounded-tl-none'}`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center gap-1.5 mt-2 text-[8px] font-black uppercase tracking-widest ${msg.senderId === currentUser.id ? 'text-black/40' : 'text-gray-500'}`}>
                      <Clock size={10} /> {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-6 border-t border-white/10 bg-black/20">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={message}
                  onChange={e => setMessage(e.target.value || '')}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-neon outline-none shadow-inner"
                />
                <button type="submit" className="bg-neon text-black p-4 rounded-2xl hover:scale-105 transition shadow-lg shadow-neon/20">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
              <UserIcon size={40} className="text-gray-700" />
            </div>
            <h3 className="text-2xl font-oswald font-black italic uppercase text-white mb-2">Selecciona un chat</h3>
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest max-w-xs">Elige a un usuario o administrador de la lista para comenzar a conversar.</p>
          </div>
        )}
      </div>
    </div>
  );
};
