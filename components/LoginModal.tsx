import React, { useState } from 'react';
// FIX: Removed non-existent 'UserRole' type from import.
import { User } from '../types';
import { X, Lock, Mail, User as UserIcon } from 'lucide-react';

interface LoginModalProps {
    onClose: () => void;
    onLogin: (email: string, pass: string) => User | null;
    onRegister: (name: string, email: string, pass: string) => Promise<boolean>;
}

type View = 'login' | 'register';

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin, onRegister }) => {
    const [view, setView] = useState<View>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const user = onLogin(email, password);
        if (!user) {
            setTimeout(() => {
                setError('Credenciales incorrectas. Inténtalo de nuevo.');
                setIsLoading(false);
            }, 500);
        }
    };
    
    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const success = await onRegister(name, email, password);
            if (!success) {
               setError('Hubo un error en el registro. Es posible que el email ya exista.');
            }
            // El componente padre (App.tsx) se encargará de cerrar el modal
        } catch (err) {
            setError('Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };


    const renderContent = () => {
        switch (view) {
            case 'register':
                return (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                         <div>
                            <label className="block text-[10px] font-black text-neon uppercase tracking-widest mb-2">Nombre Completo</label>
                            <div className="relative"><UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/50 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-neon transition" placeholder="EJ. JUAN PÉREZ" /></div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-neon uppercase tracking-widest mb-2">Email</label>
                            <div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-neon transition" placeholder="tu@email.com" /></div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-neon uppercase tracking-widest mb-2">Contraseña</label>
                            <div className="relative"><Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-neon transition" placeholder="••••••••" /></div>
                        </div>
                        <button disabled={isLoading} className="w-full py-4 bg-neon text-black font-black uppercase italic tracking-tighter hover:scale-[1.02] transition-transform disabled:opacity-50">
                            {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                        </button>
                    </form>
                );
            default: // login
                return (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-neon uppercase tracking-widest mb-2">Email</label>
                            <div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-neon transition" placeholder="tu@email.com" /></div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-neon uppercase tracking-widest mb-2">Contraseña</label>
                            <div className="relative"><Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-neon transition" placeholder="••••••••" /></div>
                        </div>
                        <button disabled={isLoading} className="w-full py-4 bg-neon text-black font-black uppercase italic tracking-tighter hover:scale-[1.02] transition-transform disabled:opacity-50">
                             {isLoading ? 'Accediendo...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                );
        }
    }

    const titleMap = {
        login: "Acceso Exclusivo",
        register: "Únete al Círculo",
    }

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="relative w-full h-full bg-[#0d0d0d] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 md:px-12 py-6 md:py-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-neon/10 border border-neon/20 rounded-2xl flex items-center justify-center text-neon shadow-[0_0_20px_rgba(0,255,157,0.1)]">
                <Lock size={24} className="md:w-8 md:h-8" />
              </div>
              <div>
                <h2 className="text-2xl md:text-4xl font-oswald font-black text-white uppercase italic tracking-tighter leading-none">
                  {titleMap[view]}
                </h2>
                <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mt-1 md:mt-2">
                  {view === 'login' ? 'Accede a tu cuenta de A1Toque' : 'Únete a nuestra comunidad exclusiva'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 md:p-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
            >
              <X size={24} className="md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 flex flex-col items-center justify-center">
            <div className="max-w-md w-full">
              <div className="text-center mb-12">
                <img src="https://www.a1toque.com/wp-content/uploads/2020/06/Artboard-22-4.png" alt="A1Toque" className="h-16 md:h-24 w-auto object-contain mx-auto mb-6 drop-shadow-[0_0_20px_rgba(0,255,157,0.2)]"/>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center p-4 rounded-2xl mb-8 font-bold uppercase tracking-widest animate-in shake duration-300">
                  {error}
                </div>
              )}

              <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8 md:p-10 shadow-2xl">
                {renderContent()}
                
                <div className="text-center mt-10 pt-8 border-t border-white/5">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                    {view === 'login' ? '¿No tienes cuenta?' : '¿Ya eres miembro?'}
                    <button 
                      onClick={() => setView(view === 'login' ? 'register' : 'login')} 
                      className="font-black text-neon hover:underline ml-2 transition-all"
                    >
                      {view === 'login' ? 'REGÍSTRATE' : 'INICIA SESIÓN'}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};