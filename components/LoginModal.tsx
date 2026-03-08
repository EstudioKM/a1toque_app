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
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="relative max-w-sm w-full bg-[#111] rounded-3xl overflow-hidden shadow-2xl border border-white/10 p-8">
           <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition"><X size={20}/></button>
            <div className="text-center mb-8">
                <img src="https://www.a1toque.com/wp-content/uploads/2020/06/Artboard-22-4.png" alt="A1Toque" className="h-12 w-auto object-contain mx-auto mb-4"/>
                <h2 className="text-2xl font-oswald font-black text-white uppercase italic">{titleMap[view]}</h2>
            </div>
            {error && <p className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center p-3 rounded-lg mb-4">{error}</p>}
            {renderContent()}
            <div className="text-center mt-6 text-xs">
                <p className="text-gray-500">
                    {view === 'login' ? '¿No tienes cuenta?' : '¿Ya eres miembro?'}
                    <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="font-bold text-neon hover:underline ml-1">
                         {view === 'login' ? 'Regístrate' : 'Inicia sesión'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    );
};