import React, { useState, useMemo } from 'react';
import { Task, User, WorkLog, SocialAccount } from '../../types';
import { Plus, Trash2, Users, CheckSquare, Square, Clock, X, LayoutDashboard, List, ChevronRight, TrendingUp, Timer, Calendar, Save, AlertCircle, BarChart3, PieChart as PieChartIcon, Filter, Download, Building, MessageCircle, Activity, BellRing, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatArgentinaDate, formatArgentinaTimestamp, parseArgentinaDate } from '../../services/dateUtils';

interface AdminTasksTabProps {
  tasks: Task[];
  users: User[];
  socialAccounts: SocialAccount[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onUpdateUser: (user: User) => void;
}

export const AdminTasksTab: React.FC<AdminTasksTabProps> = ({ tasks, users, socialAccounts, onAddTask, onUpdateTask, onDeleteTask, onUpdateUser }) => {
  const [view, setView] = useState<'list' | 'dashboard'>('list');
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'management'>('management');
  const [userAlertMessage, setUserAlertMessage] = useState('');
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [isAddingGlobalAlert, setIsAddingGlobalAlert] = useState(false);
  const [globalAlertMessage, setGlobalAlertMessage] = useState('');
  const [globalAlertUserIds, setGlobalAlertUserIds] = useState<string[]>([]);
  const [selectedAlertUserId, setSelectedAlertUserId] = useState<string | null>(null);
  const [modalTaskFilter, setModalTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [modalTaskSort, setModalTaskSort] = useState<'date-desc' | 'date-asc' | 'time-desc' | 'time-asc'>('date-desc');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletedTasksModal, setShowCompletedTasksModal] = useState(false);

  const setQuickRange = (range: 'all' | 'thisMonth' | 'lastMonth' | 'last7Days' | 'today') => {
    if (range === 'all') {
      setDateRange({ start: '', end: '' });
      return;
    }

    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (range) {
      case 'today':
        start = now;
        break;
      case 'last7Days':
        start = subDays(now, 7);
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        break;
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      default:
        start = startOfMonth(now);
    }

    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  const userStats = useMemo(() => {
    return users.map(user => {
      const userTasks = tasks.filter(t => t.assignedUserIds.includes(user.id));
      const totalHours = userTasks.reduce((acc, t) => acc + (t.hours || 0), 0);
      
      return {
        ...user,
        totalHours,
        pendingTasks: userTasks.filter(t => t.status === 'pending').length,
        completedTasks: userTasks.filter(t => t.status === 'completed').length,
        tasks: userTasks
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [users, tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => task.status === filter)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [tasks, filter]);

  const analytics = useMemo(() => {
    const dates = tasks.map(t => parseArgentinaDate(t.date).getTime()).filter(t => !isNaN(t));
    const minTaskDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    const maxTaskDate = dates.length > 0 ? new Date(Math.max(...dates, new Date().getTime())) : new Date();

    const start = dateRange.start ? parseArgentinaDate(dateRange.start) : minTaskDate;
    const end = dateRange.end ? parseArgentinaDate(dateRange.end) : maxTaskDate;
    
    const safeStart = start > end ? end : start;
    const safeEnd = end < start ? start : end;

    const days = eachDayOfInterval({ start: safeStart, end: safeEnd });

    // Filter tasks by date range and user
    const rangeTasks = tasks.filter(t => {
      const tDate = parseArgentinaDate(t.date);
      const inDateRange = tDate >= safeStart && tDate <= safeEnd;
      const matchesUser = userFilter === 'all' || t.assignedUserIds.includes(userFilter);
      return inDateRange && matchesUser;
    });

    // Hours per day
    const dailyData = days.map(day => {
      const dayTasks = rangeTasks.filter(t => isSameDay(parseArgentinaDate(t.date), day));
      const hours = dayTasks.reduce((acc, t) => acc + (t.hours || 0), 0);
      return {
        date: format(day, 'dd/MM'),
        fullDate: format(day, 'yyyy-MM-dd'),
        hours: parseFloat(hours.toFixed(1))
      };
    });

    // Hours per account
    const accountMap = new Map<string, number>();
    rangeTasks.forEach(t => {
      const acc = t.account || 'Sin cuenta';
      accountMap.set(acc, (accountMap.get(acc) || 0) + (t.hours || 0));
    });
    const accountData = Array.from(accountMap.entries()).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(1))
    })).sort((a, b) => b.value - a.value);

    // Hours per member
    const memberMap = new Map<string, number>();
    rangeTasks.forEach(t => {
      t.assignedUserIds.forEach(uid => {
        const user = users.find(u => u.id === uid);
        if (user) {
          memberMap.set(user.name, (memberMap.get(user.name) || 0) + (t.hours || 0));
        }
      });
    });
    const memberData = Array.from(memberMap.entries()).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(1))
    })).sort((a, b) => b.value - a.value);

