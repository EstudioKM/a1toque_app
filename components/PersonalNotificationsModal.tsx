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
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 bg-black/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full h-full bg-[#0D0D0D] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 md:px-12 py-6 md:py-8 border-b border-yellow-500/20 flex items-center justify-between bg-yellow-500/5 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <BellRing size={24} className="md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-oswald font-black text-white uppercase italic tracking-tighter leading-none">
                NOTIFICACIONES PERSONALES
              </h2>
              <p className="text-yellow-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mt-1 md:mt-2">
                Tienes {activeAlerts.length} {activeAlerts.length === 1 ? 'alerta' : 'alertas'} sin leer
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 md:p-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
          >
            <X size={24} className="md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence>
              {activeAlerts.map(alert => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-yellow-500/5 border border-yellow-500/20 p-8 rounded-[32px] relative group hover:border-yellow-500/40 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-yellow-500/70 uppercase tracking-[0.3em] mb-4">
                        {alert.createdAt ? format(parseArgentinaDate(alert.createdAt), 'dd/MM/yyyy HH:mm') : 'Nueva Alerta'}
                      </p>
                      <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                    <button
                      onClick={() => onMarkAsSeen(alert.id)}
                      className="shrink-0 w-full md:w-auto px-8 py-4 bg-yellow-500 text-black rounded-2xl text-xs font-black uppercase italic tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(234,179,8,0.3)] flex items-center justify-center gap-3"
                    >
                      <Check size={18} /> ACEPTAR
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {activeAlerts.length > 1 && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={onMarkAllAsSeen}
                  className="px-8 py-4 bg-white/5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all border border-white/5 flex items-center gap-3"
                >
                  <Check size={16} /> MARCAR TODAS COMO LEÍDAS
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
