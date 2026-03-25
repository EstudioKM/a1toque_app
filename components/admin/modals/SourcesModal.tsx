import React from 'react';
import { Source } from '../../../types';
import { X, ExternalLink } from 'lucide-react';

interface SourcesModalProps {
  sources: Source[];
  onClose: () => void;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({ sources, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0">
      <div className="bg-[#0D0D0D] w-full h-full overflow-y-auto custom-scrollbar relative flex flex-col">
        <div className="max-w-3xl mx-auto w-full p-8 md:p-12">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl md:text-3xl font-oswald font-black italic uppercase text-neon flex items-center gap-4">
              Fuentes Consultadas por la IA
            </h3>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-all">
              <X size={28} />
            </button>
          </div>

          <ul className="space-y-4">
            {sources.map((source, index) => (
              <li key={index}>
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-6 text-gray-400 hover:text-neon transition group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-neon/30"
                >
                  <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0 group-hover:bg-neon/10 transition-colors">
                    <ExternalLink size={24} className="text-gray-600 group-hover:text-neon transition" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black uppercase italic truncate group-hover:underline tracking-tight">{source.title}</p>
                    <p className="text-xs text-gray-600 truncate mt-1 font-mono">{source.uri}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
