import React, { useState, useRef } from 'react';
import { User, Role } from '../../types';
import { Edit3, Save, Loader2, UploadCloud, CheckCircle2, Twitter, Instagram, Mail, Lock } from 'lucide-react';
import { storage } from '../../services/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

interface ProfileTabProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  currentUserRole: Role;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ currentUser, onUpdateUser, currentUserRole }) => {
  const [formData, setFormData] = useState<Partial<User>>({ ...currentUser });
  const [newPassword, setNewPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      
      const storageRef = ref(storage, `avatars/${currentUser.id}-${file.name}`);
      const snapshot = await uploadString(storageRef, base64, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);
      setFormData(p => ({ ...p, avatar: downloadURL }));
    } catch (error) {
      console.error("Avatar upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const updatedUser: User = { ...currentUser, ...formData };
    if (newPassword) {
      updatedUser.password = newPassword;
    } else {
      delete updatedUser.password;
    }

    await onUpdateUser(updatedUser);
    setNewPassword('');

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 500);
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <h2 className="text-3xl font-oswald font-black italic uppercase text-white mb-6">Mi Perfil</h2>
      <div className="bg-white/5 p-8 rounded-xl border border-white/10 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 flex flex-col items-center text-center">
            <div className="relative group mb-4">
                <img src={formData.avatar} alt={formData.name} className="w-32 h-32 object-cover rounded-full" />
                <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    {isUploading ? <Loader2 className="animate-spin"/> : <UploadCloud size={32} />}
                </button>
                <input type="file" ref={avatarInputRef} onChange={handleFileUpload} hidden accept="image/*" />
            </div>
            <input type="text" value={formData.avatar} onChange={e => handleInputChange('avatar', e.target.value)} placeholder="O pega una URL" className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-blue-400 mt-2 focus:border-neon outline-none text-center" />
            <h3 className="text-2xl text-white font-bold mt-4">{formData.name}</h3>
            <span className="mt-2 inline-block px-3 py-1 text-[10px] font-black uppercase rounded-full bg-neon text-black">{currentUserRole?.name}</span>
        </div>
        
        <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre de Usuario</label>
                    <input type="text" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white mt-2 focus:border-neon outline-none" />
                </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                    <input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white mt-2 focus:border-neon outline-none" />
                </div>
            </div>
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nueva Contraseña</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar" className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white mt-2 focus:border-neon outline-none" />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Biografía de Autor</label>
                <textarea value={formData.bio || ''} onChange={e => handleInputChange('bio', e.target.value)} rows={3} className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white mt-2 focus:border-neon outline-none" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Twitter size={14}/> Twitter Handle</label>
                    <input type="text" value={formData.twitter || ''} onChange={e => handleInputChange('twitter', e.target.value)} placeholder="@usuario" className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white mt-2 focus:border-neon outline-none" />
                </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Instagram size={14}/> Instagram Handle</label>
                    <input type="text" value={formData.instagram || ''} onChange={e => handleInputChange('instagram', e.target.value)} placeholder="@usuario" className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white mt-2 focus:border-neon outline-none" />
                </div>
            </div>
             <div className="flex justify-end items-center gap-4 pt-4">
                {saveSuccess && <span className="text-xs text-green-400 font-bold flex items-center gap-2"><CheckCircle2 size={14} /> Guardado con éxito</span>}
                <button onClick={handleSaveChanges} disabled={isSaving} className="px-6 py-2 bg-neon text-black text-xs font-black uppercase italic tracking-widest rounded-sm hover:scale-105 transition flex items-center gap-2 disabled:opacity-50">
                    {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};