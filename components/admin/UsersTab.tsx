import React, { useState } from 'react';
import { User, Role } from '../../types';
import { Plus, Edit3, Trash2, Users, Shield } from 'lucide-react';
import { PermissionsTab } from './PermissionsTab';

interface UsersTabProps {
  users: User[];
  currentUser: User;
  roles: Role[];
  rolesMap: Map<string, Role>;
  onOpenEditor: (user?: User) => void;
  onDeleteUser: (id: string) => void;
  onAddRole: (role: Omit<Role, 'id'>) => void;
  onUpdateRole: (role: Role) => void;
  onDeleteRole: (id: string) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, currentUser, roles, rolesMap, onOpenEditor, onDeleteUser, onAddRole, onUpdateRole, onDeleteRole }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');

  return (
    <div className="pb-24 px-4 md:px-0">
      <div className="sticky top-16 lg:top-20 z-40 bg-black/95 backdrop-blur-md pt-1 md:pt-4 pb-2 md:pb-6 mb-4 md:mb-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div>
          <h2 className="text-xl md:text-4xl font-oswald font-black italic uppercase text-white tracking-tighter flex items-center gap-2 md:gap-3">
            <Users className="text-neon w-5 h-5 md:w-8 md:h-8" /> USUARIOS
          </h2>
          <p className="hidden md:block text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Gestión de accesos y permisos del equipo</p>
        </div>

        <div className="flex bg-black/40 p-0.5 md:p-1 rounded-lg md:rounded-2xl border border-white/5 self-stretch md:self-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('users')} 
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-1.5 md:py-2.5 rounded-md md:rounded-xl text-[8px] md:text-[10px] font-black uppercase italic tracking-widest transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
          >
            <Users size={12} className="md:w-[14px] md:h-[14px]" /> EQUIPO
          </button>
          <button 
            onClick={() => setActiveTab('permissions')} 
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-1.5 md:py-2.5 rounded-md md:rounded-xl text-[8px] md:text-[10px] font-black uppercase italic tracking-widest transition-all whitespace-nowrap ${activeTab === 'permissions' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
          >
            <Shield size={12} className="md:w-[14px] md:h-[14px]" /> PERMISOS
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'users' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-2xl font-oswald font-black italic uppercase text-white">LISTADO DE EQUIPO</h2>
              <button onClick={() => onOpenEditor()} className="flex items-center gap-2 px-4 py-2 bg-neon text-black text-[10px] font-black uppercase italic tracking-widest rounded-lg hover:scale-105 transition shadow-lg">
                <Plus size={14} /> NUEVO USUARIO
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(user => (
              <div key={user.id} className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-transparent hover:border-neon/50 transition-colors">
                <div className="flex items-center gap-4">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 object-cover rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neon/20 border border-neon/30 flex items-center justify-center text-xs font-black text-neon">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold">{user.name}</h3>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-white/10 text-gray-300">{rolesMap.get(user.roleId)?.name || user.roleId}</span>
                  <button onClick={() => onOpenEditor(user)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"><Edit3 size={14} /></button>
                  {user.id !== currentUser.id && user.email !== 'nicobarrilis@gmail.com' && (
                    <button onClick={() => onDeleteUser(user.id)} className="w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <PermissionsTab roles={roles} onAddRole={onAddRole} onUpdateRole={onUpdateRole} onDeleteRole={onDeleteRole} />
      )}
      </div>
    </div>
  );
};
