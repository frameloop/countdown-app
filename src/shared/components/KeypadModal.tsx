/**
 * Componente KeypadModal - Modal con teclado numérico para entrada de tiempo
 * 
 * Características:
 * - Teclado numérico 0-9 con botones grandes
 * - Validación en tiempo real del formato mmss
 * - Botones de borrar y confirmar
 * - Accesibilidad con focus management
 * - Animaciones de entrada y salida
 */

import { useState, useEffect, useRef, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeypadModalProps } from '../../types';
import { parseKeypadInput, toKeypadString, formatTime, normalizeSeconds } from '../utils/time';

export const KeypadModal: FC<KeypadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialValue
}) => {
  const [input, setInput] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Inicializar con valor inicial
  useEffect(() => {
    if (isOpen) {
      setInput(toKeypadString(initialValue));
      setDisplayValue(formatTime(initialValue));
      setIsValid(true);
    }
  }, [isOpen, initialValue]);

  // Focus management para accesibilidad
  useEffect(() => {
    if (isOpen && firstButtonRef.current) {
      firstButtonRef.current.focus();
    }
  }, [isOpen]);

  // Manejar entrada de números
  const handleNumberInput = (digit: string) => {
    const newInput = input + digit;
    
    // Limitar a 4 dígitos máximo
    if (newInput.length <= 4) {
      setInput(newInput);
      updateDisplay(newInput);
    }
  };

  // Manejar borrado
  const handleBackspace = () => {
    const newInput = input.slice(0, -1);
    setInput(newInput);
    updateDisplay(newInput);
  };

  // Actualizar display y validación
  const updateDisplay = (inputValue: string) => {
    if (inputValue === '') {
      setDisplayValue('00');
      setIsValid(true);
      return;
    }

    const seconds = parseKeypadInput(inputValue);
    const normalized = normalizeSeconds(seconds);
    setDisplayValue(formatTime(normalized));
    setIsValid(seconds > 0);
  };

  // Manejar confirmación
  const handleConfirm = () => {
    if (isValid && input !== '') {
      const seconds = parseKeypadInput(input);
      onConfirm(normalizeSeconds(seconds));
    }
  };

  // Manejar teclado
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'Enter') {
      handleConfirm();
    } else if (event.key >= '0' && event.key <= '9') {
      handleNumberInput(event.key);
    } else if (event.key === 'Backspace') {
      handleBackspace();
    }
  };

  // Botones numéricos
  const numberButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            className="relative bg-[#111] rounded-2xl border border-white/10 shadow-2xl w-full max-w-sm"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            role="dialog"
            aria-labelledby="keypad-title"
            aria-describedby="keypad-description"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <h2 id="keypad-title" className="text-xl font-bold text-white mb-2">
                Escribe el tiempo (mmss)
              </h2>
              <p id="keypad-description" className="text-sm text-white/60">
                Ingresa el tiempo en formato mmss (ej: 0130 para 1:30)
              </p>
            </div>

            {/* Display del tiempo */}
            <div className="p-6 text-center">
              <div className="mb-4">
                <div className="text-3xl font-mono text-white mb-2">
                  {displayValue}
                </div>
                <div className="text-sm text-white/60">
                  {input || '0000'}
                </div>
              </div>

              {/* Indicador de validación */}
              <motion.div
                className={`text-sm font-medium ${
                  isValid ? 'text-green-400' : 'text-red-400'
                }`}
                animate={{ 
                  opacity: isValid ? 1 : 0.7,
                  scale: isValid ? 1 : 0.95
                }}
              >
                {isValid ? '✓ Tiempo válido' : '⚠ Tiempo inválido'}
              </motion.div>
            </div>

            {/* Teclado numérico */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {numberButtons.map((digit, index) => (
                  <motion.button
                    key={digit}
                    ref={index === 0 ? firstButtonRef : undefined}
                    className="
                      w-full h-12 rounded-xl bg-white/10 border border-white/20
                      text-white text-xl font-bold hover:bg-white/20
                      active:bg-white/30 transition-colors duration-150
                      touch-manipulation
                    "
                    onClick={() => handleNumberInput(digit)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Número ${digit}`}
                  >
                    {digit}
                  </motion.button>
                ))}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <motion.button
                  className="
                    flex-1 h-12 rounded-xl bg-red-500/20 border border-red-500/40
                    text-red-400 font-bold hover:bg-red-500/30
                    active:bg-red-500/40 transition-colors duration-150
                    touch-manipulation
                  "
                  onClick={handleBackspace}
                  disabled={input === ''}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label="Borrar último dígito"
                >
                  ⌫ Borrar
                </motion.button>

                <motion.button
                  className="
                    flex-1 h-12 rounded-xl bg-green-500/20 border border-green-500/40
                    text-green-400 font-bold hover:bg-green-500/30
                    active:bg-green-500/40 transition-colors duration-150
                    touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  onClick={handleConfirm}
                  disabled={!isValid || input === ''}
                  whileHover={{ scale: isValid && input !== '' ? 1.02 : 1 }}
                  whileTap={{ scale: isValid && input !== '' ? 0.98 : 1 }}
                  aria-label="Confirmar tiempo"
                >
                  ✓ Confirmar
                </motion.button>
              </div>
            </div>

            {/* Botón cerrar */}
            <motion.button
              className="
                absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10
                flex items-center justify-center text-white/60 hover:text-white
                hover:bg-white/20 transition-colors duration-150
              "
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Cerrar teclado"
            >
              ×
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KeypadModal;
