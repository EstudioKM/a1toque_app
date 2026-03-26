import React, { useState, useEffect } from 'react';
import { User, Role, SocialAccount } from '../../../types';
import { X, User as UserIcon, Save } from 'lucide-react';

interface UserEditorModalProps {
  user: User | null;
  roles: Role[];
  socialAccounts: SocialAccount[];
  onClose: () => void;
  onSave: (data: User | Omit<User, 'id'>) => void;
}

export const UserEditorModal: React.FC<UserEditorModalProps> = ({ user, roles, socialAccounts, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<User>>({ name: '', email: '', roleId: 'user', avatar: '', password: '', managedSocialAccountIds: [] });
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    
    if (user) {
      setFormData({ ...user, managedSocialAccountIds: user.managedSocialAccountIds || [] });
    } else {
      setFormData({ name: '', email: '', roleId: 'user', avatar: '', password: '', managedSocialAccountIds: [] });
    }
    isInitialized.current = true;
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
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0">
      <div className="bg-[#0D0D0D] w-full h-full overflow-y-auto custom-scrollbar relative flex flex-col">
        <div className="max-w-5xl mx-auto w-full p-8 md:p-12">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-3xl md:text-4xl font-oswald font-black italic uppercase text-neon tracking-tighter">
              {user ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-full transition-all border border-white/5">
              <X size={32} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Columna Izquierda: Perfil */}
            <div className="space-y-10">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 pl-2">Información de Perfil</h4>
              
              <div className="space-y-8">
                <div className="flex items-center gap-8 p-8 bg-black/50 rounded-[40px] border border-white/5">
                  <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={40} className="text-gray-700" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">URL del Avatar</label>
                    <input 
                      type="text" 
                      placeholder="https://..." 
                      value={formData.avatar || ''} 
                      onChange={e => setFormData(p => ({ ...p, avatar: e.target.value }))} 
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs text-blue-400 font-mono focus:border-neon outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="Nombre" 
                    value={formData.name || ''} 
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} 
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-xl text-white font-black focus:border-neon outline-none transition-all" 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Email de Acceso</label>
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={formData.email || ''} 
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} 
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-xl text-white font-black focus:border-neon outline-none transition-all" 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    placeholder="Dejar en blanco para no cambiar" 
                    value={formData.password || ''} 
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} 
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-xl text-white font-black focus:border-neon outline-none transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: Permisos */}
            <div className="space-y-10">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 pl-2">Roles & Accesos</h4>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Rol del Usuario</label>
                  <div className="relative">
                    <select 
                      value={formData.roleId || 'user'} 
                      onChange={e => setFormData(p => ({ ...p, roleId: e.target.value }))} 
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-xl text-white font-black focus:border-neon outline-none appearance-none cursor-pointer transition-all"
                    >
                      {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2 block">Cuentas Sociales Gestionadas</label>
                  <div className="grid grid-cols-1 gap-4 p-6 bg-black/50 rounded-[40px] border border-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {socialAccounts.map(account => (
                          <label key={account.id} className={`flex items-center gap-6 p-5 rounded-3xl border transition-all cursor-pointer group ${formData.managedSocialAccountIds?.includes(account.id) ? 'bg-neon/10 border-neon text-neon shadow-[0_0_20px_rgba(0,255,157,0.1)]' : 'bg-black border-white/5 text-gray-500 hover:border-white/20'}`}>
                              <div className="relative">
                                <input 
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.managedSocialAccountIds?.includes(account.id) || false}
                                    onChange={() => handleSocialAccountToggle(account.id)}
                                />
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.managedSocialAccountIds?.includes(account.id) ? 'bg-neon border-neon' : 'border-white/10 group-hover:border-white/30'}`}>
                                  {formData.managedSocialAccountIds?.includes(account.id) && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                              </div>
                              {account.profileImageUrl && <img src={account.profileImageUrl} alt={account.name} className="w-12 h-12 rounded-full border-2 border-white/5" />}
                              <div className="flex flex-col min-w-0">
                                <span className="text-lg font-black uppercase italic tracking-tight truncate">{account.name}</span>
                                <span className="text-xs font-bold opacity-60 truncate tracking-widest">{account.handle}</span>
                              </div>
                          </label>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 pt-12">
                <button onClick={onClose} className="flex-1 py-6 bg-white/5 text-gray-400 text-xs font-black uppercase italic tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                  CANCELAR
                </button>
                <button 
                  onClick={handleSave} 
                  className="flex-[2] py-6 bg-neon text-black text-xs font-black uppercase italic tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_40px_rgba(0,255,157,0.3)] flex items-center justify-center gap-3"
                >
                  <Save size={20} /> GUARDAR USUARIO
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};