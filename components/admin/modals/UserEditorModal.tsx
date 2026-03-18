import React, { useState, useEffect } from 'react';
import { User, Role, SocialAccount } from '../../../types';

interface UserEditorModalProps {
  user: User | null;
  roles: Role[];
  socialAccounts: SocialAccount[];
  onClose: () => void;
  onSave: (data: User | Omit<User, 'id'>) => void;
}

export const UserEditorModal: React.FC<UserEditorModalProps> = ({ user, roles, socialAccounts, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<User>>({ name: '', email: '', roleId: 'user', avatar: '', password: '', managedSocialAccountIds: [] });

  useEffect(() => {
    if (user) {
      setFormData({ ...user, managedSocialAccountIds: user.managedSocialAccountIds || [] });
    } else {
      setFormData({ name: '', email: '', roleId: 'user', avatar: '', password: '', managedSocialAccountIds: [] });
    }
  }, [user]);
  
  const handleSocialAccountToggle = (accountId: string) => {
    setFormData(prev => {
        const currentManaged = prev.managedSocialAccountIds || [];
        const newManaged = currentManaged.includes(accountId)
            ? currentManaged.filter(id => id !== accountId)
            : [...currentManaged, accountId];
        return { ...prev, managedSocialAccountIds: newManaged };
    });
  }

  const handleSave = () => {
    if (user?.id) {
      onSave({ ...formData, id: user.id } as User);
    } else {
      onSave(formData as Omit<User, 'id'>);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-lg w-full">
        <h3 className="text-lg font-oswald font-black italic text-neon mb-4">{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <input type="text" placeholder="Nombre" value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon outline-none" />
          <input type="email" placeholder="Email" value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon outline-none" />
          <input type="password" placeholder="Contraseña (dejar en blanco para no cambiar)" value={formData.password || ''} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon outline-none" />
          <input type="text" placeholder="URL del Avatar" value={formData.avatar || ''} onChange={e => setFormData(p => ({ ...p, avatar: e.target.value }))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon outline-none" />
          <select value={formData.roleId || 'user'} onChange={e => setFormData(p => ({ ...p, roleId: e.target.value }))} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon outline-none">
            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-widest">Cuentas Sociales Gestionadas</label>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-black/50 rounded-lg">
                {socialAccounts.map(account => (
                    <label key={account.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-white/10 cursor-pointer">
                        <input 
                            type="checkbox"
                            className="w-4 h-4 accent-neon"
                            checked={formData.managedSocialAccountIds?.includes(account.id) || false}
                            onChange={() => handleSocialAccountToggle(account.id)}
                        />
                         {account.profileImageUrl && <img src={account.profileImageUrl} alt={account.name} className="w-6 h-6 rounded-full" />}
                        <span className="text-sm text-white font-medium">{account.name} <span className="text-gray-500">({account.handle})</span></span>
                    </label>
                ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-sm">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-neon text-black text-xs font-bold rounded-sm">Guardar</button>
        </div>
      </div>
    </div>
  );
};