import React, { useMemo } from 'react';
import { Task, User, Role, SiteConfig, ChatMessage } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Send, Timer, BellRing, Activity, CheckSquare, Clock, ChevronRight, MessageSquare, Bell } from 'lucide-react';
import { formatFullDate, formatArgentinaTime, parseArgentinaDate } from '../../services/dateUtils';

interface HomeTabProps {
  currentUser: User;
  currentUserRole: Role;
  siteConfig: SiteConfig;
  tasks: Task[];
  chatMessages: ChatMessage[];
  users: User[];
  onOpenTasks: () => void;
  onUpdateUser: (user: User) => void;
  onOpenAdminTab: (tab: string, targetId?: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  currentUser,
  currentUserRole,
  siteConfig,
  tasks,
  chatMessages,
  users,
  onOpenTasks,
  onUpdateUser,
  onOpenAdminTab
}) => {
  const userTasks = tasks
    .filter(t => t.assignedUserIds.includes(currentUser.id))
    .sort((a, b) => parseArgentinaDate(b.date).getTime() - parseArgentinaDate(a.date).getTime());

  const recentActivity = userTasks
    .filter(t => t.status === 'completed')
    .slice(0, 5);

  const pendingTasks = userTasks
    .filter(t => t.status === 'pending')
    .slice(0, 3);

  const activeAlerts = (currentUser.alertMessages || []).filter(a => !a.seen);

  const notifications = useMemo(() => {
    const unreadChats = chatMessages.filter(m => m.receiverId === currentUser.id && !m.isRead);
    const newTasks = tasks.filter(t => t.assignedUserIds.includes(currentUser.id) && t.status === 'pending' && !(t.viewedByUserIds || []).includes(currentUser.id));
    
    const items = [
      ...unreadChats.map(m => {
        const sender = users.find(u => u.id === m.senderId);
        return {
          id: `chat-${m.id}`,
          type: 'chat' as const,
          title: sender ? `Mensaje de ${sender.name}` : 'Nuevo mensaje',
          description: m.text,
          time: m.timestamp,
          tab: 'chat',
          targetId: m.senderId
        };
      }),
      ...newTasks.map(t => ({
        id: `task-${t.id}`,
        type: 'task' as const,
        title: 'Nueva Tarea Asignada',
        description: t.title,
        time: t.createdAt,
        tab: 'tasks',
        targetId: t.id
      })),
      ...activeAlerts.map(a => ({
        id: `alert-${a.id}`,
        type: 'alert' as const,
        title: 'Notificación Personal',
        description: a.message,
        time: a.createdAt || new Date().toISOString(),
        tab: 'home',
        targetId: a.id
      }))
    ];
    
    return items.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeB - timeA;
    });
  }, [chatMessages, tasks, currentUser, users, activeAlerts]);

  const handleAcknowledgeAlert = (alertId: string) => {
    const updatedAlerts = (currentUser.alertMessages || []).map(a => 
      a.id === alertId ? { ...a, seen: true, seenAt: new Date().toISOString() } : a
    );
    onUpdateUser({ ...currentUser, alertMessages: updatedAlerts });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-[40px] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex items-center gap-6">
              {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-neon"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-neon/10 border-2 border-neon flex items-center justify-center text-neon text-2xl font-oswald font-black italic">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-oswald font-black italic uppercase text-white mb-2 tracking-tighter">
                  ¡Hola, <span className="text-neon">{currentUser.name.split(' ')[0]}</span>!
                </h1>
              </div>
            </div>
            
            <button 
              onClick={onOpenTasks}
              className="hidden"
            >
              <Timer size={16} /> Nueva Tarea
            </button>
          </div>

          <div className="space-y-6">
            {/* Notification Center */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  <BellRing size={16} className="text-neon" /> Centro de Notificaciones
                </h3>
                {notifications.length > 0 && (
                  <span className="bg-neon text-black px-2 py-0.5 rounded-full text-[9px] font-black">{notifications.length}</span>
                )}
              </div>
              
              <div className={`bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 ${notifications.length === 0 ? 'h-[120px]' : 'h-[300px]'}`}>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                      <Bell size={24} className="text-gray-800 mb-2 opacity-20" />
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No tienes notificaciones</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {notifications.map(notif => (
                        <div key={notif.id} className={`p-4 hover:bg-white/5 transition-colors group ${notif.type === 'alert' ? 'bg-yellow-500/10 border-l-4 border-yellow-500' : ''}`}>
                          <div className="flex gap-4 items-start">
                            <div className={`mt-1 p-2 rounded-xl shrink-0 ${notif.type === 'chat' ? 'bg-blue-500/10 text-blue-400' : notif.type === 'alert' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neon/10 text-neon'}`}>
                              {notif.type === 'chat' ? <MessageSquare size={16} /> : notif.type === 'alert' ? <Bell size={16} /> : <CheckSquare size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              {notif.type === 'alert' ? (
                                <>
                                  <p className="text-[9px] font-bold text-yellow-500/70 uppercase tracking-widest mb-1">{notif.title}</p>
                                  <p className="text-[13px] text-white font-medium leading-relaxed mb-3">{notif.description}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-[11px] font-black uppercase tracking-tight mb-1 text-white group-hover:text-neon transition-colors">{notif.title}</p>
                                  <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mb-2">{notif.description}</p>
                                </>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1 text-[8px] font-bold text-gray-600 uppercase">
                                  <Clock size={10} /> {formatArgentinaTime(notif.time)}
                                </div>
                                {notif.type === 'alert' ? (
                                  <button 
                                    onClick={() => handleAcknowledgeAlert(notif.targetId)}
                                    className="px-4 py-2 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-lg hover:bg-yellow-400 transition-colors text-[10px] shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                                  >
                                    Aceptar
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => onOpenAdminTab(notif.tab, notif.targetId)}
                                    className="text-[9px] font-black text-neon hover:text-white uppercase tracking-widest"
                                  >
                                    Ver
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  <Timer size={16} className="text-neon" /> Tareas Pendientes
                </h3>
                {pendingTasks.length > 0 && (
                  <button 
                    onClick={onOpenTasks}
                    className="text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-neon transition-colors"
                  >
                    Ver todas
                  </button>
                )}
              </div>
              
              {pendingTasks.length > 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-gray-500 uppercase bg-white/[0.03]">
                      <tr>
                        <th className="px-6 py-4">Fecha</th>
                        <th className="px-6 py-4">Tarea</th>
                        <th className="px-6 py-4">Cuenta</th>
                        <th className="px-6 py-4 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pendingTasks.map(task => (
                        <tr key={task.id} className="hover:bg-white/5 transition-colors cursor-pointer group" onClick={onOpenTasks}>
                          <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                            {formatFullDate(task.date)}
                          </td>
                          <td className="px-6 py-4 text-white font-bold group-hover:text-neon transition-colors">{task.title}</td>
                          <td className="px-6 py-4 text-gray-400">{task.account}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-black text-gray-500 uppercase tracking-widest group-hover:bg-neon/10 group-hover:text-neon transition-all">
                              Pendiente
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center bg-white/[0.01] rounded-[32px] border border-dashed border-white/5 flex flex-col items-center justify-center group hover:bg-white/[0.02] transition-all duration-500">
                  <div className="flex items-center gap-4 mb-2">
                    <CheckSquare size={24} className="text-gray-800 group-hover:text-neon transition-colors" />
                    <h4 className="text-gray-600 font-oswald font-black italic uppercase text-2xl tracking-tighter group-hover:text-white transition-colors">Todo al día</h4>
                  </div>
                  <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.3em] mt-1">No tienes tareas pendientes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
