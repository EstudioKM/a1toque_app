import React, { useEffect, useState, useMemo } from 'react';
import { Task, User, WorkLog, SocialAccount } from '../../types';
import { CheckSquare, Square, Clock, AlertCircle, Sparkles, Plus, Timer, Building, Save, X, List, TrendingUp, Calendar, ChevronRight, Trash2, FileText, Send } from 'lucide-react';
import { Role } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface TasksTabProps {
  tasks: Task[];
  currentUser: User;
  currentUserRole: Role;
  socialAccounts: SocialAccount[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onMarkAsViewed: (taskId: string) => void;
  onOpenArticleEditor: () => void;
  onOpenSocialCreator: () => void;
  initialTargetId?: string;
}

export const TasksTab: React.FC<TasksTabProps> = ({ 
  tasks, 
  currentUser, 
  currentUserRole,
  socialAccounts,
  onAddTask,
  onUpdateTask, 
  onDeleteTask,
  onMarkAsViewed, 
  onOpenArticleEditor,
  onOpenSocialCreator,
  initialTargetId 
}) => {
  const [loggingTimeTaskId, setLoggingTimeTaskId] = useState<string | null>(null);
  const [completeTaskOnSave, setCompleteTaskOnSave] = useState(false);
  const [isGeneralLogging, setIsGeneralLogging] = useState(false);
  const [isQuickCompleting, setIsQuickCompleting] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [title, setTitle] = useState('');
  const [account, setAccount] = useState('');
  const [detail, setDetail] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const pendingTasks = useMemo(() => {
    return tasks
      .filter(task => task.assignedUserIds.includes(currentUser.id) && task.status === 'pending')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [tasks, currentUser.id]);

  const completedTasks = useMemo(() => {
    return tasks
      .filter(task => task.assignedUserIds.includes(currentUser.id) && task.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [tasks, currentUser.id]);

  const stats = useMemo(() => {
    const userTasks = tasks.filter(t => t.assignedUserIds.includes(currentUser.id));
    const totalHours = userTasks.reduce((acc, t) => acc + (t.hours || 0), 0);
    const pendingCount = userTasks.filter(t => t.status === 'pending').length;
    
    return {
      totalHours,
      pendingCount,
      totalTasks: userTasks.length
    };
  }, [tasks, currentUser.id]);

  const getTaskTime = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const totalHours = task?.hours || 0;
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return { h, m };
  };

  const toggleTaskStatus = (task: Task) => {
    if (task.status === 'pending') {
      if ((task.hours || 0) > 0) {
        // Already has time, just complete it
        onUpdateTask({
          ...task,
          status: 'completed'
        });
      } else {
        // No time, open modal to log time and complete
        setLoggingTimeTaskId(task.id);
        setCompleteTaskOnSave(true);
        setIsGeneralLogging(true);
        setIsQuickCompleting(true);
        setEditingLogId(null);
        setHours(0); setMinutes(0); setAccount(task.account || ''); setDetail(task.description);
      }
    } else {
      onUpdateTask({
        ...task,
        status: 'pending'
      });
    }
  };

  useEffect(() => {
    if (initialTargetId) {
      const element = document.getElementById(`task-${initialTargetId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [initialTargetId]);

  useEffect(() => {
    pendingTasks.forEach(task => {
      if (!(task.viewedByUserIds || []).includes(currentUser.id)) {
        onMarkAsViewed(task.id);
      }
    });
  }, [pendingTasks, currentUser.id, onMarkAsViewed]);

  const handleLogTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !account || !date) {
      alert('Por favor, completa todos los campos obligatorios (Nombre, Cuenta, Fecha).');
      return;
    }

    const totalHours = hours + (minutes / 60);

    if (loggingTimeTaskId) {
      // Updating an existing assigned task with time
      const task = tasks.find(t => t.id === loggingTimeTaskId);
      if (task) {
        onUpdateTask({
          ...task,
          title: title || task.title,
          date,
          account,
          hours: totalHours,
          description: detail,
          status: completeTaskOnSave ? 'completed' : 'pending'
        });
      }
    } else {
      // Creating a new task (which is the same as logging time)
      onAddTask({
        title: title || detail.substring(0, 50),
        description: detail,
        assignedUserIds: [currentUser.id],
        status: totalHours > 0 ? 'completed' : 'pending',
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        date,
        account,
        hours: totalHours
      });
    }

    setLoggingTimeTaskId(null);
    setCompleteTaskOnSave(false);
    setIsGeneralLogging(false);
    setIsQuickCompleting(false);
    setEditingLogId(null);
    setHours(0);
    setMinutes(0);
    setTitle('');
    setAccount('');
    setDetail('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleEditTask = (task: Task) => {
    setLoggingTimeTaskId(task.id);
    setIsGeneralLogging(true);
    setDate(task.date || new Date().toISOString().split('T')[0]);
    setTitle(task.title);
    setDetail(task.description);
    setAccount(task.account || '');
    const h = Math.floor(task.hours || 0);
    const m = Math.round(((task.hours || 0) - h) * 60);
    setHours(h);
    setMinutes(m);
    setCompleteTaskOnSave(task.status === 'completed');
  };

  return (
    <div className="space-y-10">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-neon rounded-full" />
            <h2 className="text-4xl font-oswald font-black italic uppercase text-white tracking-tighter">Mi Trabajo</h2>
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] pl-5">Dashboard de Productividad Personal</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full lg:w-auto">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between min-w-[140px]">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Clock size={12} className="text-neon" /> Horas Totales
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-oswald font-black italic text-white">{stats.totalHours.toFixed(1)}</span>
              <span className="text-[10px] font-bold text-gray-600 uppercase">hrs</span>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between min-w-[140px]">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <CheckSquare size={12} className="text-neon" /> Pendientes
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-oswald font-black italic text-white">{stats.pendingCount}</span>
              <span className="text-[10px] font-bold text-gray-600 uppercase">tareas</span>
            </div>
          </div>

          <button 
            onClick={() => {
              setIsGeneralLogging(!isGeneralLogging);
              setLoggingTimeTaskId(null);
              setEditingLogId(null);
              setHours(0); setMinutes(0); setAccount(''); setDetail('');
            }}
            className="col-span-2 md:col-span-1 bg-neon hover:bg-neon/90 text-black p-4 rounded-2xl flex flex-col items-center justify-center transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-neon/10"
          >
            <Plus size={24} className="mb-1" />
            <span className="text-[9px] font-black uppercase tracking-widest">Nueva Tarea / Registro</span>
          </button>
        </div>
      </div>

      {/* Logging Modal */}
      <AnimatePresence>
        {isGeneralLogging && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGeneralLogging(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] w-full max-w-2xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden z-10"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-neon/20" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-neon font-oswald font-black italic uppercase text-xl flex items-center gap-2 tracking-tight">
                  <Timer size={24} /> {isQuickCompleting ? 'Registrar Tiempo' : (completeTaskOnSave ? 'Completar Tarea' : (loggingTimeTaskId ? 'Editar Registro' : 'Nueva Tarea / Registro'))}
                </h3>
                <button onClick={() => {
                  setIsGeneralLogging(false);
                  setIsQuickCompleting(false);
                }} className="w-8 h-8 flex items-center justify-center bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-all">
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleLogTime} className="space-y-5">
                {!isQuickCompleting && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Nombre de la Tarea</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Diseño de interfaz"
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                        required
                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-neon outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Fecha de Actividad</label>
                        <div className="relative cursor-pointer" onClick={() => {
                          try {
                            dateInputRef.current?.showPicker();
                          } catch (e) {
                            // Ignore error if showPicker is unsupported or already open
                          }
                        }}>
                          <input 
                            ref={dateInputRef}
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)}
                            onClick={(e) => {
                              try {
                                (e.target as HTMLInputElement).showPicker();
                              } catch (err) {}
                            }}
                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-neon outline-none transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Cuenta / Proyecto</label>
                        <select 
                          value={account} 
                          onChange={e => setAccount(e.target.value)}
                          required
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-neon outline-none appearance-none cursor-pointer transition-all"
                        >
                          <option value="" disabled>Seleccionar...</option>
                          {socialAccounts.map(acc => (
                            <option key={acc.id} value={acc.name}>{acc.name}</option>
                          ))}
                          <option value="General">General / Otros</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Tiempo Invertido</label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <select 
                        value={hours} 
                        onChange={e => setHours(parseInt(e.target.value))}
                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-neon outline-none appearance-none cursor-pointer transition-all"
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                          <option key={h} value={h}>{h} {h === 1 ? 'hora' : 'horas'}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <select 
                        value={minutes} 
                        onChange={e => setMinutes(parseInt(e.target.value))}
                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-neon outline-none appearance-none cursor-pointer transition-all"
                      >
                        <option value={0}>0 minutos</option>
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={45}>45 minutos</option>
                      </select>
                    </div>
                  </div>
                </div>

                {!isQuickCompleting && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Descripción del Trabajo</label>
                    <textarea 
                      rows={2}
                      placeholder="¿Qué estuviste haciendo?"
                      value={detail} 
                      onChange={e => setDetail(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-neon outline-none transition-all resize-none"
                    />
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsGeneralLogging(false);
                      setIsQuickCompleting(false);
                    }}
                    className="flex-1 py-3 border border-white/10 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="flex-[2] bg-neon text-black py-3 rounded-xl font-black text-[10px] uppercase italic tracking-widest hover:scale-[1.02] active:scale-95 transition shadow-xl shadow-neon/10 flex items-center justify-center gap-2">
                    <Save size={16} /> {isQuickCompleting ? 'FINALIZAR Y COMPLETAR' : (loggingTimeTaskId ? 'GUARDAR CAMBIOS' : 'REGISTRAR ACTIVIDAD')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-16">
        {/* Main Tasks Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex gap-6">
              <div className="text-[11px] font-black uppercase tracking-widest pb-4 relative text-neon">
                Pendientes ({stats.pendingCount})
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-1 bg-neon" />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {pendingTasks.length === 0 ? (
              <div className="py-24 text-center bg-white/[0.01] rounded-[40px] border border-dashed border-white/5">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckSquare size={32} className="text-gray-800" />
                </div>
                <h4 className="text-gray-500 font-oswald font-black italic uppercase text-2xl tracking-widest">Todo al día</h4>
                <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest mt-2">No hay tareas pendientes en este momento</p>
              </div>
            ) : (
              pendingTasks.map((task) => {
                const taskTime = getTaskTime(task.id);

                return (
                  <motion.div 
                    layout
                    key={task.id} 
                    id={`task-${task.id}`}
                    onClick={() => handleEditTask(task)}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-20 shrink-0 text-center">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-neon transition-colors">
                        {new Date(task.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase()}
                      </span>
                    </div>
                    <div className={`flex-1 bg-[#0a0a0a] border p-4 md:p-5 rounded-2xl group-hover:border-white/30 group-hover:bg-[#111] transition-all flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden cursor-pointer shadow-lg ${initialTargetId === task.id ? 'border-neon ring-1 ring-neon shadow-[0_0_30px_rgba(0,255,157,0.1)]' : 'border-white/10'}`}>
                      {!(task.viewedByUserIds || []).includes(currentUser.id) && (
                        <div className="absolute top-0 right-0 bg-neon text-black text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                          NUEVA
                        </div>
                      )}

                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-lg font-oswald font-black italic uppercase tracking-tight mb-1 truncate text-white">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-gray-400 leading-relaxed truncate mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4">
                          {task.account && (
                            <>
                              <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Building size={10} /> {task.account}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center shrink-0 mt-3 md:mt-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskStatus(task);
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-neon text-black hover:scale-105 shadow-lg shadow-neon/10"
                        >
                          <CheckSquare size={14} />
                          COMPLETADA
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Última Actividad Section */}
        {completedTasks.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-6 bg-neon rounded-full" />
              <h5 className="text-sm font-oswald font-black italic uppercase text-white tracking-widest">Última actividad</h5>
            </div>
            <div className="grid gap-3">
              {completedTasks.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 group">
                  <div className="w-20 shrink-0 text-center">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-neon transition-colors">
                      {new Date(activity.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 bg-[#0a0a0a] border border-white/10 p-4 md:p-5 rounded-2xl group-hover:border-white/30 group-hover:bg-[#111] transition-all flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden cursor-pointer shadow-lg" onClick={() => handleEditTask(activity)}>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-white text-lg font-oswald font-black italic uppercase tracking-tight mb-1 truncate">{activity.title}</p>
                      <div className="flex items-center gap-4">
                        {activity.account && (
                          <>
                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                              <Building size={10} /> {activity.account}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 md:mt-0">
                      <div className="text-xs font-black text-neon bg-neon/5 px-4 py-2 rounded-full border border-neon/10">
                        {activity.hours?.toFixed(1) || '0.0'}h
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditTask(activity); }} 
                          className="w-10 h-10 flex items-center justify-center bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Timer size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteTask(activity.id); }} 
                          className="w-10 h-10 flex items-center justify-center bg-red-500/5 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
