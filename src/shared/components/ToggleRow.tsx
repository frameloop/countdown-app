/**
 * Componente ToggleRow - Fila de toggle con estilo iOS
 * 
 * Características:
 * - Diseño estilo iOS con animaciones suaves
 * - Icono opcional y descripción
 * - Accesibilidad con aria-describedby
 * - Feedback visual al cambiar estado
 */

import type { FC } from 'react';
import { motion } from 'framer-motion';
import type { ToggleRowProps } from '../../types';

export const ToggleRow: FC<ToggleRowProps> = ({
  label,
  description,
  enabled,
  onChange,
  icon,
  className = ''
}) => {
  const handleToggle = () => {
    onChange(!enabled);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <motion.div
      className={`
        flex items-center justify-between p-4 rounded-xl
        bg-white/5 border border-white/10 hover:bg-white/10
        transition-all duration-200 cursor-pointer
        min-h-[60px] touch-manipulation
        ${className}
      `}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="switch"
      aria-checked={enabled}
      aria-describedby={`${label.toLowerCase().replace(/\s+/g, '-')}-description`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Contenido izquierdo */}
      <div className="flex items-center gap-3 flex-1">
        {/* Icono opcional */}
        {icon && (
          <motion.span
            className="text-2xl"
            animate={{ 
              scale: enabled ? [1, 1.1, 1] : 1,
              rotate: enabled ? [0, 5, -5, 0] : 0
            }}
            transition={{ duration: 0.3 }}
          >
            {icon}
          </motion.span>
        )}

        {/* Texto principal */}
        <div className="flex flex-col">
          <span className="text-base font-medium text-white">
            {label}
          </span>
          <span 
            id={`${label.toLowerCase().replace(/\s+/g, '-')}-description`}
            className="text-sm text-white/60 leading-tight"
          >
            {description}
          </span>
        </div>
      </div>

      {/* Toggle switch */}
      <motion.div
        className={`
          relative w-12 h-6 rounded-full border-2 transition-colors duration-200
          ${enabled 
            ? 'bg-white border-white' 
            : 'bg-transparent border-white/40'
          }
        `}
        animate={{
          backgroundColor: enabled ? '#ffffff' : 'transparent',
          borderColor: enabled ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Círculo del toggle */}
        <motion.div
          className="
            absolute top-0.5 w-4 h-4 bg-black rounded-full
            shadow-lg
          "
          animate={{
            x: enabled ? 24 : 0,
            backgroundColor: enabled ? '#000000' : '#000000'
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        />

        {/* Efecto de brillo cuando está activo */}
        {enabled && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, repeat: 1 }}
          />
        )}
      </motion.div>

      {/* Indicador de estado */}
      <motion.div
        className="ml-2"
        animate={{ 
          opacity: enabled ? 1 : 0.3,
          scale: enabled ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-xs font-medium text-white/80">
          {enabled ? 'ON' : 'OFF'}
        </span>
      </motion.div>
    </motion.div>
  );
};

export default ToggleRow;
