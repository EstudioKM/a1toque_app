import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, MessageSquare, CheckSquare, Clock } from 'lucide-react';
import { ChatMessage, Task, User, ViewMode } from '../types';

interface NotificationCenterProps {
  currentUser: User;
  chatMessages: ChatMessage[];
  tasks: Task[];
  users: User[];
  onOpenAdminTab: (tab: string, targetId?: string) => void;
  setView: (view: ViewMode) => void;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  chatMessages,
  tasks,
  users,
  onOpenAdminTab,
  setView,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(() => {
    const unreadChats = chatMessages.filter(m => m.receiverId === currentUser.id && !m.isRead);
    const newTasks = tasks.filter(t => t.assignedUserIds.includes(currentUser.id) && t.status === 'pending' && !(t.viewedByUserIds || []).includes(currentUser.id));
    
    const items = [
      ...unreadChats.map(m => {
        const sender = users.find(u => u.id === m.senderId);
        return {
          id: m.id,
          type: 'chat' as const,
          title: sender ? `Mensaje de ${sender.name}` : 'Nuevo mensaje',
          description: m.text,
          time: m.timestamp,
          tab: 'chat',
          targetId: m.senderId
        };
      }),
      ...newTasks.map(t => ({
        id: t.id,
        type: 'task' as const,
        title: 'Nueva Tarea Asignada',
        description: t.title,
        time: t.createdAt,
        tab: 'tasks',
        targetId: t.id
      }))
    ];
    
    return items.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeB - timeA;
    });
  }, [chatMessages, tasks, currentUser, users]);

  const unreadCount = notifications.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-neon transition-colors group"
      >
        <Bell size={22} strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg border border-black animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-neon">Centro de Notificaciones</h3>
            <span className="text-[9px] font-bold text-gray-500 uppercase">{unreadCount} Pendientes</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-gray-800 mb-2 opacity-20" />
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAdminTab(notif.tab, notif.targetId);
                  }}
                  className="w-full text-left p-4 hover:bg-white/5 border-b border-white/5 transition-colors flex gap-3 items-start group"
                >
                  <div className={`mt-1 p-2 rounded-lg ${notif.type === 'chat' ? 'bg-blue-500/10 text-blue-400' : 'bg-neon/10 text-neon'}`}>
                    {notif.type === 'chat' ? <MessageSquare size={14} /> : <CheckSquare size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-white uppercase tracking-tight mb-0.5 group-hover:text-neon transition-colors">{notif.title}</p>
                    <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mb-1.5">{notif.description}</p>
                    <div className="flex items-center gap-1 text-[8px] font-bold text-gray-600 uppercase">
                      <Clock size={10} /> {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <button 
              onClick={() => {
                setIsOpen(false);
                setView(ViewMode.ADMIN);
              }}
              className="w-full p-3 bg-white/5 hover:bg-white/10 text-[9px] font-black text-gray-400 hover:text-white uppercase tracking-widest transition-colors"
            >
              Ver Todo el Panel
            </button>
          )}
        </div>
      )}
    </div>
  );
};
