import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeSliderProps {
  volume: number; // 0-100
  onVolumeChange: (volume: number) => void;
  isPlaying: boolean;
  className?: string;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({
  volume,
  onVolumeChange,
  isPlaying,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastVolume, setLastVolume] = useState(50); // Para el toggle mute
  const sliderRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pressStartTime = useRef<number>(0);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // Detectar clic rápido vs mantener presionado (desktop y móvil con Pointer Events)
  const handlePressStart = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    pressStartTime.current = Date.now();
    // Timer para mostrar slider después de 250ms (ligeramente mayor para evitar falsos positivos en móvil)
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setIsOpen(true);
    }, 250);
  };

  const handlePressEnd = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    const pressDuration = Date.now() - pressStartTime.current;
    // Si fue un toque/clic rápido (< 250ms), hacer toggle mute
    if (pressDuration < 250) {
      if (volume === 0) {
        onVolumeChange(lastVolume);
      } else {
        setLastVolume(volume);
        onVolumeChange(0);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  // Cerrar slider al hacer clic o tocar fuera
  useEffect(() => {
    const handlePointerOutside = (event: Event) => {
      if (
        isOpen &&
        sliderRef.current &&
        buttonRef.current &&
        !sliderRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerOutside, { passive: true });
      document.addEventListener('touchstart', handlePointerOutside, { passive: true });
      return () => {
        document.removeEventListener('mousedown', handlePointerOutside as any);
        document.removeEventListener('touchstart', handlePointerOutside as any);
      };
    }
  }, [isOpen]);

  // Calcular posición del indicador
  const getIndicatorPosition = (vol: number) => {
    return ((100 - vol) / 100) * 180; // 180px es la altura del track
  };

  // Manejar clic/toque en el track
  const handleTrackPress = (clientY: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, ((rect.height - y) / rect.height) * 100));
    const roundedPercentage = Math.round(percentage / 10) * 10; // Redondear a múltiplos de 10
    onVolumeChange(roundedPercentage);
  };

  // Manejar arrastre (pointer events para soportar mouse y touch)
  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    handleTrackPress(e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
  };

  const handlePointerDownTrack = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    handleTrackPress(e.clientY);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });
  };

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Botón de volumen */}
      <button
        ref={buttonRef}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onContextMenu={handleContextMenu}
        className={`flex items-center gap-2 transition-colors ${
          volume === 0 ? 'text-red-400 hover:text-red-300' : 'text-white/60 hover:text-white'
        }`}
        title="Clic rápido: silenciar/activar | Mantener: control de volumen"
      >
        {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Slider */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={sliderRef}
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50"
          >
            <div className="bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl">
              {/* Indicador de porcentaje */}
              <div className="text-center mb-3">
                <div className="text-white font-mono text-lg font-bold">
                  {volume}%
                </div>
                <div className="text-white/60 text-xs">
                  {volume === 0 ? 'Silenciado' : isPlaying ? 'Reproduciendo' : 'Pausado'}
                </div>
              </div>

              {/* Track del slider */}
              <div
                className="relative w-12 h-48 bg-gradient-to-t from-red-500/20 via-yellow-500/20 to-green-500/20 rounded-full border border-white/20 cursor-pointer"
                onPointerDown={handlePointerDownTrack}
              >
                {/* Marcas cada 10% */}
                {Array.from({ length: 11 }, (_, i) => {
                  const percentage = i * 10;
                  const position = getIndicatorPosition(percentage);
                  return (
                    <div
                      key={percentage}
                      className="absolute w-1 h-1 bg-white/40 rounded-full transform -translate-x-1/2"
                      style={{ top: `${position}px` }}
                    />
                  );
                })}

                {/* Indicador principal */}
                <motion.div
                  className="absolute w-6 h-6 bg-white rounded-full shadow-lg border-2 border-white/20 transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                  style={{
                    top: `${getIndicatorPosition(volume)}px`,
                    left: '50%'
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-gray-200" />
                </motion.div>

                {/* Línea de progreso */}
                <div
                  className="absolute w-1 bg-white rounded-full transform -translate-x-1/2"
                  style={{
                    top: `${getIndicatorPosition(volume)}px`,
                    height: `${180 - getIndicatorPosition(volume)}px`,
                    left: '50%'
                  }}
                />
              </div>

              {/* Botones de atajo */}
              <div className="flex justify-center gap-1 mt-3">
                {[0, 25, 50, 75, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => onVolumeChange(value)}
                    className={`w-6 h-6 rounded-full text-xs font-mono transition-all ${
                      volume === value
                        ? 'bg-white text-black'
                        : 'bg-white/20 text-white/80 hover:bg-white/30'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VolumeSlider;
