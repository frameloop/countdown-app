/**
 * Componente PresetGridModal - Modal con grid de todos los presets
 * 
 * Características:
 * - Grid de presets con scroll
 * - Presets personalizados con opción de eliminar
 * - Búsqueda y filtrado
 * - Accesibilidad con focus management
 * - Animaciones de entrada y salida
 */

import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PresetGridModalProps, CustomPreset } from '../../types';
import { formatTime } from '../utils/time';
import { DEFAULT_PRESETS } from '../../data/presets';

export const PresetGridModal: FC<PresetGridModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  customPresets,
  onDeleteCustom
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPresets, setFilteredPresets] = useState([...DEFAULT_PRESETS, ...customPresets]);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus management para accesibilidad
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filtrar presets basado en búsqueda
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const allPresets = [...DEFAULT_PRESETS, ...customPresets];
    
    if (query === '') {
      setFilteredPresets(allPresets);
    } else {
      const filtered = allPresets.filter(preset =>
        preset.label.toLowerCase().includes(query) ||
        preset.emoji.includes(query) ||
        formatTime(preset.seconds).includes(query)
      );
      setFilteredPresets(filtered);
    }
  }, [searchQuery, customPresets]);

  // Manejar selección de preset
  const handleSelect = (preset: typeof DEFAULT_PRESETS[0] | CustomPreset) => {
    onSelect(preset);
    onClose();
  };

  // Manejar eliminación de preset personalizado
  const handleDeleteCustom = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onDeleteCustom(id);
  };

  // Manejar teclado
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

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
            className="relative bg-[#111] rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            role="dialog"
            aria-labelledby="preset-grid-title"
            aria-describedby="preset-grid-description"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <h2 id="preset-grid-title" className="text-xl font-bold text-white mb-2">
                Todos los presets
              </h2>
              <p id="preset-grid-description" className="text-sm text-white/60 mb-4">
                Selecciona un preset o busca por nombre
              </p>

              {/* Búsqueda */}
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar presets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="
                    w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20
                    text-white placeholder-white/40 focus:outline-none focus:border-white/40
                    transition-colors duration-200
                  "
                  aria-label="Buscar presets"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40">
                  🔍
                </div>
              </div>
            </div>

            {/* Grid de presets */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {filteredPresets.map((preset, index) => (
                    <motion.div
                      key={preset.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="
                        relative group cursor-pointer
                        bg-white/5 border border-white/10 rounded-xl p-4
                        hover:bg-white/10 hover:border-white/20
                        transition-all duration-200 touch-manipulation
                        min-h-[100px] flex flex-col items-center justify-center
                      "
                      onClick={() => handleSelect(preset)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Seleccionar preset ${preset.label} (${formatTime(preset.seconds)})`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelect(preset);
                        }
                      }}
                    >
                      {/* Emoji */}
                      <motion.span
                        className="text-3xl mb-2"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {preset.emoji}
                      </motion.span>

                      {/* Label */}
                      <div className="text-sm font-medium text-white text-center mb-1">
                        {(preset as any).label}
                      </div>

                      {/* Tiempo */}
                      <div className="text-xs text-white/60 font-mono">
                        {formatTime((preset as any).seconds)}
                      </div>

                      {/* Indicador de preset personalizado */}
                      {'isCustom' in preset && preset.isCustom && (
                        <div className="absolute top-2 right-2">
                          <span className="text-xs text-blue-400">★</span>
                        </div>
                      )}

                      {/* Botón eliminar para presets personalizados */}
                      {'isCustom' in preset && preset.isCustom && (
                        <motion.button
                          className="
                            absolute top-2 left-2 w-6 h-6 rounded-full
                            bg-red-500/20 border border-red-500/40
                            text-red-400 text-xs font-bold
                            hover:bg-red-500/30 active:bg-red-500/40
                            opacity-0 group-hover:opacity-100
                            transition-opacity duration-200
                          "
                          onClick={(e) => handleDeleteCustom(preset.id, e)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label={`Eliminar preset ${preset.label}`}
                        >
                          ×
                        </motion.button>
                      )}

                      {/* Efecto hover */}
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100"
                        transition={{ duration: 0.2 }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Mensaje si no hay resultados */}
              {filteredPresets.length === 0 && (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-4xl mb-4">🔍</div>
                  <div className="text-white/60">
                    No se encontraron presets
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10">
              <motion.button
                className="
                  w-full py-3 rounded-xl bg-white/10 border border-white/20
                  text-white font-medium hover:bg-white/20
                  active:bg-white/30 transition-colors duration-150
                "
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cerrar
              </motion.button>
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
              aria-label="Cerrar modal"
            >
              ×
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PresetGridModal;
