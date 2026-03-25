import React, { useEffect, useState, useMemo } from 'react';
import { Task, User, WorkLog, SocialAccount, TaskStatus } from '../../types';
import { CheckSquare, Square, Clock, AlertCircle, Sparkles, Plus, Timer, Building, Save, X, List, TrendingUp, Calendar, ChevronRight, Trash2, FileText, Send } from 'lucide-react';
import { Role } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatArgentinaDate } from '../../services/dateUtils';

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
  users: User[];
  onUpdateUser: (user: User) => void;
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
  initialTargetId,
  users,
  onUpdateUser
}) => {
  const [loggingTimeTaskId, setLoggingTimeTaskId] = useState<string | null>(null);
  const [completeTaskOnSave, setCompleteTaskOnSave] = useState(false);
  const [isGeneralLogging, setIsGeneralLogging] = useState(false);
  const [isQuickCompleting, setIsQuickCompleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [assignedUserNames, setAssignedUserNames] = useState<string[]>([]);
  
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [title, setTitle] = useState('');
  const [account, setAccount] = useState('');
  const [detail, setDetail] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<{ userId: string; text: string; timestamp: string }[]>([]);
  const [history, setHistory] = useState<{ userId: string; action: string; timestamp: string }[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const noteInputRef = React.useRef<HTMLInputElement>(null);

  const pendingTasks = useMemo(() => {
    return tasks
      .filter(task => (task.assignedUserIds || []).includes(currentUser.id) && task.status !== 'completed')
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [tasks, currentUser.id]);

  const completedTasks = useMemo(() => {
    return tasks
      .filter(task => (task.assignedUserIds || []).includes(currentUser.id) && task.status === 'completed')
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [tasks, currentUser.id]);

  const stats = useMemo(() => {
    const userTasks = tasks.filter(t => t.assignedUserIds.includes(currentUser.id));
    const totalHours = userTasks.reduce((acc, t) => acc + (t.hours || 0), 0);
    const pendingCount = userTasks.filter(t => t.status !== 'completed').length;
    
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
    if (task.status !== 'completed') {
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
        setStatus('completed');
        setIsGeneralLogging(true);
        setIsQuickCompleting(true);
        setEditingLogId(null);
        setHours(0); 
        setMinutes(0); 
        setAccount(task.account || ''); 
        setDetail(task.description); 
        setTitle(task.title); 
        setDate(task.date || new Date().toISOString().split('T')[0]);
        setAssignedUserIds(task.assignedUserIds || []);
        setAssignedUserNames(users.filter(u => (task.assignedUserIds || []).includes(u.id)).map(u => u.name));
        setNotes(task.notes || []);
        setHistory(task.history || []);
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

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Validation: for new tasks we need account and some text. 
    // For existing tasks we just need a date (which has a default).
    const isNewTask = !loggingTimeTaskId;
    if (isNewTask && (!account || (!title && !detail))) {
      alert('Por favor, completa los campos obligatorios (Cuenta y Título/Descripción).');
      return;
    }

    if (!date) {
      alert('Por favor, selecciona una fecha.');
      return;
    }

    if (status === 'completed' && (hours + minutes / 60) <= 0) {
      alert('Una tarea completada debe tener tiempo asignado.');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalHours = hours + (minutes / 60);

      if (loggingTimeTaskId) {
        // Updating an existing assigned task with time
        const task = tasks.find(t => t.id === loggingTimeTaskId);
        if (task) {
          let changes = [];
          if (title && title !== task.title) changes.push(`Título: "${task.title}" -> "${title}"`);
          if (detail && detail !== task.description) changes.push("Descripción modificada");
          if (account && account !== task.account) changes.push(`Cuenta: "${task.account}" -> "${account}"`);
          if (totalHours !== (task.hours || 0)) changes.push(`Tiempo: ${task.hours || 0}h -> ${totalHours}h`);
          if (status !== task.status) changes.push(`Estado: ${task.status} -> ${status}`);
          
          const action = changes.length > 0 ? `Editado: ${changes.join(', ')}` : 'Editado';

          // Notification logic for new notes
          const newNotes = notes.filter(n => !(task.notes || []).some(tn => tn.timestamp === n.timestamp));
          if (newNotes.length > 0) {
              for (const userId of assignedUserIds) {
                  if (userId !== currentUser.id) {
                      const user = users.find(u => u.id === userId);
                      if (user) {
                          const alertMessage = {
                              id: Date.now().toString(),
                              message: `Nueva nota en tarea "${task.title}"`,
                              seen: false,
                              createdAt: new Date().toISOString()
                          };
                          onUpdateUser({
                              ...user,
                              alertMessages: [...(user.alertMessages || []), alertMessage]
                          });
                      }
                  }
              }
          }

          await onUpdateTask({
            ...task,
            title: title || task.title,
            date: date || task.date,
            account: account || task.account,
            hours: totalHours,
            description: detail || task.description,
            status: status,
            notes: notes,
            history: [...(task.history || []), { userId: currentUser.id, action, timestamp: new Date().toISOString() }],
            assignedUserIds: assignedUserIds
          });
        }
      } else {
        // Creating a new task (which is the same as logging time)
        await onAddTask({
          title: title || detail.substring(0, 50),
          description: detail,
          assignedUserIds: [currentUser.id],
          status: status,
          createdBy: currentUser.id,
          createdAt: new Date().toISOString(),
          date,
          account,
          hours: totalHours,
          notes: [],
          history: [{ userId: currentUser.id, action: 'Creada', timestamp: new Date().toISOString() }]
        });
      }

      setIsGeneralLogging(false);
      setIsQuickCompleting(false);
      setLoggingTimeTaskId(null);
      setCompleteTaskOnSave(false);
      setEditingLogId(null);
      setHours(0);
      setMinutes(0);
      setTitle('');
      setAccount('');
      setDetail('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes([]);
      setHistory([]);
      setAssignedUserIds([]);
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Error al guardar la tarea.");
    } finally {
      setIsSubmitting(false);
    }
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
    setStatus(task.status);
    setAssignedUserNames(users.filter(u => task.assignedUserIds.includes(u.id)).map(u => u.name));
    setNotes(task.notes || []);
    setHistory(task.history || []);
    setAssignedUserIds(task.assignedUserIds || []);
  };

  return (
    <div className="pt-4 md:pt-8">
      <div className="pt-14 md:pt-18 space-y-10">
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
              setHours(0); setMinutes(0); setAccount(''); setDetail(''); setTitle(''); setDate(new Date().toISOString().split('T')[0]);
              setAssignedUserIds([currentUser.id]);
              setAssignedUserNames([currentUser.name]);
              setStatus('pending');
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
              
              <form onSubmit={handleLogTime} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                {assignedUserNames.length > 0 && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 mb-2 block">Responsables</label>
                    <div className="flex flex-wrap gap-2">
                      {assignedUserNames.map(name => (
                        <span key={name} className="bg-neon/10 text-neon text-[10px] font-black px-2 py-1 rounded-md uppercase">{name}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {currentUserRole.name === 'Admin' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Editar Responsables</label>
                    <div className="flex flex-wrap gap-2">
                      {users.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setAssignedUserIds(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]);
                            setAssignedUserNames(prev => prev.includes(user.name) ? prev.filter(n => n !== user.name) : [...prev, user.name]);
                          }}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${assignedUserIds.includes(user.id) ? 'bg-neon text-black' : 'bg-white/10 text-white'}`}
                        >
                          {user.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Estado</label>
                        <select 
                          value={status}
                          onChange={e => setStatus(e.target.value as TaskStatus)}
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-neon outline-none appearance-none cursor-pointer transition-all"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="in_progress">En Proceso</option>
                          <option value="completed">Completada</option>
                        </select>
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
                  <>
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

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Notas</label>
                      <div className="space-y-2">
                        {notes.map((note, i) => (
                          <div key={i} className="bg-white/5 p-2 rounded-lg text-xs text-white flex justify-between items-start group">
                            <div className="flex-1">
                              <span className="text-neon font-bold">{users.find(u => u.id === note.userId)?.name || 'Usuario'}</span>
                              <span className="text-gray-500 text-[10px] ml-1">({new Date(note.timestamp).toLocaleString()})</span>
                              <div className="mt-1">{note.text}</div>
                            </div>
                            {note.userId === currentUser.id && (
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newText = prompt("Editar nota:", note.text);
                                    if (newText !== null && newText.trim() !== '') {
                                      setNotes(prev => prev.map((n, index) => index === i ? { ...n, text: newText } : n));
                                    }
                                  }}
                                  className="text-gray-500 hover:text-white"
                                >
                                  <FileText size={12} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNotes(prev => prev.filter((_, index) => index !== i));
                                  }}
                                  className="text-red-500 hover:text-red-400"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            ref={noteInputRef}
                            placeholder="Nueva nota..."
                            className="flex-1 bg-black border border-white/10 rounded-xl p-2 text-white text-sm focus:border-neon outline-none transition-all"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (noteInputRef.current) {
                                  setNotes(prev => [...prev, { userId: currentUser.id, text: noteInputRef.current!.value, timestamp: new Date().toISOString() }]);
                                  noteInputRef.current.value = '';
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Historial</label>
                      <div className="space-y-1">
                        {history.map((h, i) => (
                          <div key={i} className="text-[10px] text-gray-500">
                            {new Date(h.timestamp).toLocaleString()} - {users.find(u => u.id === h.userId)?.name || 'Usuario'}: {h.action}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
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
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`flex-[2] bg-neon text-black py-3 rounded-xl font-black text-[10px] uppercase italic tracking-widest transition shadow-xl shadow-neon/10 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {isSubmitting ? 'GUARDANDO...' : (isQuickCompleting ? 'FINALIZAR Y COMPLETAR' : (loggingTimeTaskId ? 'GUARDAR CAMBIOS' : 'REGISTRAR ACTIVIDAD'))}
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
              <div className="py-8 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/5 flex flex-col items-center justify-center">
                <div className="flex items-center gap-3">
                  <CheckSquare size={20} className="text-gray-800" />
                  <h4 className="text-gray-500 font-oswald font-black italic uppercase text-lg tracking-widest">Todo al día</h4>
                </div>
                <p className="text-gray-700 text-[9px] font-black uppercase tracking-widest mt-1">No hay tareas pendientes en este momento</p>
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
                        {formatArgentinaDate(task.date)}
                      </span>
                    </div>
                    <div className={`flex-1 bg-[#0a0a0a] border p-4 md:p-5 rounded-2xl group-hover:border-white/30 group-hover:bg-[#111] transition-all flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden cursor-pointer shadow-lg ${initialTargetId === task.id ? 'border-neon ring-1 ring-neon shadow-[0_0_30px_rgba(0,255,157,0.1)]' : 'border-white/10'}`}>
                      {!(task.viewedByUserIds || []).includes(currentUser.id) && (
                        <div className="absolute top-0 right-0 bg-neon text-black text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                          NUEVA
                        </div>
                      )}

                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-lg font-oswald font-black italic uppercase tracking-tight mb-1 text-white break-words">
                          {task.title}
                        </h4>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2">
                          Creada por: {users.find(u => u.id === task.createdBy)?.name || (task.history && task.history.length > 0 ? users.find(u => u.id === task.history[0].userId)?.name : 'Desconocido')}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-400 leading-relaxed mb-2 break-words">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 px-2 py-1 rounded ${task.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-500' : task.status === 'pending' ? 'bg-neon/10 text-neon' : 'bg-gray-500/10 text-gray-500'}`}>
                            {task.status === 'in_progress' ? 'En Proceso' : task.status === 'pending' ? 'Pendiente' : 'Completada'}
                          </p>
                          <div className="flex -space-x-2">
                            {users.filter(u => task.assignedUserIds.includes(u.id)).map(user => (
                              <div key={user.id} className="w-6 h-6 rounded-full bg-gray-700 border border-black text-[9px] flex items-center justify-center text-white font-bold" title={user.name}>
                                {user.name.substring(0, 2).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
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
                      {formatArgentinaDate(activity.date)}
                    </span>
                  </div>
                  <div className="flex-1 bg-[#0a0a0a] border border-white/10 p-4 md:p-5 rounded-2xl group-hover:border-white/30 group-hover:bg-[#111] transition-all flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden cursor-pointer shadow-lg" onClick={() => handleEditTask(activity)}>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-white text-lg font-oswald font-black italic uppercase tracking-tight mb-1 break-words">{activity.title}</p>
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
    </div>
  );
};