    const completedTasks = rangeTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = rangeTasks.filter(t => t.status === 'pending').length;

    return { 
      dailyData, 
      accountData, 
      memberData, 
      totalHours: rangeTasks.reduce((acc, t) => acc + (t.hours || 0), 0),
      completedTasks,
      pendingTasks
    };
  }, [tasks, dateRange, users, userFilter]);

  const COLORS = ['#00FF9D', '#00D1FF', '#FF00FF', '#FFD700', '#FF4500', '#8A2BE2'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!title || assignedUserIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const taskData = {
        title,
        description,
        assignedUserIds,
        status: editingTask ? editingTask.status : 'pending',
        createdBy: editingTask ? editingTask.createdBy : 'admin',
        createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
        date,
        account,
        hours: hours + (minutes / 60)
      };

      if (editingTask) {
        await onUpdateTask({ ...editingTask, ...taskData } as Task);
      } else {
        await onAddTask(taskData as Task);
      }

      setTitle('');
      setDescription('');
      setAssignedUserIds([]);
      setDate(new Date().toISOString().split('T')[0]);
      setAccount('');
      setHours(0);
      setMinutes(0);
      setIsCreating(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Error al guardar la tarea.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setAssignedUserIds(task.assignedUserIds);
    setDate(task.date);
    setAccount(task.account || '');
    setHours(Math.floor(task.hours || 0));
    setMinutes(Math.round(((task.hours || 0) % 1) * 60));
    setIsCreating(true);
    setSelectedUserId(null); // Close user details modal
  };

  const toggleUserSelection = (userId: string) => {
    setAssignedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const getTaskTime = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const totalHours = task?.hours || 0;
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return { h, m };
  };

  return (
    <div className="pt-4 md:pt-8">
      <div className="pt-14 md:pt-18 space-y-8">
      {/* Control Center Header */}
      <div className="flex flex-col gap-6 bg-white/[0.02] border border-white/5 p-8 rounded-[40px]">
        {/* Top Row: Title, Tabs and Primary Action */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-neon rounded-full" />
              <h2 className="text-4xl font-oswald font-black italic uppercase text-white tracking-tighter">Centro de Control</h2>
            </div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] pl-5">Productividad del equipo y auditoría de tiempos</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Tabs */}
            <div className="bg-black/40 p-1 rounded-xl flex gap-1 border border-white/5">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase italic flex items-center gap-2 transition-all ${activeTab === 'overview' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <BarChart3 size={14} /> ANALÍTICA
              </button>
              <button 
                onClick={() => setActiveTab('management')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase italic flex items-center gap-2 transition-all ${activeTab === 'management' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <Users size={14} /> GESTIÓN
              </button>
            </div>

            <button 
              onClick={() => { setIsCreating(true); setEditingTask(null); }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-neon text-black text-[10px] font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition shadow-[0_0_20px_rgba(0,255,157,0.3)]"
            >
              <Plus size={16} /> NUEVA TAREA
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="w-full h-px bg-white/5" />

            {/* Bottom Row: Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <Calendar size={14} className="absolute left-3 text-gray-500 pointer-events-none" />
                    <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="bg-black/40 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-[10px] font-black text-white uppercase outline-none cursor-pointer w-[130px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer hover:border-white/20 transition-colors"
                    />
                  </div>
                  <span className="text-gray-600 text-[10px] font-black">-</span>
                  <div className="relative flex items-center">
                    <Calendar size={14} className="absolute left-3 text-gray-500 pointer-events-none" />
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="bg-black/40 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-[10px] font-black text-white uppercase outline-none cursor-pointer w-[130px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer hover:border-white/20 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setQuickRange('all')} className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors ${!dateRange.start && !dateRange.end ? 'bg-neon/20 text-neon' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'}`}>Todos</button>
                  <button onClick={() => setQuickRange('today')} className="px-2 py-1 rounded-md text-[9px] font-black bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white uppercase tracking-widest transition-colors">Hoy</button>
                  <button onClick={() => setQuickRange('last7Days')} className="px-2 py-1 rounded-md text-[9px] font-black bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white uppercase tracking-widest transition-colors">7 Días</button>
                  <button onClick={() => setQuickRange('thisMonth')} className="px-2 py-1 rounded-md text-[9px] font-black bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white uppercase tracking-widest transition-colors">Este Mes</button>
                  <button onClick={() => setQuickRange('lastMonth')} className="px-2 py-1 rounded-md text-[9px] font-black bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white uppercase tracking-widest transition-colors">Mes Pasado</button>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/40 p-3 rounded-2xl border border-white/5">
                <Users size={14} className="text-gray-500 ml-2" />
                <select 
                  value={userFilter}
                  onChange={e => setUserFilter(e.target.value)}
                  className="bg-transparent text-[10px] font-black text-white uppercase outline-none cursor-pointer pr-4"
                >
                  <option value="all" className="bg-[#0D0D0D]">Todos los usuarios</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id} className="bg-[#0D0D0D]">{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Top 3 Ranking Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userStats.slice(0, 3).map((user, index) => (
              <div 
                key={user.id} 
                className={`relative p-4 rounded-3xl border overflow-hidden group transition-all hover:scale-[1.02] cursor-pointer ${
                  index === 0 ? 'bg-neon/10 border-neon/30' : 'bg-white/[0.02] border-white/5'
                }`}
                onClick={() => setSelectedUserId(user.id)}
              >
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  {index === 0 ? <TrendingUp size={40} className="text-neon" /> : <Activity size={40} className="text-white" />}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D0D0D&color=fff`} 
                      className={`w-10 h-10 rounded-xl object-cover border ${index === 0 ? 'border-neon' : 'border-white/10'}`} 
                    />
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      index === 0 ? 'bg-neon text-black' : 'bg-white/10 text-white'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-oswald font-black italic uppercase text-white leading-none mb-1">{user.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-neon uppercase">{user.totalHours.toFixed(1)}h</span>
                      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{user.completedTasks} tareas</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Global Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Clock size={48} className="text-neon" />
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Horas en el periodo</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-oswald font-black italic text-white">{analytics.totalHours.toFixed(1)}</span>
                <span className="text-xs font-bold text-neon uppercase">hrs</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <TrendingUp size={48} className="text-neon" />
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Promedio Diario</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-oswald font-black italic text-white">
                  {(analytics.totalHours / Math.max(1, analytics.dailyData.length)).toFixed(1)}
                </span>
                <span className="text-xs font-bold text-gray-600 uppercase">hrs/día</span>
              </div>
              <p className="text-[9px] font-bold text-gray-600 uppercase mt-2">
                {dateRange.start ? `Desde ${format(parseArgentinaDate(dateRange.start), 'dd/MM/yyyy')}` : 'Histórico'}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Clock size={48} className="text-neon" />
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Tareas Pendientes</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-oswald font-black italic text-white">{analytics.pendingTasks}</span>
                <span className="text-xs font-bold text-gray-600 uppercase">en curso</span>
              </div>
            </div>

            <div 
              onClick={() => setShowCompletedTasksModal(true)}
              className="bg-white/5 border border-white/10 p-6 rounded-[32px] relative overflow-hidden group cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <CheckSquare size={48} className="text-neon" />
              </div>
              <p className="text-[10px] font-black text-neon uppercase tracking-widest mb-4">Tareas Completadas</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-oswald font-black italic text-neon">
                  {analytics.completedTasks}
                </span>
                <span className="text-xs font-bold text-neon/70 uppercase">finalizadas</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white/5 border border-white/10 p-8 rounded-[40px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-white font-oswald font-black italic uppercase text-lg flex items-center gap-3">
                  <TrendingUp size={20} className="text-neon" /> Evolución de Carga de Trabajo
                </h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailyData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF9D" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00FF9D" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#4B5563" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#4B5563" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}h`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#00FF9D', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="hours" stroke="#00FF9D" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/5 border border-white/10 p-8 rounded-[40px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-white font-oswald font-black italic uppercase text-lg flex items-center gap-3">
                  <PieChartIcon size={20} className="text-neon" /> Distribución por Cuenta
                </h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.accountData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.accountData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      formatter={(value) => <span className="text-[10px] font-black uppercase text-gray-500">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Ranking & Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
              <h3 className="text-white font-oswald font-black italic uppercase text-lg mb-6 flex items-center gap-3">
                <Users size={20} className="text-neon" /> Ranking de Productividad
              </h3>
              <div className="space-y-4">
                {analytics.memberData.map((member, index) => (
                  <div key={member.name} className="flex items-center gap-4 group">
                    <span className="text-xs font-black text-gray-700 w-6">0{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-black text-white uppercase italic tracking-tight">{member.name}</span>
                        <span className="text-xs font-bold text-neon">{member.value}h</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(member.value / analytics.totalHours) * 100}%` }}
                          className="h-full bg-neon"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px]">
              <h3 className="text-white font-oswald font-black italic uppercase text-lg mb-6 flex items-center gap-3">
                <Timer size={20} className="text-neon" /> Horas por Día (Detalle)
              </h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#00FF9D', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="hours" fill="#00FF9D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'management' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-white font-oswald font-black italic uppercase text-sm flex items-center gap-2">
              <Users size={16} className="text-neon" /> Gestión de Equipo y Alertas
            </h3>
            <button 
              onClick={() => setIsAddingGlobalAlert(true)}
              className="bg-neon/10 text-neon text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-neon/20 hover:bg-neon hover:text-black transition-all flex items-center gap-2"
            >
              <BellRing size={14} /> ALERTA GLOBAL
            </button>
          </div>

          <AnimatePresence>
            {isAddingGlobalAlert && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-black/40 p-4 rounded-2xl border border-neon/30 relative">
                  <div className="absolute top-0 right-0 p-3">
                    <button onClick={() => setIsAddingGlobalAlert(false)} className="text-gray-500 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <h4 className="text-white font-oswald font-black italic uppercase text-xs mb-3 flex items-center gap-2">
                    <BellRing size={14} className="text-neon" /> Enviar Alerta a Usuarios
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-4">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest pl-1 mb-1.5 block">Seleccionar Destinatarios</label>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                        <button
                          onClick={() => setGlobalAlertUserIds(globalAlertUserIds.length === users.length ? [] : users.map(u => u.id))}
                          className={`flex items-center justify-center gap-2 p-1.5 rounded-lg border transition-all ${globalAlertUserIds.length === users.length ? 'bg-neon/10 border-neon text-neon' : 'bg-black border-white/5 text-gray-600 hover:border-white/20'}`}
                        >
                          <span className="text-[9px] font-black uppercase">Todos</span>
                        </button>
                        {users.map(user => (
                          <button
                            key={user.id}
                            onClick={() => setGlobalAlertUserIds(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                            className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${globalAlertUserIds.includes(user.id) ? 'bg-neon/10 border-neon text-neon' : 'bg-black border-white/5 text-gray-600 hover:border-white/20'}`}
                          >
                            <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D0D0D&color=fff`} className="w-4 h-4 rounded-md object-cover" />
                            <span className="text-[8px] font-black uppercase truncate">{user.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-8 flex flex-col gap-3">
                      <textarea 
                        value={globalAlertMessage}
                        onChange={(e) => setGlobalAlertMessage(e.target.value)}
                        placeholder="Escribe un mensaje importante..."
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-neon placeholder:text-gray-700 resize-none flex-1"
                        rows={2}
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={async () => {
                            if (!globalAlertMessage.trim() || globalAlertUserIds.length === 0 || isSubmitting) return;
                            setIsSubmitting(true);
                            try {
                              const newAlert = {
                                id: Math.random().toString(36).substr(2, 9),
                                message: globalAlertMessage,
                                seen: false,
                                createdAt: new Date().toISOString()
                              };
                              
                              const updatePromises = users
                                .filter(user => globalAlertUserIds.includes(user.id))
                                .map(user => {
                                  const currentMessages = user.alertMessages || [];
                                  return onUpdateUser({ 
                                    ...user, 
                                    alertMessages: [newAlert, ...currentMessages] 
                                  });
                                });
                              
                              await Promise.all(updatePromises);
                              
                              setGlobalAlertMessage('');
                              setIsAddingGlobalAlert(false);
                              setGlobalAlertUserIds([]);
                            } catch (error) {
                              console.error("Error sending global alert:", error);
                              alert("Error al enviar la alerta.");
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          disabled={!globalAlertMessage.trim() || globalAlertUserIds.length === 0 || isSubmitting}
                          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${(!globalAlertMessage.trim() || globalAlertUserIds.length === 0 || isSubmitting) ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-neon text-black hover:scale-105 shadow-[0_0_15px_rgba(0,255,157,0.2)]'}`}
                        >
                          {isSubmitting ? (
                            <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          ) : (
                            <Save size={14} />
                          )}
                          {isSubmitting ? 'ENVIANDO...' : 'ENVIAR ALERTA'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/40">
                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Usuario</th>
                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Tareas Pendientes</th>
                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Tareas Completadas</th>
                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Horas Totales</th>
                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Alertas Activas</th>
                    <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {userStats.map(user => {
                    const activeAlerts = user.alertMessages?.filter(a => !a.seen) || [];
                    const activeAlertsCount = activeAlerts.length;
                    return (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td 
                          className="p-4 cursor-pointer" 
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setUserAlertMessage('');
                            setIsAddingAlert(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D0D0D&color=fff`} 
                              alt={user.name} 
                              className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:border-neon/30 transition-colors" 
                            />
                            <div>
                              <p className="text-sm font-oswald font-black italic uppercase tracking-tight text-white group-hover:text-neon transition-colors">{user.name}</p>
                              <p className="text-[10px] text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[11px] font-black px-3 py-1 rounded-md ${user.pendingTasks > 0 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-white/5 text-gray-500'}`}>
                            {user.pendingTasks}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-[11px] font-black px-3 py-1 rounded-md bg-neon/10 text-neon">
                            {user.completedTasks}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-[11px] font-black text-white">{user.totalHours.toFixed(1)}h</span>
                        </td>
                        <td className="p-4">
                          {activeAlertsCount > 0 ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 w-fit uppercase tracking-widest">
                                {activeAlertsCount} Activas
                              </span>
                              <span className="text-[9px] text-gray-400 truncate max-w-[150px] italic">
                                "{activeAlerts[0].message}"
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-black px-3 py-1 rounded-md bg-white/5 text-gray-500">
                              0
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignedUserIds([user.id]);
                                setIsCreating(true);
                                setEditingTask(null);
                              }}
                              className="p-2 text-gray-400 hover:text-neon hover:bg-neon/10 rounded-lg transition-all"
                              title="Asignar Tarea"
                            >
                              <Plus size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAlertUserId(user.id);
                                setUserAlertMessage('');
                              }}
                              className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all"
                              title="Gestionar Alertas"
                            >
                              <BellRing size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserId(user.id);
                                setUserAlertMessage('');
                                setIsAddingAlert(false);
                              }}
                              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                              title="Ver Ficha"
                            >
                              <LayoutDashboard size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Standalone Alert Modal */}
          <AnimatePresence>
            {selectedAlertUserId && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedAlertUserId(null)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
                >
                  {(() => {
                    const user = userStats.find(u => u.id === selectedAlertUserId);
                    if (!user) return null;
                    
                    return (
                      <>
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                          <div className="flex items-center gap-4">
                            <img 
                              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D0D0D&color=fff`} 
                              alt={user.name} 
                              className="w-12 h-12 rounded-xl object-cover border border-neon/20" 
                            />
                            <div>
                              <h3 className="text-2xl font-oswald font-black italic uppercase text-white tracking-tight leading-none">Alertas: {user.name}</h3>
                              <span className="text-[10px] font-black text-neon uppercase tracking-widest">{user.email}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedAlertUserId(null)}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="p-6 space-y-6">
                          <div className="bg-black/40 p-4 rounded-2xl border border-neon/30">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                              <BellRing size={14} className="text-neon" /> Nueva Alerta
                            </h4>
                            <textarea 
                              value={userAlertMessage}
                              onChange={(e) => setUserAlertMessage(e.target.value)}
                              placeholder="Escribe un mensaje importante..."
                              className="w-full bg-transparent border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-neon placeholder:text-gray-700 resize-none mb-3"
                              rows={3}
                            />
                            <div className="flex justify-end">
                              <button 
                                onClick={() => {
                                  if (!userAlertMessage.trim()) return;
                                  const currentMessages = user.alertMessages || [];
                                  const newAlert = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    message: userAlertMessage,
                                    seen: false,
                                    createdAt: new Date().toISOString()
                                  };
                                  onUpdateUser({ 
                                    ...user, 
                                    alertMessages: [newAlert, ...currentMessages] 
                                  });
                                  setUserAlertMessage('');
                                }}
                                className="bg-neon text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
                              >
                                <Save size={14} /> Enviar Alerta
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Historial de Alertas</h4>
                            {user.alertMessages && user.alertMessages.length > 0 ? (
                              user.alertMessages.map((alert) => (
                                <div key={alert.id} className="bg-black/40 p-4 rounded-2xl border border-white/5 group relative">
                                  <div className="flex items-start justify-between gap-4">
                                    <p className="text-sm text-gray-300 leading-relaxed italic pr-8">"{alert.message}"</p>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                      {alert.seen ? (
                                        <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[9px] font-black text-green-500 uppercase tracking-widest">
                                          Visto
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-[9px] font-black text-yellow-500 uppercase tracking-widest">
                                          Pendiente
                                        </span>
                                      )}
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm('¿Estás seguro de que quieres eliminar esta alerta?')) {
                                            const newMessages = user.alertMessages?.filter(a => a.id !== alert.id);
                                            onUpdateUser({ ...user, alertMessages: newMessages });
                                          }
                                        }}
                                        className="text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 mt-3">
                                    <p className="text-[9px] text-gray-600 uppercase font-bold">
                                      Enviado: {formatArgentinaTimestamp(alert.createdAt, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {alert.seenAt && (
                                      <p className="text-[9px] text-gray-600 uppercase font-bold">
                                        Visto: {formatArgentinaTimestamp(alert.seenAt, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="h-24 flex items-center justify-center border border-dashed border-white/5 rounded-2xl bg-black/20">
                                <p className="text-[9px] text-gray-700 uppercase font-black tracking-widest">Sin alertas en el historial</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* User Details Modal */}
          <AnimatePresence>
            {selectedUserId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedUserId(null)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-6xl max-h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
                >
                  {(() => {
                    const user = userStats.find(u => u.id === selectedUserId);
                    if (!user) return null;
                    
                    const recentActivity = tasks
                      .filter(t => t.assignedUserIds.includes(user.id) && t.status === 'completed')
                      .sort((a, b) => parseArgentinaDate(b.date).getTime() - parseArgentinaDate(a.date).getTime())
                      .slice(0, 5);

                    return (
                      <>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                          <div className="flex items-center gap-4">
                            <img 
                              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D0D0D&color=fff`} 
                              alt={user.name} 
                              className="w-12 h-12 rounded-xl object-cover border border-neon/20" 
                            />
                            <div>
                              <h3 className="text-2xl font-oswald font-black italic uppercase text-white tracking-tight leading-none">{user.name}</h3>
                              <span className="text-[10px] font-black text-neon uppercase tracking-widest">{user.email}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedUserId(null)}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                          {/* Stats Row */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 text-center flex flex-col justify-center min-h-[120px]">
                              <p className="text-4xl font-oswald font-black italic text-white mb-2">{user.totalHours.toFixed(1)}</p>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Horas Totales</p>
                            </div>
                            <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 text-center flex flex-col justify-center min-h-[120px]">
                              <p className="text-4xl font-oswald font-black italic text-neon mb-2">{user.completedTasks}</p>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tareas Listas</p>
                            </div>
                            <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 text-center flex flex-col justify-center min-h-[120px]">
                              <p className="text-4xl font-oswald font-black italic text-yellow-500 mb-2">{user.pendingTasks}</p>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pendientes</p>
                            </div>
                            <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 text-center flex flex-col justify-center min-h-[120px] cursor-pointer hover:border-red-500/30 transition-colors" onClick={() => setSelectedAlertUserId(user.id)}>
                              <p className="text-4xl font-oswald font-black italic text-red-500 mb-2">{user.alertMessages?.filter(a => !a.seen).length || 0}</p>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Alertas Activas</p>
                            </div>
                          </div>

                          {/* Tasks Table (Full Width) */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                              <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <List size={16} className="text-neon" /> Tareas Asignadas
                              </h4>
                              <div className="flex items-center gap-4">
                                <select
                                  value={modalTaskFilter}
                                  onChange={(e) => setModalTaskFilter(e.target.value as any)}
                                  className="bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-neon cursor-pointer"
                                >
                                  <option value="all">Todas</option>
                                  <option value="pending">Pendientes</option>
                                  <option value="completed">Completadas</option>
                                </select>
                                <select
                                  value={modalTaskSort}
                                  onChange={(e) => setModalTaskSort(e.target.value as any)}
                                  className="bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-neon cursor-pointer"
                                >
                                  <option value="date-desc">Más recientes</option>
                                  <option value="date-asc">Más antiguas</option>
                                  <option value="time-desc">Mayor tiempo</option>
                                  <option value="time-asc">Menor tiempo</option>
                                </select>
                                <button 
                                  onClick={() => {
                                    setAssignedUserIds([user.id]);
                                    setIsCreating(true);
                                    setEditingTask(null);
                                    setSelectedUserId(null); // Close modal to show creation form
                                  }}
                                  className="bg-neon/10 text-neon text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-neon/20 hover:bg-neon hover:text-black transition-all"
                                >
                                  + Asignar Tarea
                                </button>
                              </div>
                            </div>
                            
                            <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-white/5 bg-black/40">
                                      <th className="p-4 text-[9px] font-black text-gray-500 uppercase tracking-widest w-24">Fecha</th>
                                      <th className="p-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Tarea</th>
                                      <th className="p-4 text-[9px] font-black text-gray-500 uppercase tracking-widest w-24">Tiempo</th>
                                      <th className="p-4 text-[9px] font-black text-gray-500 uppercase tracking-widest w-24">Estado</th>
                                      <th className="p-4 text-[9px] font-black text-gray-500 uppercase tracking-widest text-right w-24">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {(() => {
                                      let filteredTasks = user.tasks;
                                      if (modalTaskFilter !== 'all') {
                                        filteredTasks = filteredTasks.filter(t => t.status === modalTaskFilter);
                                      }
                                      
                                      filteredTasks.sort((a, b) => {
                                        if (modalTaskSort === 'date-desc') return parseArgentinaDate(b.date).getTime() - parseArgentinaDate(a.date).getTime();
                                        if (modalTaskSort === 'date-asc') return parseArgentinaDate(a.date).getTime() - parseArgentinaDate(b.date).getTime();
                                        if (modalTaskSort === 'time-desc') return b.hours - a.hours;
                                        if (modalTaskSort === 'time-asc') return a.hours - b.hours;
                                        return 0;
                                      });

                                      if (filteredTasks.length === 0) {
                                        return (
                                          <tr>
                                            <td colSpan={5} className="p-8 text-center">
                                              <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Sin tareas asignadas</p>
                                            </td>
                                          </tr>
                                        );
                                      }

                                      return filteredTasks.map(task => {
                                        const taskTime = getTaskTime(task.id);
                                        return (
                                          <tr 
                                            key={task.id} 
                                            onClick={() => handleEditTask(task)}
                                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                          >
                                            <td className="p-4">
                                              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{formatArgentinaDate(task.date)}</p>
                                            </td>
                                            <td className="p-4">
                                              <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${task.status === 'completed' ? 'bg-neon/10 text-neon' : 'bg-white/5 text-gray-700'}`}>
                                                  {task.status === 'completed' ? <CheckSquare size={12} /> : <Square size={12} />}
                                                </div>
                                                <div className="flex flex-col">
                                                  <p className={`text-sm font-oswald font-black italic uppercase tracking-tight ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                                    {task.title}
                                                  </p>
                                                  {task.description && (
                                                    <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{task.description}</p>
                                                  )}
                                                  <p className="text-[8px] text-gray-600 uppercase font-black tracking-widest mt-1">
                                                    Creado por: {task.createdBy || 'Admin'}
                                                  </p>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="p-4">
                                              <p className="text-[10px] text-neon uppercase font-black tracking-widest flex items-center gap-1">
                                                <Timer size={12} /> {taskTime.h}h {taskTime.m}m
                                              </p>
                                            </td>
                                            <td className="p-4">
                                              <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${task.status === 'completed' ? 'bg-neon/5 border-neon/20 text-neon' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                                {task.status === 'completed' ? 'Completado' : 'Pendiente'}
                                              </span>
                                            </td>
                                            <td className="p-4 text-right">
                                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditTask(task);
                                                  }}
                                                  className="p-2 text-gray-400 hover:text-neon hover:bg-neon/10 rounded-lg transition-all"
                                                  title="Editar Tarea"
                                                >
                                                  <Edit2 size={14} />
                                                </button>
                                                <button 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                                                      onDeleteTask(task.id);
                                                    }
                                                  }}
                                                  className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                  title="Eliminar Tarea"
                                                >
                                                  <Trash2 size={14} />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      });
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0D0D0D] p-8 rounded-3xl border border-neon/30 shadow-2xl shadow-neon/10 relative overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-neon/20" />
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-oswald font-black italic uppercase text-neon flex items-center gap-3">
                  {editingTask ? <Edit2 size={20} /> : <Plus size={20} />} 
                  {editingTask ? 'Editar Tarea' : 'Nueva Asignación de Tarea'}
                </h3>
                <button onClick={() => { setIsCreating(false); setEditingTask(null); }} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Fecha</label>
                      <div className="relative w-full bg-black border border-white/10 rounded-xl focus-within:border-neon transition-colors">
                        <input 
                          id="task-date"
                          type="date" 
                          value={date} 
                          onChange={e => setDate(e.target.value)}
                          className="w-full bg-transparent p-3 text-white text-sm font-black outline-none cursor-pointer relative z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 z-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Cuenta / Proyecto</label>
                      <select 
                        value={account} 
                        onChange={e => setAccount(e.target.value)}
                        required
                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm font-black uppercase italic focus:border-neon outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Seleccionar Cuenta...</option>
                        {socialAccounts.map(acc => (
                          <option key={acc.id} value={acc.name}>{acc.name}</option>
                        ))}
                        <option value="General">General / Otros</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Título de la Tarea</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value || '')}
                      placeholder="Ej: Cobertura entrenamiento Unión"
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-black uppercase italic text-base focus:border-neon outline-none placeholder:text-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Descripción / Instrucciones</label>
                    <textarea 
                      rows={3}
                      value={description} 
                      onChange={e => setDescription(e.target.value || '')}
                      placeholder="Detalla lo que hay que hacer..."
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-gray-300 text-xs focus:border-neon outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Tiempo Estimado (Opcional)</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input 
                          type="number" 
                          min="0"
                          placeholder="Hs"
                          value={hours} 
                          onChange={e => setHours(parseInt(e.target.value) || 0)}
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-neon outline-none pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-600">Hs</span>
                      </div>
                      <div className="flex-1">
                        <select 
                          value={minutes} 
                          onChange={e => setMinutes(parseInt(e.target.value))}
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-neon outline-none appearance-none cursor-pointer"
                        >
                          <option value={0}>0m</option>
                          <option value={15}>15m</option>
                          <option value={30}>30m</option>
                          <option value={45}>45m</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Asignar a Usuarios</label>
                    <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                      {users.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleUserSelection(user.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${assignedUserIds.includes(user.id) ? 'bg-neon/10 border-neon text-neon' : 'bg-black border-white/5 text-gray-600 hover:border-white/20'}`}
                        >
                          <img 
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D0D0D&color=fff`} 
                            alt={user.name} 
                            className={`w-6 h-6 rounded-lg object-cover border ${assignedUserIds.includes(user.id) ? 'border-neon' : 'border-white/10'}`} 
                          />
                          <span className="text-[8px] font-black uppercase truncate tracking-tighter">{user.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full py-4 bg-neon text-black font-black uppercase italic text-xs tracking-widest rounded-xl transition shadow-lg shadow-neon/20 flex items-center justify-center gap-2 mt-4 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {isSubmitting ? 'GUARDANDO...' : (editingTask ? 'GUARDAR CAMBIOS' : 'CREAR Y ASIGNAR')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompletedTasksModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0D0D0D] p-8 rounded-3xl border border-neon/30 shadow-2xl shadow-neon/10 relative overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-neon" />
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h3 className="text-xl font-oswald font-black italic uppercase text-neon flex items-center gap-3">
                  <CheckSquare size={20} /> 
                  Tareas Completadas
                </h3>
                <button onClick={() => setShowCompletedTasksModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                <div className="space-y-4">
                  {tasks.filter(t => t.status === 'completed').length === 0 ? (
                    <div className="text-center py-12 text-gray-500 font-oswald italic uppercase tracking-widest">
                      No hay tareas completadas
                    </div>
                  ) : (
                    tasks.filter(t => t.status === 'completed')
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(task => (
                        <div key={task.id} className="bg-white/5 border border-neon/20 p-4 rounded-2xl flex items-start justify-between gap-4 group hover:bg-white/10 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-1 bg-neon/10 text-neon text-[9px] font-black uppercase tracking-widest rounded-md border border-neon/20">
                                {task.account || 'General'}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                <Calendar size={10} /> {format(parseArgentinaDate(task.date), 'dd/MM/yyyy')}
                              </span>
                            </div>
                            <h4 className="text-white font-black uppercase italic text-sm mb-1">{task.title}</h4>
                            <p className="text-gray-400 text-xs line-clamp-2">{task.description}</p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <div className="flex -space-x-2">
                              {task.assignedUserIds.map(uid => {
                                const user = users.find(u => u.id === uid);
                                return user ? (
                                  <img 
                                    key={uid}
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D0D0D&color=fff`}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full border-2 border-[#0D0D0D] object-cover"
                                    title={user.name}
                                  />
                                ) : null;
                              })}
                            </div>
                            {task.hours && (
                              <div className="flex items-center gap-1 text-neon text-[10px] font-black">
                                <Clock size={12} />
                                {task.hours} HRS
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
