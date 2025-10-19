/**
 * Componente PresetChip - Chip individual para presets rápidos
 * 
 * Características:
 * - Diseño pill con emoji, label y tiempo
 * - Estado seleccionado con feedback visual
 * - Accesibilidad con aria-pressed y aria-label
 * - Animaciones suaves al seleccionar
 */

import type { FC } from 'react';
import { motion } from 'framer-motion';
import type { PresetChipProps } from '../../types';
import { formatTime } from '../utils/time';

export const PresetChip: FC<PresetChipProps> = ({
  preset,
  isSelected,
  onSelect,
  className = ''
}) => {
  const handleClick = () => {
    onSelect(preset);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(preset);
    }
  };

  return (
    <motion.button
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200
        min-h-[44px] min-w-[44px] touch-manipulation
        ${isSelected 
          ? 'bg-white text-black border-white shadow-lg' 
          : 'border-white/10 text-white/90 hover:border-white/20 hover:text-white'
        }
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-pressed={isSelected}
      aria-label={`Seleccionar preset ${preset.label} (${formatTime(preset.seconds)})`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        scale: isSelected ? 1.05 : 1,
        boxShadow: isSelected 
          ? '0 4px 12px rgba(255, 255, 255, 0.2)' 
          : '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Emoji del preset */}
      <motion.span
        className="text-lg"
        animate={{ 
          rotate: isSelected ? [0, -5, 5, 0] : 0,
          scale: isSelected ? 1.1 : 1
        }}
        transition={{ duration: 0.3 }}
      >
        {preset.emoji}
      </motion.span>

      {/* Contenido del chip */}
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium leading-tight">
          {preset.label}
        </span>
        <span className="text-xs opacity-70 font-mono">
          {formatTime(preset.seconds)}
        </span>
      </div>

      {/* Indicador de selección */}
      {isSelected && (
        <motion.div
          className="w-2 h-2 bg-black rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  );
};

export default PresetChip;
