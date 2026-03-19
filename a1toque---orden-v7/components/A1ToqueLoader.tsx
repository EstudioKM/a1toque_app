import React from 'react';

export const A1ToqueLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-24 h-24">
        {/* Anillo de Rotación Táctica */}
        <div className="absolute inset-0 border-2 border-neon/20 border-t-neon border-dashed rounded-full animate-spin-slow"></div>
        
        {/* Segundo Anillo Pulsante */}
        <div className="absolute inset-2 border border-neon/10 rounded-full animate-ping opacity-20"></div>

        {/* Ícono de Balón Central */}
        <div className="absolute inset-0 flex items-center justify-center animate-pulse-subtle">
          <svg 
            viewBox="0 0 24 24" 
            className="w-12 h-12 text-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.6)]"
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z" />
            <path d="m12 22-3.5-3.5L12 15l3.5 3.5L12 22Z" />
            <path d="m2 12 3.5-3.5L9 12l-3.5 3.5L2 12Z" />
            <path d="m22 12-3.5 3.5L15 12l3.5-3.5L22 12Z" />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};