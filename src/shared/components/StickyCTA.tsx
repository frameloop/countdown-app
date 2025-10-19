/**
 * Componente StickyCTA - Call-to-action pegajoso en la parte inferior
 * 
 * Características:
 * - Botón principal "Empezar" y secundario "Previsualizar"
 * - Posición fija en la parte inferior
 * - Gradiente de fondo con blur
 * - Animaciones de countdown para previsualización
 * - Accesibilidad con aria-labels descriptivos
 */

import { useState, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyCTAProps } from '../../types';
import { formatTime } from '../utils/time';

export const StickyCTA: FC<StickyCTAProps> = ({
  onStart,
  onPreview,
  totalSeconds,
  disabled = false
}) => {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [countdownValue, setCountdownValue] = useState(totalSeconds);

  // Manejar previsualización con countdown 3-2-1
  const handlePreview = async () => {
    if (disabled || totalSeconds === 0) return;

    setIsPreviewing(true);
    setCountdownValue(totalSeconds);

    // Countdown 3-2-1
    for (let i = 3; i >= 1; i--) {
      setCountdownValue(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Volver al valor original
    setCountdownValue(totalSeconds);
    setIsPreviewing(false);
    
    // Llamar callback de previsualización
    onPreview();
  };

  // Manejar inicio del temporizador
  const handleStart = () => {
    if (disabled || totalSeconds === 0) return;
    onStart(totalSeconds);
  };

  // Verificar si el botón debe estar deshabilitado
  const isDisabled = disabled || totalSeconds === 0;

  return (
    <motion.div
      className="
        fixed inset-x-0 bottom-0 p-4
        bg-gradient-to-t from-black/80 to-transparent backdrop-blur
        border-t border-white/10
      "
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      <div className="max-w-md mx-auto">
        {/* Contenedor de botones */}
        <div className="flex gap-3">
          {/* Botón Previsualizar */}
          <motion.button
            className={`
              flex-1 py-4 px-6 rounded-xl border-2 font-bold text-sm
              transition-all duration-200 touch-manipulation
              ${isDisabled
                ? 'border-white/20 text-white/30 cursor-not-allowed'
                : 'border-white/40 text-white hover:border-white/60 hover:bg-white/10 active:bg-white/20'
              }
            `}
            onClick={handlePreview}
            disabled={isDisabled}
            whileHover={!isDisabled ? { scale: 1.02 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            aria-label="Previsualizar countdown 3-2-1"
          >
            <div className="flex items-center justify-center gap-2">
              <span>👁️</span>
              <span>Previsualizar</span>
            </div>
          </motion.button>

          {/* Botón Empezar */}
          <motion.button
            className={`
              flex-1 py-4 px-6 rounded-xl font-bold text-sm
              transition-all duration-200 touch-manipulation
              ${isDisabled
                ? 'bg-white/20 text-white/30 cursor-not-allowed'
                : 'bg-white text-black hover:bg-white/90 active:bg-white/80'
              }
            `}
            onClick={handleStart}
            disabled={isDisabled}
            whileHover={!isDisabled ? { scale: 1.02 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            aria-label={`Empezar temporizador de ${formatTime(totalSeconds)}`}
          >
            <div className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ 
                  rotate: isDisabled ? 0 : [0, 10, -10, 0],
                  scale: isDisabled ? 1 : [1, 1.1, 1]
                }}
                transition={{ duration: 0.3 }}
              >
                ▶️
              </motion.span>
              <span>Empezar</span>
            </div>
          </motion.button>
        </div>

        {/* Display del tiempo actual */}
        <motion.div
          className="mt-3 text-center"
          animate={{ 
            opacity: isDisabled ? 0.5 : 1,
            scale: isDisabled ? 0.95 : 1
          }}
        >
          <div className="text-sm text-white/60 mb-1">
            Tiempo configurado
          </div>
          <div className="text-lg font-mono text-white">
            {formatTime(totalSeconds)}
          </div>
        </motion.div>

        {/* Indicador de previsualización */}
        <AnimatePresence>
          {isPreviewing && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl font-mono text-white"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                {countdownValue}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicador de estado */}
        {isDisabled && (
          <motion.div
            className="mt-2 text-center text-xs text-white/40"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {totalSeconds === 0 ? 'Configura un tiempo primero' : 'Temporizador deshabilitado'}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default StickyCTA;
