import React from 'react';

export const ProgressBarLoader: React.FC = () => {
  return (
    <>
      <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="w-1/2 h-full bg-gradient-to-r from-neon/0 to-neon animate-slide"></div>
      </div>
      <style>{`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .animate-slide {
            animation: slide 1.5s ease-in-out infinite;
          }
      `}</style>
    </>
  );
};