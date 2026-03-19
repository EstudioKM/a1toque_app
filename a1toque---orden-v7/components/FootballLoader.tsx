import React from 'react';

export const FootballLoader: React.FC = () => {
  return (
    <>
      <svg
        className="w-16 h-16 animate-spin-slow"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Cargando contenido"
      >
        <circle cx="12" cy="12" r="10" stroke="#00ff9d" strokeWidth="1.5" />
        <path
          d="M12 2.16797V6.16797"
          stroke="#00ff9d"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12 17.832V21.832"
          stroke="#00ff9d"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M5.02441 5.02539L7.82441 7.82539"
          stroke="#00ff9d"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16.1758 16.1758L18.9758 18.9758"
          stroke="#00ff9d"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M2.16797 12H6.16797"
          stroke="#00ff9d"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M17.832 12H21.832"
          stroke="#00ff9d"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M5.02441 18.9758L7.82441 16.1758"
          stroke="#00ff9d"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16.1758 7.82539L18.9758 5.02539"
          stroke="#00ff9d"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <style>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 1.5s linear infinite;
          }
      `}</style>
    </>
  );
};