import React from 'react';
import { Source } from '../../../types';
import { X, ExternalLink } from 'lucide-react';

interface SourcesModalProps {
  sources: Source[];
  onClose: () => void;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({ sources, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-oswald font-black italic text-neon">Fuentes Consultadas por la IA</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <ul className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
          {sources.map((source, index) => (
            <li key={index}>
              <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-neon transition group p-2 rounded-lg hover:bg-white/5">
                <ExternalLink size={16} className="flex-shrink-0 text-gray-600 group-hover:text-neon transition" />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate group-hover:underline">{source.title}</p>
                  <p className="text-xs text-gray-600 truncate">{source.uri}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
