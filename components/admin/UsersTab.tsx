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
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2 rounded-sm font-black uppercase italic tracking-widest text-xs transition ${activeTab === 'users' ? 'bg-neon text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}>
          <Users size={16} /> Usuarios
        </button>
        <button onClick={() => setActiveTab('permissions')} className={`flex items-center gap-2 px-4 py-2 rounded-sm font-black uppercase italic tracking-widest text-xs transition ${activeTab === 'permissions' ? 'bg-neon text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}>
          <Shield size={16} /> Permisos
        </button>
      </div>

      {activeTab === 'users' ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-oswald font-black italic uppercase text-white">Gestión de Usuarios</h2>
            <button onClick={() => onOpenEditor()} className="flex items-center gap-2 px-4 py-2 bg-neon text-black text-xs font-black uppercase italic tracking-widest rounded-sm hover:scale-105 transition">
              <Plus size={16} /> Nuevo Usuario
            </button>
          </div>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-transparent hover:border-neon/50 transition-colors">
                <div className="flex items-center gap-4">
                  {user.avatar && (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 object-cover rounded-full" />
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
  );
};