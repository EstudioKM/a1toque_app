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

  const isUserOnline = (user: User) => {
    return user.isOnline && (user.lastConnection && (new Date().getTime() - new Date(user.lastConnection).getTime() < 120000));
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const onlineA = isUserOnline(a);
    const onlineB = isUserOnline(b);
    if (onlineA && !onlineB) return -1;
    if (!onlineA && onlineB) return 1;
    return a.name.localeCompare(b.name);
  });

  const onlineCount = users.filter(isUserOnline).length;

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-oswald font-black italic uppercase text-white">Chat Interno</h3>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-neon/10 border border-neon/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-neon rounded-full animate-pulse shadow-[0_0_5px_rgba(0,255,102,0.8)]"></div>
              <span className="text-[10px] font-black uppercase text-neon tracking-widest">{onlineCount} EN LÍNEA</span>
            </div>
          </div>
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
          {/* Group Chat Option - Differentiated */}
          <button
            onClick={() => {
              setSelectedUserId('group');
              onMarkAsRead('group');
            }}
            className={`w-full flex items-center gap-3 p-4 rounded-3xl transition-all relative group ${selectedUserId === 'group' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,102,0.3)] scale-105' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-transform group-hover:rotate-6 ${selectedUserId === 'group' ? 'bg-black/20 border-black/20' : 'bg-neon/20 border-neon/30'}`}>
              <Users size={24} className={selectedUserId === 'group' ? 'text-black' : 'text-neon'} />
            </div>
            <div className="text-left truncate flex-1">
              <p className="text-sm font-black uppercase truncate tracking-tight">Chat Grupal</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedUserId === 'group' ? 'text-black/60' : 'text-neon/60'}`}>
                Canal General
              </p>
            </div>
            {chatMessages.some(m => m.receiverId === 'group' && !m.isRead) && (
              <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] border-2 border-black"></span>
            )}
          </button>

          <div className="flex items-center gap-2 px-2 py-4">
            <div className="h-px flex-1 bg-white/10"></div>
            <span className="text-[9px] font-black uppercase text-gray-600 tracking-[0.2em]">Contactos</span>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          {sortedUsers.map(user => {
            const online = isUserOnline(user);
            return (
              <button
                key={user.id}
                onClick={() => {
                  setSelectedUserId(user.id);
                  onMarkAsRead(user.id);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all relative ${selectedUserId === user.id ? 'bg-neon text-black shadow-lg scale-105' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
              >
                <div className="relative">
                  {user.avatar ? <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-white/10" /> : <div className="w-10 h-10 rounded-full border border-white/10 bg-neutral-800" />}
                  {online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-neon rounded-full border-2 border-black shadow-[0_0_10px_rgba(0,255,102,0.5)]"></span>
                  )}
                </div>
                <div className="text-left truncate flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black uppercase truncate tracking-tight">{user.name}</p>
                    {online && (
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${selectedUserId === user.id ? 'bg-black/20 text-black' : 'bg-neon/10 text-neon border border-neon/20'}`}>
                        EN LÍNEA
                      </span>
                    )}
                  </div>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedUserId === user.id ? 'text-black/60' : 'text-gray-600'}`}>
                    {user.roleId === 'admin' ? 'ADMINISTRADOR' : 'USUARIO'}
                  </p>
                </div>
                {chatMessages.some(m => m.senderId === user.id && m.receiverId === currentUser.id && !m.isRead) && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-black/40">
        {selectedUserId === 'group' ? (
          <GroupChat currentUser={currentUser} allUsers={users} isFloating={false} />
        ) : selectedUserId ? (() => {
          const selectedUser = users.find(u => u.id === selectedUserId);
          const isActuallyOnline = selectedUser?.isOnline && (selectedUser.lastConnection && (new Date().getTime() - new Date(selectedUser.lastConnection).getTime() < 120000));
          
          return (
          <>
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {selectedUser?.avatar ? <img src={selectedUser.avatar} className="w-10 h-10 rounded-full object-cover border border-white/10" /> : <div className="w-10 h-10 rounded-full border border-white/10 bg-neutral-800" />}
                  {isActuallyOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-neon rounded-full border-2 border-black shadow-[0_0_10px_rgba(0,255,102,0.5)]"></span>
                  )}
                </div>
                <div>
                  <h4 className="text-white font-black uppercase text-sm tracking-tight">{selectedUser?.name}</h4>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${isActuallyOnline ? 'text-neon' : 'text-gray-600'}`}>
                    {isActuallyOnline ? 'En línea' : 'Desconectado'}
                  </p>
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
          );
        })() : (
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
