import React, { useState } from 'react';
import { Role } from '../../types';
import { Plus, Trash2, Lock, Save, Edit, X, Check } from 'lucide-react';
import { PERMISSION_DEFINITIONS } from '../../constants';

interface PermissionsTabProps {
  roles: Role[];
  onAddRole: (role: Omit<Role, 'id'>) => void;
  onUpdateRole: (role: Role) => void;
  onDeleteRole: (id: string) => void;
}

export const PermissionsTab: React.FC<PermissionsTabProps> = ({ roles, onAddRole, onUpdateRole, onDeleteRole }) => {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');

  const handleStartEdit = (role: Role) => {
    setEditingRole({ ...role });
  };

  const handlePermissionToggle = (permissionId: string) => {
    if (!editingRole) return;
    const currentPermissions = editingRole.permissions || [];
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter(p => p !== permissionId)
      : [...currentPermissions, permissionId];
    setEditingRole({ ...editingRole, permissions: newPermissions });
  };

  const handleSaveRole = async () => {
    if (editingRole) {
      await onUpdateRole(editingRole);
      setEditingRole(null);
    }
  };
  
  const handleAddRole = () => {
    if(newRoleName.trim()) {
        onAddRole({ name: newRoleName, permissions: [] });
        setNewRoleName('');
    }
  };

  return (
    <div className="pt-4 md:pt-8">
      <h2 className="text-3xl font-oswald font-black italic uppercase text-white mb-6">Gestión de Permisos y Roles</h2>
      <div className="pt-14 md:pt-18">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <h3 className="text-xl font-oswald font-black italic uppercase text-neon mb-4">Roles de Usuario</h3>
            <div className="space-y-3">
                {roles.map(role => (
                    <div key={role.id} className={`p-3 rounded-lg flex items-center justify-between transition-colors ${editingRole?.id === role.id ? 'bg-neon/10 border-l-4 border-neon' : 'bg-white/5'}`}>
                        <div className="flex items-center gap-3">
                            {/* FIX: The 'title' prop is not valid on Lucide icons. Wrapped with a span to provide a tooltip. */}
                            {role.isSystemRole && <span title="Rol de sistema"><Lock size={14} className="text-gray-500"/></span>}
                            <span className="text-white font-bold">{role.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {editingRole?.id === role.id ? (
                                <>
                                    <button onClick={handleSaveRole} className="w-7 h-7 flex items-center justify-center bg-green-500/10 hover:bg-green-500/20 rounded text-green-400"><Save size={12} /></button>
                                    <button onClick={() => setEditingRole(null)} className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded text-gray-300"><X size={12} /></button>
                                </>
                            ) : (
                                <button onClick={() => handleStartEdit(role)} className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded text-gray-300"><Edit size={12} /></button>
                            )}
                            {!role.isSystemRole && (
                                <button onClick={() => onDeleteRole(role.id)} className="w-7 h-7 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 rounded text-red-400"><Trash2 size={12} /></button>
                            )}
                        </div>
                    </div>
                ))}
                <div className="p-3 bg-black/50 border border-dashed border-white/10 rounded-lg flex items-center gap-3">
                    <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Nombre del nuevo rol" className="flex-1 bg-transparent text-white text-sm focus:outline-none" />
                    <button onClick={handleAddRole} className="px-3 py-1 bg-neon text-black text-xs font-black uppercase rounded-sm flex items-center gap-2"><Plus size={14}/> Añadir Rol</button>
                </div>
            </div>
        </div>
        <div>
            <h3 className="text-xl font-oswald font-black italic uppercase text-neon mb-4">Permisos del Rol: <span className="text-white">{editingRole?.name || 'Ninguno seleccionado'}</span></h3>
            {editingRole ? (
                <div className="space-y-3 bg-white/5 p-4 rounded-lg">
                    {PERMISSION_DEFINITIONS.map(permission => (
                        <label key={permission.id} className="flex items-center justify-between p-3 bg-black/50 rounded-lg cursor-pointer hover:bg-black/80 transition-colors">
                            <span className="text-sm font-bold text-white">{permission.label}</span>
                            <div className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${(editingRole.permissions || []).includes(permission.id) ? 'bg-neon justify-end' : 'bg-gray-600 justify-start'}`}>
                                <div className="w-4 h-4 rounded-full bg-white transition-transform"></div>
                            </div>
                            <input type="checkbox" checked={(editingRole.permissions || []).includes(permission.id)} onChange={() => handlePermissionToggle(permission.id)} className="hidden" />
                        </label>
                    ))}
                </div>
            ) : (
                <div className="p-8 bg-white/5 rounded-lg text-center text-gray-500 text-sm font-bold">Selecciona un rol para editar sus permisos.</div>
            )}
        </div>
        </div>
      </div>
    </div>
  );
};