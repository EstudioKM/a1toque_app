
import React from 'react';
import { PartyPopper } from 'lucide-react';

interface WelcomeModalProps {
    userName: string;
    onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ userName, onClose }) => {
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative max-w-md w-full bg-[#111] rounded-3xl overflow-hidden shadow-2xl border border-white/10 p-8 text-center">
                <div className="w-24 h-24 bg-neon/10 border-2 border-neon/30 rounded-full flex items-center justify-center text-neon mx-auto mb-6">
                    <PartyPopper size={48} strokeWidth={1.5} />
                </div>
                <h2 className="text-4xl font-oswald font-black text-white uppercase italic mb-4">
                    ¡Bienvenido, <span className="text-neon">{userName.split(' ')[0]}</span>!
                </h2>
                <p className="text-gray-400 max-w-xs mx-auto mb-8 font-medium uppercase tracking-wider text-sm">
                    Gracias por unirte a la comunidad de A1Toque. Estás listo para vivir el deporte como nunca antes.
                </p>
                <button
                    onClick={onClose}
                    className="w-full py-4 bg-neon text-black font-black uppercase italic tracking-tighter hover:scale-[1.02] transition-transform"
                >
                    Comenzar a Explorar
                </button>
            </div>
        </div>
    );
};
