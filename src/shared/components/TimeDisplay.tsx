/**
 * Componente TimeDisplay - Display tipo odómetro para mostrar tiempo
 * 
 * Características:
 * - Muestra formato ss para <60s, mm:ss para >=60s
 * - Estilo visual de odómetro antiguo con sombras y bordes
 * - Animaciones suaves al cambiar dígitos
 * - Accesibilidad con aria-live para lectores de pantalla
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '../utils/time';
import { TimeDisplayProps } from '../../types';

export const TimeDisplay: React.FC<TimeDisplayProps> = ({ 
  totalSeconds, 
  className = '' 
}) => {
  const [displayValue, setDisplayValue] = useState(formatTime(totalSeconds));
  const [isAnimating, setIsAnimating] = useState(false);

  // Actualizar display cuando cambie totalSeconds
  useEffect(() => {
    const newValue = formatTime(totalSeconds);
    if (newValue !== displayValue) {
      setIsAnimating(true);
      setDisplayValue(newValue);
      
      // Reset animation state después de la transición
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalSeconds, displayValue]);

  // Determinar si mostrar formato mm:ss o ss
  const isLongFormat = totalSeconds >= 60;
  const digits = displayValue.split('');

  return (
    <div 
      className={`
        relative rounded-3xl bg-[#0E0E10] border border-white/10 
        shadow-[inset_0_2px_12px_rgba(0,0,0,.8)] p-6
        ${className}
      `}
      role="timer"
      aria-live="polite"
      aria-label={`Tiempo configurado: ${displayValue}`}
    >
      {/* Contenedor principal del odómetro */}
      <div className="flex items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={displayValue}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex items-center gap-1"
          >
            {digits.map((digit, index) => {
              // Si es el separador ':', renderizar diferente
              if (digit === ':') {
                return (
                  <motion.div
                    key={`colon-${index}`}
                    className="text-[min(12vw,120px)] font-mono text-[#EDEDED] 
                             leading-none tracking-tight mx-2"
                    animate={{ 
                      opacity: isAnimating ? [1, 0.5, 1] : 1,
                      scale: isAnimating ? [1, 1.1, 1] : 1
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    :
                  </motion.div>
                );
              }

              // Renderizar dígito individual con estilo de odómetro
              return (
                <motion.div
                  key={`digit-${index}-${digit}`}
                  className="
                    relative rounded-xl bg-[#151517] border border-white/8 
                    shadow-[inset_0_-8px_16px_rgba(0,0,0,.65),inset_0_12px_24px_rgba(255,255,255,.03)]
                    w-[min(12vw,120px)] h-[min(12vw,120px)] flex items-center justify-center
                    overflow-hidden
                  "
                  animate={{ 
                    scale: isAnimating ? [1, 1.05, 1] : 1,
                    boxShadow: isAnimating 
                      ? [
                          'inset 0 -8px 16px rgba(0,0,0,.65), inset 0 12px 24px rgba(255,255,255,.03)',
                          'inset 0 -8px 16px rgba(0,0,0,.8), inset 0 12px 24px rgba(255,255,255,.08)',
                          'inset 0 -8px 16px rgba(0,0,0,.65), inset 0 12px 24px rgba(255,255,255,.03)'
                        ]
                      : 'inset 0 -8px 16px rgba(0,0,0,.65), inset 0 12px 24px rgba(255,255,255,.03)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Línea divisoria simulando "palas" del odómetro */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                  
                  {/* Dígito principal */}
                  <motion.span
                    className="
                      text-[min(12vw,120px)] font-mono text-[#EDEDED] 
                      leading-none tracking-tight relative z-10
                    "
                    animate={{ 
                      y: isAnimating ? [-2, 0] : 0,
                      opacity: isAnimating ? [0.7, 1] : 1
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {digit}
                  </motion.span>
                  
                  {/* Efecto de brillo sutil */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicador de formato actual */}
      <div className="absolute top-2 right-2 text-xs text-white/40 font-mono">
        {isLongFormat ? 'mm:ss' : 'ss'}
      </div>
    </div>
  );
};

export default TimeDisplay;
