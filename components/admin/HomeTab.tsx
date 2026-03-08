import React from 'react';
import { Task, User, Role, SiteConfig } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Send, Timer, BellRing, Activity, CheckSquare, Clock, ChevronRight } from 'lucide-react';

interface HomeTabProps {
  currentUser: User;
  currentUserRole: Role;
  siteConfig: SiteConfig;
  tasks: Task[];
  onOpenTasks: () => void;
  onUpdateUser: (user: User) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  currentUser,
  currentUserRole,
  siteConfig,
  tasks,
  onOpenTasks,
  onUpdateUser
}) => {
  const userTasks = tasks
    .filter(t => t.assignedUserIds.includes(currentUser.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const recentActivity = userTasks
    .filter(t => t.status === 'completed')
    .slice(0, 5);

  const pendingTasks = userTasks
    .filter(t => t.status === 'pending')
    .slice(0, 3);

  const activeAlerts = (currentUser.alertMessages || []).filter(a => !a.seen);

  const handleAcknowledgeAlert = (alertId: string) => {
    const updatedAlerts = (currentUser.alertMessages || []).map(a => 
      a.id === alertId ? { ...a, seen: true, seenAt: new Date().toISOString() } : a
    );
    onUpdateUser({ ...currentUser, alertMessages: updatedAlerts });
  };

  return (
    <div className="space-y-8">
      {/* Personal User Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence>
            {activeAlerts.map((alert, idx) => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-neon p-6 rounded-[32px] border border-black/10 shadow-2xl shadow-neon/20 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-black/10 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="w-14 h-14 bg-black/10 rounded-2xl flex items-center justify-center shrink-0">
                  <BellRing size={28} className="text-black" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mb-1">Notificación Personal</p>
                  <p className="text-xl font-oswald font-black italic uppercase text-black leading-tight">
                    {alert.message}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:block px-6 py-2 bg-black/10 rounded-xl text-[10px] font-black text-black uppercase tracking-widest">
                    Urgente
                  </div>
                  <button 
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="bg-black text-neon px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                  >
                    Aceptar
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-5xl font-oswald font-black italic uppercase text-white mb-2 tracking-tighter">
                ¡Hola, <span className="text-neon">{currentUser.name.split(' ')[0]}</span>!
              </h1>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">
                Panel Operativo // {currentUserRole.name}
              </p>
            </div>
            
            <button 
              onClick={onOpenTasks}
              className="flex items-center gap-2 bg-neon text-black px-6 py-3 rounded-2xl hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-neon/10"
            >
              <Timer size={16} /> Nueva Tarea
            </button>
          </div>

          <div className="space-y-12">
            {/* Pending Tasks - PRIMARY */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  <BellRing size={16} className="text-neon" /> Tareas Pendientes
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pendingTasks.length > 0 ? pendingTasks.map(task => (
                  <div key={task.id} className="flex flex-col p-6 bg-white/[0.03] rounded-3xl border border-white/5 group hover:border-neon/20 transition-all cursor-pointer" onClick={onOpenTasks}>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-neon/10 transition-colors">
                      <Timer size={20} className="text-gray-400 group-hover:text-neon" />
                    </div>
                    <p className="text-sm font-black text-white uppercase mb-2 group-hover:text-neon transition-colors">{task.title}</p>
                    <p className="text-[10px] text-gray-500 uppercase leading-relaxed line-clamp-2 mb-4">{task.description || 'Sin descripción'}</p>
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[9px] text-gray-600 uppercase font-bold">{task.account}</span>
                      <div className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-black text-gray-500 uppercase tracking-widest group-hover:bg-neon/10 group-hover:text-neon transition-all">
                        Pendiente
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-12 text-center border border-dashed border-white/5 rounded-[32px] bg-black/20">
                    <p className="text-[10px] text-neon uppercase font-black tracking-[0.3em]">¡Todo al día!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Latest Activity - SECONDARY */}
            <div className="space-y-6">
              <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Activity size={16} className="text-neon" /> Última Actividad
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentActivity.length > 0 ? recentActivity.map(task => (
                  <div key={task.id} className="flex items-center gap-4 p-5 bg-black/40 rounded-[32px] border border-white/5 group hover:border-white/10 transition-all">
                    <div className="w-12 h-12 bg-neon/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-neon/20 transition-colors">
                      <CheckSquare size={20} className="text-neon" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white uppercase truncate">{task.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] text-gray-500 uppercase flex items-center gap-1">
                          <Clock size={10} /> {new Date(task.date).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] text-neon font-black uppercase tracking-widest bg-neon/5 px-2 py-0.5 rounded-md">
                          {task.hours}h
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-700 group-hover:text-neon transition-colors" />
                  </div>
                )) : (
                  <div className="col-span-full py-12 text-center border border-dashed border-white/5 rounded-[32px] bg-black/20">
                    <p className="text-[10px] text-gray-700 uppercase font-black tracking-[0.3em]">Sin actividad reciente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
