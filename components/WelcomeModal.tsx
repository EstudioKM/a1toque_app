
import React from 'react';
import { PartyPopper } from 'lucide-react';

interface WelcomeModalProps {
    userName: string;
    onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ userName, onClose }) => {
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full h-full bg-[#0d0d0d] flex flex-col items-center justify-center p-6 md:p-12 text-center">
                <div className="max-w-xl w-full">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-neon/10 border-2 border-neon/30 rounded-full flex items-center justify-center text-neon mx-auto mb-10 shadow-[0_0_50px_rgba(0,255,157,0.2)]">
                        <PartyPopper size={64} strokeWidth={1.5} className="md:w-20 md:h-20" />
                    </div>
                    
                    <h2 className="text-4xl md:text-7xl font-oswald font-black text-white uppercase italic mb-6 tracking-tighter leading-none">
                        ¡BIENVENIDO, <br />
                        <span className="text-neon">{userName.split(' ')[0]}</span>!
                    </h2>
                    
                    <p className="text-gray-400 max-w-md mx-auto mb-12 font-black uppercase tracking-[0.3em] text-xs md:text-sm leading-relaxed opacity-70">
                        Gracias por unirte a la comunidad de A1Toque. <br />
                        Estás listo para vivir el deporte como nunca antes.
                    </p>
                    
                    <button
                        onClick={onClose}
                        className="w-full max-w-md py-6 bg-neon text-black font-black uppercase italic tracking-[0.2em] text-sm rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(0,255,157,0.3)]"
                    >
                        COMENZAR A EXPLORAR
                    </button>
                </div>
            </div>
        </div>
    );
};
