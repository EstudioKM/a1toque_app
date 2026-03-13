import React from 'react';
import { BellRing, X, Check } from 'lucide-react';
import { User, UserAlert } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { parseArgentinaDate } from '../services/dateUtils';

interface PersonalNotificationsModalProps {
  user: User;
  onClose: () => void;
  onMarkAsSeen: (alertId: string) => void;
  onMarkAllAsSeen: () => void;
}

export const PersonalNotificationsModal: React.FC<PersonalNotificationsModalProps> = ({ 
  user, 
  onClose, 
  onMarkAsSeen,
  onMarkAllAsSeen
}) => {
  const activeAlerts = (user.alertMessages || []).filter(a => !a.seen);

  if (activeAlerts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative max-w-lg w-full bg-[#0D0D0D] rounded-3xl overflow-hidden shadow-2xl border border-yellow-500/30 flex flex-col max-h-[80vh]"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-500">
              <BellRing size={20} />
            </div>
            <div>
              <h2 className="text-xl font-oswald font-black text-white uppercase italic">
                Notificaciones Personales
              </h2>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                Tienes {activeAlerts.length} {activeAlerts.length === 1 ? 'alerta' : 'alertas'} sin leer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          <AnimatePresence>
            {activeAlerts.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl relative group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-yellow-500/70 uppercase tracking-widest mb-2">
                      {alert.createdAt ? format(parseArgentinaDate(alert.createdAt), 'dd/MM/yyyy HH:mm') : 'Nueva Alerta'}
                    </p>
                    <p className="text-sm text-white font-medium leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                  <button
                    onClick={() => onMarkAsSeen(alert.id)}
                    className="shrink-0 px-4 py-2 bg-yellow-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center gap-2"
                  >
                    <Check size={14} /> Aceptar
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {activeAlerts.length > 1 && (
          <div className="p-4 border-t border-white/5 shrink-0 bg-black/40 flex justify-center">
            <button
              onClick={onMarkAllAsSeen}
              className="text-[10px] font-black text-gray-400 hover:text-yellow-500 uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <Check size={14} /> Marcar todas como leídas
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
