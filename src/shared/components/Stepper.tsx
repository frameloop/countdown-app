/**
 * Componente Stepper - Controles +/- para incrementar/decrementar valores
 * 
 * Características:
 * - Botones + y - con aceleración al mantener presionado
 * - Feedback táctil y visual
 * - Accesibilidad con aria-label descriptivos
 * - Prevención de valores fuera de rango
 */

import { useState, useRef, useCallback, useEffect, FC } from 'react';
import { motion } from 'framer-motion';
import { StepperProps } from '../../types';

export const Stepper: FC<StepperProps> = ({
  value,
  min,
  max,
  step,
  label,
  onIncrement,
  onDecrement,
  onLongPress,
  className = ''
}) => {
  const [isPressed, setIsPressed] = useState<'increment' | 'decrement' | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const accelerationTimer = useRef<NodeJS.Timeout | null>(null);
  // const [accelerationStep, setAccelerationStep] = useState(step);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (accelerationTimer.current) clearTimeout(accelerationTimer.current);
    };
  }, []);

  // Manejar presión larga con aceleración
  const handleLongPress = useCallback((increment: boolean) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    longPressTimer.current = setTimeout(() => {
      // Iniciar aceleración después de 600ms
      // setAccelerationStep(step * 5); // Saltos de 5x el step original
      
      const repeatAction = () => {
        if (increment) {
          onIncrement();
        } else {
          onDecrement();
        }
        
        accelerationTimer.current = setTimeout(repeatAction, 100); // Repetir cada 100ms
      };
      
      repeatAction();
    }, 600);
  }, [step, onIncrement, onDecrement]);

  // Manejar inicio de presión
  const handlePressStart = (increment: boolean) => {
    setIsPressed(increment ? 'increment' : 'decrement');
    // setAccelerationStep(step);
    
    if (increment) {
      onIncrement();
    } else {
      onDecrement();
    }
    
    handleLongPress(increment);
  };

  // Manejar fin de presión
  const handlePressEnd = () => {
    setIsPressed(null);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (accelerationTimer.current) {
      clearTimeout(accelerationTimer.current);
      accelerationTimer.current = null;
    }
    
    setAccelerationStep(step);
  };

  // Verificar si los botones deben estar deshabilitados
  const isIncrementDisabled = value >= max;
  const isDecrementDisabled = value <= min;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Label del stepper */}
      <label className="text-sm font-medium text-white/80 mb-1">
        {label}
      </label>

      {/* Contenedor del stepper */}
      <div className="flex items-center gap-1">
        {/* Botón decrementar */}
        <motion.button
          className={`
            w-10 h-10 rounded-lg border-2 flex items-center justify-center
            transition-all duration-200 touch-manipulation
            ${isDecrementDisabled
              ? 'border-white/20 text-white/30 cursor-not-allowed'
              : 'border-white/40 text-white hover:border-white/60 hover:bg-white/10 active:bg-white/20'
            }
          `}
          onClick={onDecrement}
          onMouseDown={() => !isDecrementDisabled && handlePressStart(false)}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={() => !isDecrementDisabled && handlePressStart(false)}
          onTouchEnd={handlePressEnd}
          disabled={isDecrementDisabled}
          aria-label={`Decrementar ${label} en ${step}${step > 1 ? 's' : ''}`}
          whileHover={!isDecrementDisabled ? { scale: 1.05 } : {}}
          whileTap={!isDecrementDisabled ? { scale: 0.95 } : {}}
        >
          <motion.span
            animate={{ 
              scale: isPressed === 'decrement' ? [1, 0.8, 1] : 1,
              opacity: isPressed === 'decrement' ? [1, 0.7, 1] : 1
            }}
            transition={{ duration: 0.1, repeat: isPressed === 'decrement' ? Infinity : 0 }}
            className="text-lg font-bold"
          >
            −
          </motion.span>
        </motion.button>

        {/* Valor actual */}
        <motion.div
          className="
            min-w-[3rem] text-center text-2xl font-mono text-white
            px-3 py-2 rounded-lg bg-white/5 border border-white/10
          "
          animate={{ 
            scale: isPressed ? [1, 1.05, 1] : 1,
            backgroundColor: isPressed ? '#ffffff15' : '#ffffff05'
          }}
          transition={{ duration: 0.2 }}
        >
          {value.toString().padStart(2, '0')}
        </motion.div>

        {/* Botón incrementar */}
        <motion.button
          className={`
            w-10 h-10 rounded-lg border-2 flex items-center justify-center
            transition-all duration-200 touch-manipulation
            ${isIncrementDisabled
              ? 'border-white/20 text-white/30 cursor-not-allowed'
              : 'border-white/40 text-white hover:border-white/60 hover:bg-white/10 active:bg-white/20'
            }
          `}
          onClick={onIncrement}
          onMouseDown={() => !isIncrementDisabled && handlePressStart(true)}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={() => !isIncrementDisabled && handlePressStart(true)}
          onTouchEnd={handlePressEnd}
          disabled={isIncrementDisabled}
          aria-label={`Incrementar ${label} en ${step}${step > 1 ? 's' : ''}`}
          whileHover={!isIncrementDisabled ? { scale: 1.05 } : {}}
          whileTap={!isIncrementDisabled ? { scale: 0.95 } : {}}
        >
          <motion.span
            animate={{ 
              scale: isPressed === 'increment' ? [1, 0.8, 1] : 1,
              opacity: isPressed === 'increment' ? [1, 0.7, 1] : 1
            }}
            transition={{ duration: 0.1, repeat: isPressed === 'increment' ? Infinity : 0 }}
            className="text-lg font-bold"
          >
            +
          </motion.span>
        </motion.button>
      </div>

      {/* Indicador de aceleración */}
      {isPressed && (
        <motion.div
          className="text-xs text-white/60 font-mono"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          Mantén para acelerar
        </motion.div>
      )}
    </div>
  );
};

export default Stepper;
