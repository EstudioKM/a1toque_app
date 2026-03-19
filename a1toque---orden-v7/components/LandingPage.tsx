
import React, { useState } from 'react';

interface LandingPageProps {
  onBack: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onBack }) => {
  const [registered, setRegistered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegistered(true);
  };

  return (
    <div className="min-h-screen bg-black relative flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]"></div>
      </div>
      
      <img 
        src="https://www.a1toque.com/wp-content/uploads/2020/06/Artboard-22-4.png" 
        alt="A1Toque" 
        className="absolute top-8 left-8 h-12 w-auto z-50 opacity-80"
      />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-neutral-900 rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative z-10">
        <div className="relative h-64 md:h-auto">
          <img 
            src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=800" 
            className="w-full h-full object-cover grayscale brightness-50" 
            alt="Landing"
          />
          <div className="absolute inset-0 flex flex-col justify-center p-12">
            <h2 className="text-5xl font-oswald font-black text-white uppercase italic leading-none">Únete a la<br/><span className="text-neon">Inner Circle</span></h2>
            <p className="text-gray-400 mt-6 text-sm uppercase font-bold tracking-widest">Contenido prohibido para el público general.</p>
          </div>
        </div>

        <div className="p-12 flex flex-col justify-center">
          {!registered ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-neon uppercase tracking-widest mb-2">Nombre Completo</label>
                <input required type="text" className="w-full bg-black/50 border border-white/10 px-6 py-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-neon transition" placeholder="EJ. JUAN PÉREZ" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-neon uppercase tracking-widest mb-2">Email de Contacto</label>
                <input required type="email" className="w-full bg-black/50 border border-white/10 px-6 py-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-neon transition" placeholder="JUAN@ELITE.COM" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-neon uppercase tracking-widest mb-2">Interés Principal</label>
                <select className="w-full bg-black/50 border border-white/10 px-6 py-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-neon transition font-bold uppercase text-[10px]">
                  <option>NOTICIAS EXCLUSIVAS</option>
                  <option>PRUEBAS DE PRODUCTO</option>
                  <option>EVENTOS VIP</option>
                </select>
              </div>
              <button className="w-full py-5 bg-neon text-black font-black uppercase italic tracking-tighter hover:scale-[1.02] transition-transform">
                Registrar Acceso
              </button>
            </form>
          ) : (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-neon rounded-full flex items-center justify-center text-black text-3xl mx-auto mb-6">✓</div>
              <h3 className="text-3xl font-oswald font-black text-white uppercase italic mb-4">Registro Completo</h3>
              <p className="text-gray-400 text-sm uppercase font-bold tracking-widest mb-8">Revisa tu inbox para el código de acceso.</p>
              <button onClick={onBack} className="text-neon font-black uppercase text-[10px] tracking-widest hover:underline">Volver al inicio</button>
            </div>
          )}
        </div>
      </div>
      
      <button onClick={onBack} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors uppercase font-black text-[10px] tracking-[0.5em]">✕ CERRAR</button>
    </div>
  );
};
